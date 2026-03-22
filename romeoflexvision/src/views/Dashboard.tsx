import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { loadSceneOpsSnapshot } from '../lib/sceneOps';
import type { SceneOpsSnapshot } from '../types';

// ---- ISA-101 color helpers ----
function getSignalColor(value: number, warn: number, alert: number) {
  if (value >= alert) return '#ef4444';
  if (value >= warn) return '#d97706';
  return '#6b7280';
}

// ---- Per-server metric profiles ----
const SERVER_PROFILES = {
  all:   { cpuBase: 45, cpuVar: 20, gpuBase: 72, gpuVar: 15 },
  gpu01: { cpuBase: 28, cpuVar:  8, gpuBase: 91, gpuVar:  6 },
  gpu02: { cpuBase: 33, cpuVar: 11, gpuBase: 68, gpuVar: 18 },
  cpu01: { cpuBase: 79, cpuVar: 12, gpuBase: 14, gpuVar:  4 },
} as const;

// ---- Mock data generators ----
function genTimeSeries(points = 20, base = 40, variance = 15) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    t: new Date(now - (points - i) * 60000).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    v: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
  }));
}

function genTokenData(days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      day: d.toLocaleDateString('ru', { weekday: 'short' }),
      input: Math.round(120000 + Math.random() * 80000),
      output: Math.round(40000 + Math.random() * 30000),
      cached: Math.round(30000 + Math.random() * 40000),
    };
  });
}

// ---- Custom tooltip ----
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg p-3 text-xs font-mono">
      <div className="text-text-muted mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-text-secondary">{p.name || p.dataKey}:</span>
          <span className="text-text-primary font-semibold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ---- Components ----
