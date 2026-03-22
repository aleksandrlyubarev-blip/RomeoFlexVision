import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type Language, useLanguage } from '../context/LanguageContext';
import { getAgents } from '../data/agents';
import { loadSceneOpsSnapshot } from '../lib/sceneOps';
import type { SceneOpsSnapshot } from '../types';

function getSignalColor(value: number, warn: number, alert: number) {
  if (value >= alert) return '#ef4444';
  if (value >= warn) return '#d97706';
  return '#6b7280';
}

function buildTimeSeries(locale: string, points = 20, base = 40, variance = 15) {
  const now = Date.now();
  return Array.from({ length: points }, (_, index) => ({
    t: new Date(now - (points - index) * 60000).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }),
    v: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
  }));
}

function buildTokenData(locale: string, days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (days - 1 - index));
    return {
      day: day.toLocaleDateString(locale, { weekday: 'short' }),
      input: Math.round(120000 + Math.random() * 80000),
      output: Math.round(40000 + Math.random() * 30000),
      cached: Math.round(30000 + Math.random() * 40000),
    };
  });
}

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    servers: { all: string };
    live: string;
    metrics: {
      cpu: string;
      gpu: string;
      queueDepth: string;
      errors24h: string;
      tasks: string;
      err: string;
    };
    sceneOps: {
      title: string;
      subtitle: string;
      apiFeed: string;
      mockFeed: string;
      scene: string;
      andrew: string;
      bassito: string;
      durationDrift: string;
      confidence: string;
      hitl: string;
      jobs: string;
      active: string;
      target: string;
      loading: string;
    };
    finops: {
      spend7d: string;
      cacheSaved: string;
      cacheHitRate: string;
      cachedTokens: string;
      totalTokens7d: string;
      tokenConsumption: string;
      cachedNote: string;
      agentCosts: string;
      inputTokens: string;
      outputTokens: string;
      cachedTokensLegend: string;
    };
  }
