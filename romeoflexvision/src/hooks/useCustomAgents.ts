import { useState } from 'react';
import type { Agent } from '../types';

const LS_KEY = 'rfv_custom_agents';

function loadAgents(): Agent[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

function persistAgents(agents: Agent[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(agents));
}

export function useCustomAgents() {
  const [customAgents, setCustomAgents] = useState<Agent[]>(loadAgents);

  const saveAgent = (agent: Agent) => {
    setCustomAgents(prev => {
      const exists = prev.some(a => a.id === agent.id);
      const next = exists
        ? prev.map(a => a.id === agent.id ? agent : a)
        : [...prev, agent];
      persistAgents(next);
      return next;
    });
  };

  const deleteAgent = (id: string) => {
    setCustomAgents(prev => {
      const next = prev.filter(a => a.id !== id);
      persistAgents(next);
      return next;
    });
  };

  return { customAgents, saveAgent, deleteAgent };
}
