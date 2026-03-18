// Shared metrics store — single source of truth for Dashboard + FinOps.
// Data is generated once and persisted to localStorage so both views
// always show identical numbers.

const LS_METRICS_KEY = 'rfv_metrics_v1';
const LS_APPLIED_KEY = 'rfv_finops_applied';

// ---- Types ----
export interface AgentSpend {
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  calls: number;
  costUsd: number;
  model: 'opus' | 'sonnet' | 'haiku';
}

export interface TimePoint {
  label: string;
  input: number;
  output: number;
  cached: number;
  cost: number;
}

interface MetricsData {
  agentSpend: AgentSpend[];
  daily30d: TimePoint[];
}

// ---- Token cost rates (USD per 1M tokens) ----
const RATES = {
  opus:   { input: 15,  output: 75,  cached: 1.5  },
  sonnet: { input: 3,   output: 15,  cached: 0.3  },
  haiku:  { input: 0.8, output: 4,   cached: 0.08 },
};

function tokenCost(input: number, output: number, cached: number, model: AgentSpend['model']) {
  const r = RATES[model];
  return (input * r.input + output * r.output + cached * r.cached) / 1_000_000;
}

// ---- Seeded PRNG so data is stable across reloads until regenerated ----
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ---- Generate 30 days of data ----
function generateMetrics(): MetricsData {
  const rng = seededRand(42);

  const agentDefs: { id: string; model: AgentSpend['model']; baseInput: number; baseOutput: number; baseCalls: number }[] = [
    { id: 'romeo-phd',        model: 'opus',   baseInput: 48000,  baseOutput: 31000,  baseCalls: 142 },
    { id: 'robo-qc',          model: 'sonnet', baseInput: 38000,  baseOutput: 12000,  baseCalls: 318 },
    { id: 'andrew-analytic',  model: 'sonnet', baseInput: 29000,  baseOutput: 18000,  baseCalls: 207 },
    { id: 'bassito-animator', model: 'opus',   baseInput: 14000,  baseOutput: 22000,  baseCalls: 54  },
    { id: 'perevodchik',      model: 'haiku',  baseInput: 9800,   baseOutput: 11000,  baseCalls: 89  },
    { id: 'chertejnik',       model: 'haiku',  baseInput: 3200,   baseOutput: 4100,   baseCalls: 12  },
  ];

  // 7-day agent spend (last 7 days aggregated)
  const agentSpend: AgentSpend[] = agentDefs.map(def => {
    const input   = Math.round(def.baseInput   * (0.85 + rng() * 0.3));
    const output  = Math.round(def.baseOutput  * (0.85 + rng() * 0.3));
    const cached  = Math.round(input * (0.25 + rng() * 0.25));
    const calls   = Math.round(def.baseCalls   * (0.85 + rng() * 0.3));
    return {
      agentId: def.id,
      model: def.model,
      inputTokens:  input,
      outputTokens: output,
      cachedTokens: cached,
      calls,
      costUsd: tokenCost(input, output, cached, def.model),
    };
  });

  // 30-day daily points
  const daily30d: TimePoint[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
    // Weekend dip
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const factor = isWeekend ? 0.35 : 1;
    const input  = Math.round((120000 + rng() * 80000) * factor);
    const output = Math.round((40000  + rng() * 30000) * factor);
    const cached = Math.round((30000  + rng() * 40000) * factor);
    const cost   = tokenCost(input, output, cached, 'sonnet'); // blended
    return { label, input, output, cached, cost };
  });

  return { agentSpend, daily30d };
}

// ---- Generate 24h hourly points ----
export function generate24h(): TimePoint[] {
  const rng = seededRand(99);
  return Array.from({ length: 24 }, (_, i) => {
    const h = new Date();
    h.setHours(h.getHours() - (23 - i), 0, 0, 0);
    const label = h.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    // Night dip
    const hour = h.getHours();
    const factor = hour >= 1 && hour <= 6 ? 0.1 : hour >= 9 && hour <= 18 ? 1 : 0.5;
    const input  = Math.round((5000 + rng() * 3000) * factor);
    const output = Math.round((1800 + rng() * 1200) * factor);
    const cached = Math.round((1200 + rng() * 1600) * factor);
    const cost   = tokenCost(input, output, cached, 'sonnet');
    return { label, input, output, cached, cost };
  });
}

// ---- Slice helpers ----
export function slice7d(daily30d: TimePoint[]): TimePoint[] {
  return daily30d.slice(-7).map(p => ({
    ...p,
    label: new Date(p.label).toLocaleDateString('ru', { weekday: 'short' }),
  }));
}

// ---- Load / persist ----
function loadOrGenerate(): MetricsData {
  try {
    const raw = localStorage.getItem(LS_METRICS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const fresh = generateMetrics();
  localStorage.setItem(LS_METRICS_KEY, JSON.stringify(fresh));
  return fresh;
}

// ---- Hook ----
import { useState } from 'react';

export function useMetrics() {
  const [data] = useState<MetricsData>(loadOrGenerate);

  const [appliedRecs, setAppliedRecs] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(LS_APPLIED_KEY) ?? '[]'));
    } catch { return new Set(); }
  });

  const toggleRec = (id: string) => {
    setAppliedRecs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(LS_APPLIED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  // Computed totals (7-day / agentSpend)
  const totalCost    = data.agentSpend.reduce((s, d) => s + d.costUsd, 0);
  const totalInput   = data.agentSpend.reduce((s, d) => s + d.inputTokens, 0);
  const totalOutput  = data.agentSpend.reduce((s, d) => s + d.outputTokens, 0);
  const totalCached  = data.agentSpend.reduce((s, d) => s + d.cachedTokens, 0);
  const totalTokens  = totalInput + totalOutput + totalCached;
  const cacheHitRate = totalCached / totalTokens * 100;
  const totalCalls   = data.agentSpend.reduce((s, d) => s + d.calls, 0);

  return {
    agentSpend: data.agentSpend,
    daily30d:   data.daily30d,
    totalCost,
    totalInput,
    totalOutput,
    totalCached,
    totalTokens,
    cacheHitRate,
    totalCalls,
    appliedRecs,
    toggleRec,
  };
}