> = {
  en: {
    title: 'Monitoring & FinOps',
    subtitle: 'USE methodology · ISA-101 HMI · refresh every 3s',
    servers: { all: 'All servers' },
    live: 'Live',
    metrics: {
      cpu: 'CPU utilization',
      gpu: 'GPU utilization',
      queueDepth: 'Task queue depth',
      errors24h: 'HW errors (24h)',
      tasks: 'tasks',
      err: 'err',
    },
    sceneOps: {
      title: 'SceneOps Control Loop',
      subtitle: 'PinoCut scene bundle -> Andrew review -> Bassito execution',
      apiFeed: 'API feed',
      mockFeed: 'Mock feed',
      scene: 'Scene',
      andrew: 'Andrew',
      bassito: 'Bassito',
      durationDrift: 'Duration drift',
      confidence: 'confidence',
      hitl: 'HITL',
      jobs: 'jobs',
      active: 'active',
      target: 'target',
      loading: 'Loading SceneOps control loop...',
    },
    finops: {
      spend7d: 'Spend (7 days)',
      cacheSaved: 'Saved by cache',
      cacheHitRate: 'Cache hit rate',
      cachedTokens: 'cached tokens',
      totalTokens7d: 'Total tokens (7 days)',
      tokenConsumption: 'Token consumption — input / output / cached (7 days)',
      cachedNote:
        'Cached tokens are billed at a discounted rate. A high cache hit rate reduces LLM spend.',
      agentCosts: 'Cost by agent',
      inputTokens: 'Input tokens',
      outputTokens: 'Output tokens',
      cachedTokensLegend: 'Cached tokens',
    },
  },
  ru: {
    title: 'Мониторинг и FinOps',
    subtitle: 'Методология USE · ISA-101 HMI · обновление каждые 3с',
    servers: { all: 'Все серверы' },
    live: 'Live',
    metrics: {
      cpu: 'Загрузка CPU',
      gpu: 'Загрузка GPU',
      queueDepth: 'Глубина очереди задач',
      errors24h: 'Ошибки HW (24ч)',
      tasks: 'задач',
      err: 'ош.',
    },
    sceneOps: {
      title: 'Контур SceneOps',
      subtitle: 'Сборка сцены PinoCut -> ревью Andrew -> выполнение Bassito',
      apiFeed: 'API feed',
      mockFeed: 'Mock feed',
      scene: 'Сцена',
      andrew: 'Andrew',
      bassito: 'Bassito',
      durationDrift: 'Отклонение длительности',
      confidence: 'уверенность',
      hitl: 'HITL',
      jobs: 'задач',
      active: 'активно',
      target: 'цель',
      loading: 'Загрузка контура SceneOps...',
    },
    finops: {
      spend7d: 'Затраты (7 дней)',
      cacheSaved: 'Сэкономлено кэшем',
      cacheHitRate: 'Cache Hit Rate',
      cachedTokens: 'кэш-токенов',
      totalTokens7d: 'Всего токенов (7 дней)',
      tokenConsumption: 'Потребление токенов — input / output / cached (7 дней)',
      cachedNote:
        'Кэшированные токены тарифицируются по сниженной ставке. Высокий Cache Hit Rate уменьшает затраты на LLM.',
      agentCosts: 'Затраты по агентам',
      inputTokens: 'Input tokens',
      outputTokens: 'Output tokens',
      cachedTokensLegend: 'Cached tokens',
    },
  },
  he: {
    title: 'ניטור ו-FinOps',
    subtitle: 'מתודולוגיית USE · ISA-101 HMI · רענון כל 3 שניות',
    servers: { all: 'כל השרתים' },
    live: 'Live',
    metrics: {
      cpu: 'ניצולת CPU',
      gpu: 'ניצולת GPU',
      queueDepth: 'עומק תור משימות',
      errors24h: 'שגיאות חומרה (24ש)',
      tasks: 'משימות',
      err: 'שג.',
    },
    sceneOps: {
      title: 'לולאת SceneOps',
      subtitle: 'חבילת סצנה של PinoCut -> סקירת Andrew -> ביצוע Bassito',
      apiFeed: 'API feed',
      mockFeed: 'Mock feed',
      scene: 'סצנה',
      andrew: 'Andrew',
      bassito: 'Bassito',
      durationDrift: 'סטיית משך',
      confidence: 'ביטחון',
      hitl: 'HITL',
      jobs: 'משימות',
      active: 'פעיל',
      target: 'יעד',
      loading: 'טוען את לולאת SceneOps...',
    },
    finops: {
      spend7d: 'עלות (7 ימים)',
      cacheSaved: 'נחסך בעזרת cache',
      cacheHitRate: 'Cache Hit Rate',
      cachedTokens: 'טוקנים שמורים',
      totalTokens7d: 'סך הטוקנים (7 ימים)',
      tokenConsumption: 'צריכת טוקנים — input / output / cached (7 ימים)',
      cachedNote:
        'טוקנים שמורים מחויבים בתעריף מוזל. שיעור cache גבוה מפחית את עלות ה-LLM.',
      agentCosts: 'עלות לפי סוכן',
      inputTokens: 'Input tokens',
      outputTokens: 'Output tokens',
      cachedTokensLegend: 'Cached tokens',
    },
  },
};

const STATUS_LABELS: Record<
  Language,
  Record<NonNullable<SceneOpsSnapshot['andrew']['hitlDecision']>, string>
