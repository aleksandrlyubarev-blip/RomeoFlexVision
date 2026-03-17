import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Task } from '../types';

// ---- DB row type (matches the SQL schema) ----
interface DbTask {
  id: string;
  user_id: string;
  title: string;
  agent_id: string;
  status: Task['status'];
  progress: number;
  result: Record<string, unknown> | null;
  created_at: string;
}

function dbToTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    assignedTo: row.agent_id,
    status: row.status,
    progress: row.progress,
    createdAt: new Date(row.created_at).toLocaleTimeString('ru', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
  };
}

// ---- Demo mode helpers (localStorage) ----
const LS_KEY = 'rfv_demo_tasks';

function loadDemoTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDemoTasks(tasks: Task[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

// ---- Hook ----
export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate task progress (works in both demo and real mode)
  const startTicker = useCallback(() => {
    if (tickerRef.current) return;
    tickerRef.current = setInterval(() => {
      setTasks(prev => {
        const updated = prev.map(t => {
          if (t.status === 'running' && t.progress < 100) {
            const next = Math.min(100, t.progress + Math.ceil(Math.random() * 3));
            const status: Task['status'] = next === 100 ? 'completed' : 'running';
            return { ...t, progress: next, status };
          }
          return t;
        });
        // If Supabase configured — sync completed tasks back to DB
        if (isSupabaseConfigured && user) {
          updated.forEach(t => {
            const prev = tasks.find(p => p.id === t.id);
            if (prev && prev.status !== t.status) {
              supabase.from('tasks').update({ status: t.status, progress: t.progress })
                .eq('id', t.id).then(() => {});
            }
          });
        } else {
          saveDemoTasks(updated);
        }
        return updated;
      });
    }, 400);
  }, [user, tasks]);

  useEffect(() => {
    startTicker();
    return () => { if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; } };
  }, [startTicker]);

  // Load tasks
  useEffect(() => {
    if (!user) { setTasks([]); setLoading(false); return; }

    if (!isSupabaseConfigured) {
      setTasks(loadDemoTasks());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setTasks((data as DbTask[]).map(dbToTask));
        setLoading(false);
      });

    // Real-time subscription
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as DbTask;
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [dbToTask(row), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === row.id ? dbToTask(row) : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== (payload.old as DbTask).id));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Add task
  const addTask = useCallback(async (title: string, agentId = 'orchestrator'): Promise<Task | null> => {
    if (!user) return null;

    const now = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!isSupabaseConfigured) {
      const task: Task = {
        id: `demo-${Date.now()}`,
        title: title.slice(0, 100),
        assignedTo: agentId,
        status: 'running',
        progress: 0,
        createdAt: now,
      };
      setTasks(prev => { const next = [task, ...prev]; saveDemoTasks(next); return next; });
      return task;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, title: title.slice(0, 100), agent_id: agentId, status: 'running', progress: 0 })
      .select()
      .single();
    if (error || !data) return null;
    return dbToTask(data as DbTask);
  }, [user]);

  // Approve task (human-in-the-loop)
  const approveTask = useCallback(async (taskId: string) => {
    if (!isSupabaseConfigured) {
      setTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, status: 'completed' as Task['status'], progress: 100 } : t);
        saveDemoTasks(updated);
        return updated;
      });
      return;
    }
    await supabase.from('tasks').update({ status: 'completed', progress: 100 }).eq('id', taskId);
  }, []);

  // Clear completed
  const clearCompleted = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setTasks(prev => { const next = prev.filter(t => t.status !== 'completed'); saveDemoTasks(next); return next; });
      return;
    }
    await supabase.from('tasks').delete().eq('status', 'completed').eq('user_id', user?.id ?? '');
  }, [user]);

  return { tasks, loading, addTask, approveTask, clearCompleted };
}
