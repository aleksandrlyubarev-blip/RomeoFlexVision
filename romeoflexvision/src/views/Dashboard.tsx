import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useTasks } from '../hooks/useTasks';
import { useMetrics, generate24h, type TimePoint } from '../hooks/useMetrics';
import { useI18n } from '../context/I18nContext';

// ---- ISA-101 color helpers ----
function getSignalColor(value: number, warn: number, alert: number) {
  if (value >= alert) return '#ef4444';
  if (value >= warn)  return '#d97706';
  return '#6b7280';
}

// ---- Live CPU/GPU generators ----
function genTimeSeries(points = 20, base = 40, variance = 15) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    t: new Date(now - (points - i) * 60000).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    v: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
  }));
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
          <span className="text-text-primary font-semibold">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ---- Metric card ----
function MetricCard({ label, value, unit, warn, alert, suffix = '' }: {
  label: string; value: number; unit?: string; warn?: number; alert?: number; suffix?: string;
}) {
  const color = warn !== undefined && alert !== undefined ? getSignalColor(value, warn, alert) : '#cdd6f4';
  return (
    <div className="glass-panel p-4">
      <div className="metric-label mb-2">{label}</div>
      <div className="font-mono text-3xl font-semibold leading-none" style={{ color }}>
        {value.toFixed(value < 10 ? 1 : 0)}
        <span className="text-lg text-text-muted font-normal ml-1">{unit || suffix}</span>
      </div>
      {warn !== undefined && (
        <div className="mt-2 h-1 bg-bg-card rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

// ---- Date range options ----
type Range = '24h' | '7d' | '30d';

const RANGE_LABELS: Record<Range, string> = { '24h': '24 ч', '7d': '7 дн', '30d': '30 дн' };

function getRangeData(range: Range, daily30d: TimePoint[]): TimePoint[] {
  if (range === '24h') return generate24h();
  if (range === '7d')  return daily30d.slice(-7);
  return daily30d;
}

// ---- Main ----
export default function Dashboard() {
  const { tasks } = useTasks();
  const { t } = useI18n();
  const {
    daily30d,
    totalCost,
    totalCached,
    agentSpend,
  } = useMetrics();

  const [cpuData, setCpuData] = useState(() => genTimeSeries(20, 45, 20));
  const [gpuData, setGpuData] = useState(() => genTimeSeries(20, 72, 15));
  const [server, setServer] = useState('all');
  const [range, setRange] = useState<Range>('7d');

  const queueDepth = tasks.filter(t => t.status === 'queued' || t.status === 'running').length;

  // Live CPU/GPU
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

  // Token chart data for selected range
  const tokenChartData = getRangeData(range, daily30d);

  // Aggregates for selected range
  const rangeInput  = tokenChartData.reduce((s, d) => s + d.input, 0);
  const rangeOutput = tokenChartData.reduce((s, d) => s + d.output, 0);
  const rangeCached = tokenChartData.reduce((s, d) => s + d.cached, 0);
  const rangeCost   = tokenChartData.reduce((s, d) => s + d.cost, 0);
  const rangeCacheHit = ((rangeCached / (rangeInput + rangeOutput + rangeCached)) * 100).toFixed(1);
  const savedCost   = ((totalCached / 1_000_000) * 1.5 * 0.9).toFixed(2);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{t.dashboard.title}</h1>
            <p className="text-xs text-text-muted mt-0.5">{t.dashboard.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Server filter */}
            <select value={server} onChange={e => setServer(e.target.value)}
              className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-blue transition-colors">
              <option value="all">{t.dashboard.allServers}</option>
              <option value="gpu01">GPU-01</option>
              <option value="gpu02">GPU-02</option>
              <option value="cpu01">CPU-01</option>
            </select>
            {/* Date range filter */}
            <div className="flex gap-1 bg-bg-card border border-border-subtle rounded-lg p-1">
              {(['24h', '7d', '30d'] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                    range === r
                      ? 'bg-accent-blue bg-opacity-20 text-accent-blue'
                      : 'text-text-muted hover:text-text-primary'
                  }`}>
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-accent-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* USE Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="CPU Utilization" value={latestCpu} unit="%" warn={80} alert={95} />
          <MetricCard label="GPU Utilization" value={latestGpu} unit="%" warn={85} alert={95} />
          <MetricCard label="Task Queue Depth" value={queueDepth} warn={10} alert={20} suffix={` ${t.workspace.tasks}`} />
          <MetricCard label="HW Errors (24h)" value={0} warn={1} alert={5} suffix=" err" />
        </div>

        {/* CPU + GPU charts */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'CPU Utilization', data: cpuData, color: '#6b7280', warn: 80, alert: 95, latest: latestCpu, gradId: 'cpuGrad' },
            { label: 'GPU Utilization', data: gpuData, color: '#6b7280', warn: 85, alert: 95, latest: latestGpu, gradId: 'gpuGrad' },
          ].map(({ label, data, color, warn, alert, latest, gradId }) => (
            <div key={label} className="glass-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="metric-label">{label}</span>
                <span className="font-mono text-sm" style={{ color: getSignalColor(latest, warn, alert) }}>
                  {latest.toFixed(1)}%
                </span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#323a52" />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area type="monotone" dataKey="v" stroke={color} fill={`url(#${gradId})`} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        {/* AI Observability — range-aware */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">
              {t.dashboard.costs7d} · <span className="text-accent-blue">{RANGE_LABELS[range]}</span>
            </div>
            <div className="font-mono text-3xl font-semibold text-text-primary">${rangeCost.toFixed(2)}</div>
            <div className="text-xs text-accent-cyan mt-1">{t.dashboard.savedCache}: ${savedCost}</div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">{t.dashboard.cacheHit}</div>
            <div className="font-mono text-3xl font-semibold text-accent-cyan">{rangeCacheHit}%</div>
            <div className="mt-2 h-1.5 bg-bg-card rounded-full overflow-hidden">
              <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${rangeCacheHit}%` }} />
            </div>
            <div className="text-xs text-text-muted mt-1">{(rangeCached / 1000).toFixed(0)}K {t.dashboard.cacheTokens}</div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">{t.dashboard.totalTokens}</div>
            <div className="font-mono text-3xl font-semibold text-text-primary">
              {((rangeInput + rangeOutput + rangeCached) / 1_000_000).toFixed(2)}M
            </div>
            <div className="flex gap-3 text-xs mt-1">
              <span className="text-text-muted">In: <span className="text-text-secondary">{(rangeInput / 1000).toFixed(0)}K</span></span>
              <span className="text-text-muted">Out: <span className="text-text-secondary">{(rangeOutput / 1000).toFixed(0)}K</span></span>
            </div>
          </div>
        </div>

        {/* Token consumption chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="metric-label">{t.dashboard.tokenChart}</span>
            <span className="text-xs text-text-muted">{RANGE_LABELS[range]}</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={tokenChartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#323a52" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false}
                interval={range === '30d' ? 4 : range === '7d' ? 0 : 3} />
              <YAxis tick={{ fontSize: 10, fill: '#6c7086' }} axisLine={false} tickLine={false} width={50}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: '#a6adc8', fontSize: 11 }}>{v}</span>} />
              <Bar dataKey="input"  name="Input"  fill="#6b7280" radius={[2, 2, 0, 0]} />
              <Bar dataKey="output" name="Output" fill="#4b5563" radius={[2, 2, 0, 0]} />
              <Bar dataKey="cached" name="Cached" fill="#73daca" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-text-muted">{t.dashboard.tokenNote}</div>
        </div>

        {/* Agent cost breakdown — same data as FinOps */}
        <div className="glass-panel p-5">
          <div className="metric-label mb-4">{t.dashboard.agentCosts}</div>
          <div className="space-y-2">
            {agentSpend.slice().sort((a, b) => b.costUsd - a.costUsd).map(a => {
              const pct = Math.round(a.costUsd / totalCost * 100);
              const COLOR: Record<string, string> = {
                'romeo-phd': '#9d7cd8', 'robo-qc': '#7aa2f7', 'andrew-analytic': '#73daca',
                'bassito-animator': '#ff9e64', 'perevodchik': '#b4f9f8', 'chertejnik': '#e0af68',
              };
              const color = COLOR[a.agentId] ?? '#7aa2f7';
              return (
                <div key={a.agentId} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-text-secondary truncate capitalize">{a.agentId.replace(/-/g, ' ')}</div>
                  <div className="flex-1 h-2 bg-bg-card rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }} />
                  </div>
                  <div className="font-mono text-xs text-text-primary w-14 text-right">${a.costUsd.toFixed(2)}</div>
                  <div className="text-xs text-text-muted w-8 text-right">{pct}%</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between text-xs text-text-muted">
            <span>7-day total</span>
            <span className="font-mono text-text-primary">${totalCost.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
