import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useTasks } from '../hooks/useTasks';
import { useI18n } from '../context/I18nContext';

// ---- ISA-101 color helpers ----
function getSignalColor(value: number, warn: number, alert: number) {
  if (value >= alert) return '#ef4444';
  if (value >= warn) return '#d97706';
  return '#6b7280';
}

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
  const { tasks } = useTasks();
  const { t } = useI18n();
  const [cpuData, setCpuData] = useState(() => genTimeSeries(20, 45, 20));
  const [gpuData, setGpuData] = useState(() => genTimeSeries(20, 72, 15));
  const [tokenData] = useState(() => genTokenData(7));
  const [server, setServer] = useState('all');

  const queueDepth = tasks.filter(t => t.status === 'queued' || t.status === 'running').length;

  // Live update
  useEffect(() => {
    const interval = setInterval(() => {
      const addPoint = (prev: typeof cpuData, base: number, variance: number) => {
        const newPoint = {
          t: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
          v: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
        };
        return [...prev.slice(-19), newPoint];
      };
      setCpuData(prev => addPoint(prev, 45, 20));
      setGpuData(prev => addPoint(prev, 72, 15));
    }, 3000);
    return () => clearInterval(interval);
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
            <h1 className="text-xl font-semibold text-text-primary">{t.dashboard.title}</h1>
            <p className="text-xs text-text-muted mt-0.5">{t.dashboard.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={server} onChange={e => setServer(e.target.value)}
              className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-blue transition-colors">
              <option value="all">{t.dashboard.allServers}</option>
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
          <MetricCard label="Task Queue Depth" value={queueDepth} warn={10} alert={20} suffix={` ${t.workspace.tasks}`} />
          <MetricCard label="HW Errors (24h)" value={0} warn={1} alert={5} suffix=" err" />
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
            <div className="metric-label mb-1">{t.dashboard.costs7d}</div>
            <div className="font-mono text-3xl font-semibold text-text-primary">${totalCost}</div>
            <div className="text-xs text-accent-cyan mt-1">{t.dashboard.savedCache}: ${savedCost}</div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">{t.dashboard.cacheHit}</div>
            <div className="font-mono text-3xl font-semibold text-accent-cyan">{cacheHitRate}%</div>
            <div className="mt-2 h-1.5 bg-bg-card rounded-full overflow-hidden">
              <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${cacheHitRate}%` }} />
            </div>
            <div className="text-xs text-text-muted mt-1">{(totalCached / 1000).toFixed(0)}K {t.dashboard.cacheTokens}</div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">{t.dashboard.totalTokens}</div>
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
          <div className="metric-label mb-4">{t.dashboard.tokenChart}</div>
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
          <div className="mt-2 text-xs text-text-muted">{t.dashboard.tokenNote}</div>
        </div>

        {/* Agent cost breakdown */}
        <div className="glass-panel p-5">
          <div className="metric-label mb-4">{t.dashboard.agentCosts}</div>
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
