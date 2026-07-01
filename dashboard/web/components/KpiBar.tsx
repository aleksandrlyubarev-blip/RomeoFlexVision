// Stat tiles: label + value, proportional figures. Pass rate is the hero.

import type { Overview } from '@/lib/api';

export default function KpiBar({ metrics }: { metrics: Overview['metrics'] }) {
  const { today } = metrics;
  const rate = today.pass_rate;
  return (
    <div className="grid grid-kpi">
      <div className="card">
        <div className="stat-label">Pass rate today</div>
        <div className="stat-value stat-hero">{rate === null ? '—' : `${Math.round(rate * 100)}%`}</div>
        <div className="stat-context">
          {today.pass} pass · {today.fail} fail
        </div>
      </div>
      <div className="card">
        <div className="stat-label">Captures today</div>
        <div className="stat-value">{today.captures}</div>
      </div>
      <div className="card">
        <div className="stat-label">Failures today</div>
        <div className="stat-value">{today.fail}</div>
      </div>
      <div className="card">
        <div className="stat-label">Retakes today</div>
        <div className="stat-value">{today.retake}</div>
      </div>
    </div>
  );
}