> = {
  en: { approve: 'approve', reject: 'reject', modify: 'modify', skipped: 'skipped' },
  ru: { approve: 'approve', reject: 'reject', modify: 'modify', skipped: 'skipped' },
  he: { approve: 'approve', reject: 'reject', modify: 'modify', skipped: 'skipped' },
};

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg p-3 text-xs font-mono">
      <div className="text-text-muted mb-1.5">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{entry.name || entry.dataKey}:</span>
          <span className="text-text-primary font-semibold">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function MetricCard({
  label,
  value,
  unit,
  warn,
  alert,
  suffix = '',
}: {
  label: string;
  value: number;
  unit?: string;
  warn?: number;
  alert?: number;
  suffix?: string;
}) {
  const color =
    warn !== undefined && alert !== undefined ? getSignalColor(value, warn, alert) : '#cdd6f4';

  return (
    <div className="glass-panel p-4">
      <div className="metric-label mb-2">{label}</div>
      <div className="font-mono text-3xl font-semibold leading-none" style={{ color }}>
        {value.toFixed(value < 10 ? 1 : 0)}
        <span className="text-lg text-text-muted font-normal ml-1">{unit || suffix}</span>
      </div>
      {warn !== undefined && (
        <div className="mt-2 h-1 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { language, locale } = useLanguage();
  const copy = COPY[language];
  const agents = useMemo(() => getAgents(language), [language]);
  const [cpuData, setCpuData] = useState(() => buildTimeSeries(locale, 20, 45, 20));
  const [gpuData, setGpuData] = useState(() => buildTimeSeries(locale, 20, 72, 15));
  const [tokenData, setTokenData] = useState(() => buildTokenData(locale, 7));
  const [server, setServer] = useState('all');
  const [sceneOps, setSceneOps] = useState<SceneOpsSnapshot | null>(null);
  const [sceneOpsError, setSceneOpsError] = useState<string | null>(null);

  useEffect(() => {
    setCpuData(buildTimeSeries(locale, 20, 45, 20));
    setGpuData(buildTimeSeries(locale, 20, 72, 15));
    setTokenData(buildTokenData(locale, 7));
  }, [locale]);

  useEffect(() => {
    const interval = setInterval(() => {
      const addPoint = (previous: typeof cpuData, base: number, variance: number) => {
        const nextPoint = {
          t: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
          v: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
        };

        return [...previous.slice(-19), nextPoint];
      };

      setCpuData((previous) => addPoint(previous, 45, 20));
      setGpuData((previous) => addPoint(previous, 72, 15));
    }, 3000);

    return () => clearInterval(interval);
  }, [locale]);

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
        setSceneOpsError(error instanceof Error ? error.message : copy.sceneOps.loading);
      });

    return () => {
      cancelled = true;
    };
  }, [copy.sceneOps.loading]);

  const latestCpu = cpuData[cpuData.length - 1]?.v ?? 0;
  const latestGpu = gpuData[gpuData.length - 1]?.v ?? 0;

  const totalInput = tokenData.reduce((sum, day) => sum + day.input, 0);
  const totalOutput = tokenData.reduce((sum, day) => sum + day.output, 0);
  const totalCached = tokenData.reduce((sum, day) => sum + day.cached, 0);
  const cacheHitRate = ((totalCached / (totalInput + totalCached)) * 100).toFixed(1);
  const totalCost = ((totalInput / 1_000_000) * 3 + (totalOutput / 1_000_000) * 15).toFixed(2);
  const savedCost = ((totalCached / 1_000_000) * 3 * 0.9).toFixed(2);

  const agentCosts = [
    { id: 'andrew-analytic', cost: 12.4, pct: 38, color: '#73daca' },
    { id: 'romeo-phd', cost: 9.8, pct: 30, color: '#9d7cd8' },
    { id: 'robo-qc', cost: 6.2, pct: 19, color: '#7aa2f7' },
    { id: 'bassito-animator', cost: 2.6, pct: 8, color: '#ff9e64' },
    { id: 'perevodchik', cost: 1.6, pct: 5, color: '#b4f9f8' },
  ].map((entry) => ({
    ...entry,
    label: agents.find((agent) => agent.id === entry.id)?.name ?? entry.id,
    subtitle: agents.find((agent) => agent.id === entry.id)?.nameRu ?? entry.id,
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{copy.title}</h1>
            <p className="text-xs text-text-muted mt-0.5">{copy.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={server}
              onChange={(event) => setServer(event.target.value)}
              className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-blue transition-colors"
            >
              <option value="all">{copy.servers.all}</option>
              <option value="gpu01">GPU-01</option>
              <option value="gpu02">GPU-02</option>
              <option value="cpu01">CPU-01</option>
            </select>
            <div className="flex items-center gap-1.5 text-xs text-accent-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              {copy.live}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label={copy.metrics.cpu} value={latestCpu} unit="%" warn={80} alert={95} />
          <MetricCard label={copy.metrics.gpu} value={latestGpu} unit="%" warn={85} alert={95} />
          <MetricCard label={copy.metrics.queueDepth} value={3} warn={10} alert={20} suffix={` ${copy.metrics.tasks}`} />
          <MetricCard label={copy.metrics.errors24h} value={0} warn={1} alert={5} suffix={` ${copy.metrics.err}`} />
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="metric-label mb-1">{copy.sceneOps.title}</div>
              <div className="text-xs text-text-muted">{copy.sceneOps.subtitle}</div>
            </div>
            <span className="tag border border-border-subtle text-text-muted">
              {sceneOps?.source === 'api' ? copy.sceneOps.apiFeed : copy.sceneOps.mockFeed}
            </span>
          </div>

          {sceneOps ? (
            <div className="grid md:grid-cols-4 gap-3">
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">{copy.sceneOps.scene}</div>
                <div className="text-sm font-medium text-text-primary">{sceneOps.scene.sceneId}</div>
                <div className="text-xs text-text-muted mt-1">{sceneOps.scene.editingTemplate}</div>
              </div>
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">{copy.sceneOps.andrew}</div>
                <div className="text-sm font-medium text-text-primary">
                  {Math.round(sceneOps.andrew.confidence * 100)}% {copy.sceneOps.confidence}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {copy.sceneOps.hitl}: {STATUS_LABELS[language][sceneOps.andrew.hitlDecision]}
                </div>
              </div>
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">{copy.sceneOps.bassito}</div>
                <div className="text-sm font-medium text-text-primary">
                  {sceneOps.bassitoJobs.length} {copy.sceneOps.jobs}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {
                    sceneOps.bassitoJobs.filter(
                      (job) => job.status === 'queued' || job.status === 'running'
                    ).length
                  }{' '}
                  {copy.sceneOps.active}
                </div>
              </div>
              <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
                <div className="metric-label mb-1">{copy.sceneOps.durationDrift}</div>
                <div className="text-sm font-medium text-text-primary">
                  {(sceneOps.scene.actualDurationSec - sceneOps.scene.targetDurationSec).toFixed(1)}s
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {copy.sceneOps.target} {sceneOps.scene.targetDurationSec.toFixed(1)}s
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-muted">
              {sceneOpsError ?? copy.sceneOps.loading}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="metric-label">{copy.metrics.cpu}</span>
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
              <span className="metric-label">{copy.metrics.gpu}</span>
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

        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">{copy.finops.spend7d}</div>
            <div className="font-mono text-3xl font-semibold text-text-primary">${totalCost}</div>
            <div className="text-xs text-accent-cyan mt-1">
              {copy.finops.cacheSaved}: ${savedCost}
            </div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">{copy.finops.cacheHitRate}</div>
            <div className="font-mono text-3xl font-semibold text-accent-cyan">{cacheHitRate}%</div>
            <div className="mt-2 h-1.5 bg-bg-card rounded-full overflow-hidden">
              <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${cacheHitRate}%` }} />
            </div>
            <div className="text-xs text-text-muted mt-1">
              {(totalCached / 1000).toFixed(0)}K {copy.finops.cachedTokens}
            </div>
          </div>
          <div className="glass-panel p-4 flex flex-col gap-1">
            <div className="metric-label mb-1">{copy.finops.totalTokens7d}</div>
            <div className="font-mono text-3xl font-semibold text-text-primary">
              {((totalInput + totalOutput + totalCached) / 1_000_000).toFixed(2)}M
            </div>
            <div className="flex gap-3 text-xs mt-1">
              <span className="text-text-muted">
                In: <span className="text-text-secondary">{(totalInput / 1000).toFixed(0)}K</span>
              </span>
              <span className="text-text-muted">
                Out: <span className="text-text-secondary">{(totalOutput / 1000).toFixed(0)}K</span>
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="metric-label mb-4">{copy.finops.tokenConsumption}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tokenData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#323a52" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6c7086' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#6c7086' }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<DarkTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: '#a6adc8', fontSize: 11 }}>{value}</span>}
              />
              <Bar dataKey="input" name={copy.finops.inputTokens} fill="#6b7280" radius={[2, 2, 0, 0]} />
              <Bar dataKey="output" name={copy.finops.outputTokens} fill="#4b5563" radius={[2, 2, 0, 0]} />
              <Bar
                dataKey="cached"
                name={copy.finops.cachedTokensLegend}
                fill="#73daca"
                fillOpacity={0.6}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-text-muted">{copy.finops.cachedNote}</div>
        </div>

        <div className="glass-panel p-5">
          <div className="metric-label mb-4">{copy.finops.agentCosts}</div>
          <div className="space-y-2">
            {agentCosts.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3">
                <div className="w-36 min-w-0">
                  <div className="text-xs text-text-secondary truncate">{agent.label}</div>
                  <div className="text-[11px] text-text-muted truncate">{agent.subtitle}</div>
                </div>
                <div className="flex-1 h-2 bg-bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${agent.pct}%`, backgroundColor: agent.color, opacity: 0.7 }}
                  />
                </div>
                <div className="font-mono text-xs text-text-primary w-14 text-right">
                  ${agent.cost.toFixed(2)}
                </div>
                <div className="text-xs text-text-muted w-8 text-right">{agent.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
