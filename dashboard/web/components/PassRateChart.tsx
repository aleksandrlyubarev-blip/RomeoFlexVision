'use client';

// Hourly pass-rate, last 24h. Single series (no legend box — the title names
// it): 2px line, ≥8px end marker with a 2px surface ring, hairline gridlines,
// crosshair tooltip that snaps to the nearest hour, and a table view so no
// value is gated behind hover.

import { useMemo, useRef, useState } from 'react';
import type { HourBucket } from '@/lib/api';

const W = 640;
const H = 180;
const PAD = { top: 12, right: 16, bottom: 24, left: 40 };

interface Point {
  x: number;
  y: number;
  bucket: HourBucket;
}

export default function PassRateChart({ hourly }: { hourly: HourBucket[] }) {
  const [showTable, setShowTable] = useState(false);
  const [hover, setHover] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo<Point[]>(() => {
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    return hourly
      .map((bucket, i) => ({ bucket, i }))
      .filter(({ bucket }) => bucket.pass_rate !== null)
      .map(({ bucket, i }) => ({
        x: PAD.left + (hourly.length <= 1 ? 0 : (i / (hourly.length - 1)) * innerW),
        y: PAD.top + (1 - (bucket.pass_rate as number)) * innerH,
        bucket,
      }));
  }, [hourly]);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const last = points[points.length - 1];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = points[0];
    for (const p of points) {
      if (Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
    }
    setHover(nearest);
  };

  const hourLabel = (b: HourBucket) => `${b.hour_utc.slice(11, 13)}:00`;

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p className="section-title">Pass rate by hour (UTC, last 24h)</p>
        <button className="toggle-btn" onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Chart' : 'Table'}
        </button>
      </div>

      {showTable ? (
        <table className="data">
          <thead>
            <tr>
              <th>Hour (UTC)</th>
              <th>Captures</th>
              <th>Pass rate</th>
            </tr>
          </thead>
          <tbody>
            {hourly.filter((b) => b.captures > 0).map((b) => (
              <tr key={b.hour_utc}>
                <td>{hourLabel(b)}</td>
                <td>{b.captures}</td>
                <td>{b.pass_rate === null ? '—' : `${Math.round(b.pass_rate * 100)}%`}</td>
              </tr>
            ))}
            {hourly.every((b) => b.captures === 0) && (
              <tr>
                <td colSpan={3} style={{ color: 'var(--text-muted)' }}>
                  No captures in the last 24 hours
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : points.length === 0 ? (
        <p className="conn-note" style={{ padding: '32px 0', textAlign: 'center' }}>
          No verdicts in the last 24 hours yet
        </p>
      ) : (
        <>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label="Hourly pass rate line chart; use the table view for exact values"
          >
            {[0, 0.5, 1].map((v) => {
              const y = PAD.top + (1 - v) * (H - PAD.top - PAD.bottom);
              return (
                <g key={v}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />
                  <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
                    {Math.round(v * 100)}%
                  </text>
                </g>
              );
            })}
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={H - PAD.bottom}
              y2={H - PAD.bottom}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
            {hover && (
              <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--baseline)" strokeWidth={1} />
            )}
            <path d={path} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {last && (
              <circle cx={last.x} cy={last.y} r={4} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={2} />
            )}
            {hover && hover !== last && (
              <circle cx={hover.x} cy={hover.y} r={4} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={2} />
            )}
          </svg>
          {hover && (
            <div
              className="chart-tooltip"
              style={{ left: `${(hover.x / W) * 100}%`, top: 8, transform: hover.x > W * 0.7 ? 'translateX(-110%)' : 'translateX(12px)' }}
            >
              <div className="tooltip-value">{Math.round((hover.bucket.pass_rate as number) * 100)}% pass</div>
              <div className="tooltip-label">
                {hourLabel(hover.bucket)} UTC · {hover.bucket.captures} captures
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