function MetricCard({ label, value, unit, warn, alert, suffix = '' }: {
  label: string; value: number; unit?: string; warn?: number; alert?: number; suffix?: string;
}) {
  const color = warn !== undefined && alert !== undefined ? getSignalColor(value, warn, alert) : '#cdd6f4';
  return (
    <div className="glass-panel p-4">
      <div className="metric-label mb-2">{label}</div>
      <div className="font-mono text-3xl font-semibold leading-none" style={{ color }}>
        {value.toFixed(value < 10 ? 1 : 0)}<span className="text-lg text-text-muted font-normal ml-1">{unit || suffix}</span>
      </div>
      {warn !== undefined && (
        <div className="mt-2 h-1 bg-bg-card rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [server, setServer] = useState<keyof typeof SERVER_PROFILES>('all');
  const [cpuData, setCpuData] = useState(() => {
    const p = SERVER_PROFILES.all;
    return genTimeSeries(20, p.cpuBase, p.cpuVar);
  });
  const [gpuData, setGpuData] = useState(() => {
    const p = SERVER_PROFILES.all;
    return genTimeSeries(20, p.gpuBase, p.gpuVar);
  });
  const [tokenData] = useState(() => genTokenData(7));
  const [sceneOps, setSceneOps] = useState<SceneOpsSnapshot | null>(null);
  const [sceneOpsError, setSceneOpsError] = useState<string | null>(null);

  // Reset + live update when server changes
  useEffect(() => {
    const p = SERVER_PROFILES[server];
    setCpuData(genTimeSeries(20, p.cpuBase, p.cpuVar));
    setGpuData(genTimeSeries(20, p.gpuBase, p.gpuVar));

    const interval = setInterval(() => {
      const t = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
      setCpuData(prev => [...prev.slice(-19), {
        t, v: Math.max(0, Math.min(100, p.cpuBase + (Math.random() - 0.5) * p.cpuVar * 2)),
      }]);
      setGpuData(prev => [...prev.slice(-19), {
        t, v: Math.max(0, Math.min(100, p.gpuBase + (Math.random() - 0.5) * p.gpuVar * 2)),
      }]);
    }, 3000);
    return () => clearInterval(interval);
  }, [server]);

  useEffect(() => {
    let cancelled = false;

    loadSceneOpsSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        setSceneOps(snapshot);
        setSceneOpsError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setSceneOpsError(error instanceof Error ? error.message : 'SceneOps unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const latestCpu = cpuData[cpuData.length - 1]?.v ?? 0;
  const latestGpu = gpuData[gpuData.length - 1]?.v ?? 0;

  const totalInput = tokenData.reduce((s, d) => s + d.input, 0);
  const totalOutput = tokenData.reduce((s, d) => s + d.output, 0);
  const totalCached = tokenData.reduce((s, d) => s + d.cached, 0);
  const cacheHitRate = ((totalCached / (totalInput + totalCached)) * 100).toFixed(1);
  const totalCost = ((totalInput / 1_000_000) * 3 + (totalOutput / 1_000_000) * 15).toFixed(2);
  const savedCost = ((totalCached / 1_000_000) * 3 * 0.9).toFixed(2);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Мониторинг & FinOps</h1>
            <p className="text-xs text-text-muted mt-0.5">Методология USE · ISA-101 HMI · Обновление каждые 3с</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={server} onChange={e => setServer(e.target.value as keyof typeof SERVER_PROFILES)}
              className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-blue transition-colors">
              <option value="all">Все серверы</option>
              <option value="gpu01">GPU-01</option>
              <option value="gpu02">GPU-02</option>
              <option value="cpu01">CPU-01</option>
            </select>
            <div className="flex items-center gap-1.5 text-xs text-accent-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* USE Metrics — ISA-101: grey = normal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="CPU Utilization" value={latestCpu} unit="%" warn={80} alert={95} />
          <MetricCard label="GPU Utilization" value={latestGpu} unit="%" warn={85} alert={95} />
          <MetricCard label="Task Queue Depth" value={3} warn={10} alert={20} suffix=" задач" />
          <MetricCard label="HW Errors (24h)" value={0} warn={1} alert={5} suffix=" err" />
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="metric-label mb-1">SceneOps Control Loop</div>
              <div className="text-xs text-text-muted">
                PinoCut scene bundle -&gt; Andrew review -&gt; Bassito execution
              </div>
            </div>
            <span className="tag border border-border-subtle text-text-muted">
              {sceneOps?.source === 'api' ? 'API feed' : 'Mock feed'}
            </span>
          </div>

          {sceneOps ? (
            <div className="grid md:grid-cols-4 gap-3">
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">Scene</div>
                <div className="text-sm font-medium text-text-primary">{sceneOps.scene.sceneId}</div>
                <div className="text-xs text-text-muted mt-1">{sceneOps.scene.editingTemplate}</div>
              </div>
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">Andrew</div>
                <div className="text-sm font-medium text-text-primary">
                  {Math.round(sceneOps.andrew.confidence * 100)}% confidence
                </div>
                <div className="text-xs text-text-muted mt-1">HITL: {sceneOps.andrew.hitlDecision}</div>
              </div>
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">Bassito</div>
                <div className="text-sm font-medium text-text-primary">{sceneOps.bassitoJobs.length} jobs</div>
                <div className="text-xs text-text-muted mt-1">
                  {sceneOps.bassitoJobs.filter((job) => job.status === 'queued' || job.status === 'running').length} active
                </div>
              </div>
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">Duration Drift</div>
                <div className="text-sm font-medium text-text-primary">
                  {(sceneOps.scene.actualDurationSec - sceneOps.scene.targetDurationSec).toFixed(1)}s
                </div>
                <div className="text-xs text-text-muted mt-1">
                  target {sceneOps.scene.targetDurationSec.toFixed(1)}s
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-muted">
              {sceneOpsError ?? 'Loading SceneOps control loop...'}
            </div>
          )}
        </div>

        {/* CPU + GPU charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="metric-label">CPU Utilization</span>
              <span className="font-mono text-sm" style={{ color: getSignalColor(latestCpu, 80, 95) }}>
                {latestCpu.toFixed(1)}%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={cpuData}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#323a52" />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="v" name="CPU %" stroke="#6b7280" fill="url(#cpuGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="metric-label">GPU Utilization</span>
              <span className="font-mono text-sm" style={{ color: getSignalColor(latestGpu, 85, 95) }}>
                {latestGpu.toFixed(1)}%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={gpuData}>
                <defs>
                  <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#323a52" />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="v" name="GPU %" stroke="#6b7280" fill="url(#gpuGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Observability / FinOps */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">Затраты (7 дней)</div>
            <div className="font-mono text-3xl font-semibold text-text-primary">${totalCost}</div>
            <div className="text-xs text-accent-cyan mt-1">Сэкономлено на кэше: ${savedCost}</div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">Cache Hit Rate</div>
            <div className="font-mono text-3xl font-semibold text-accent-cyan">{cacheHitRate}%</div>
            <div className="mt-2 h-1.5 bg-bg-card rounded-full overflow-hidden">
              <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${cacheHitRate}%` }} />
            </div>
            <div className="text-xs text-text-muted mt-1">{(totalCached / 1000).toFixed(0)}K кэш-токенов</div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">Всего токенов (7 дней)</div>
            <div className="font-mono text-3xl font-semibold text-text-primary">
              {((totalInput + totalOutput + totalCached) / 1_000_000).toFixed(2)}M
            </div>
            <div className="flex gap-3 text-xs mt-1">
              <span className="text-text-muted">In: <span className="text-text-secondary">{(totalInput / 1000).toFixed(0)}K</span></span>
              <span className="text-text-muted">Out: <span className="text-text-secondary">{(totalOutput / 1000).toFixed(0)}K</span></span>
            </div>
          </div>
        </div>

        {/* Token consumption chart */}
        <div className="glass-panel p-5">
          <div className="metric-label mb-4">Token Consumption — Input / Output / Cached (7 дней)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tokenData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#323a52" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6c7086' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} width={50}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<DarkTooltip />} />
              <Legend
                iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: '#a6adc8', fontSize: 11 }}>{v}</span>}
              />
              <Bar dataKey="input" name="Input tokens" fill="#6b7280" radius={[2, 2, 0, 0]} />
              <Bar dataKey="output" name="Output tokens" fill="#4b5563" radius={[2, 2, 0, 0]} />
              <Bar dataKey="cached" name="Cached tokens" fill="#73daca" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-text-muted">
            * Кэшированные токены тарифицируются по сниженной ставке. Высокий Cache Hit Rate снижает затраты на LLM.
          </div>
        </div>

        {/* Agent cost breakdown */}
        <div className="glass-panel p-5">
          <div className="metric-label mb-4">Затраты по агентам</div>
          <div className="space-y-2">
            {[
              { name: 'Andrew Analytic', cost: 12.40, pct: 38, color: '#73daca' },
              { name: 'Romeo PhD', cost: 9.80, pct: 30, color: '#9d7cd8' },
              { name: 'Robo QC', cost: 6.20, pct: 19, color: '#7aa2f7' },
              { name: 'Bassito Animator', cost: 2.60, pct: 8, color: '#ff9e64' },
              { name: 'Переводчик', cost: 1.60, pct: 5, color: '#b4f9f8' },
            ].map(a => (
              <div key={a.name} className="flex items-center gap-3">
                <div className="w-28 text-xs text-text-secondary truncate">{a.name}</div>
                <div className="flex-1 h-2 bg-bg-card rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color, opacity: 0.7 }} />
                </div>
                <div className="font-mono text-xs text-text-primary w-14 text-right">${a.cost.toFixed(2)}</div>
                <div className="text-xs text-text-muted w-8 text-right">{a.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
