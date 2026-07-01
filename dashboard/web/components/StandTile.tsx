// Stand status: color + icon + label (status is never color alone).

import type { Stand } from '@/lib/api';

const STATUS: Record<Stand['status'], { color: string; icon: string; label: string }> = {
  capturing: { color: 'var(--status-good)', icon: '●', label: 'Capturing' },
  online: { color: 'var(--status-good)', icon: '●', label: 'Online' },
  offline: { color: 'var(--status-critical)', icon: '✕', label: 'Offline' },
};

export default function StandTile({ stand }: { stand: Stand }) {
  const s = STATUS[stand.status];
  const hb = stand.heartbeat as { camera_connected?: boolean; engine?: string };
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="stat-label">Stand</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {stand.stand_id}
          </div>
        </div>
        <span className="status-chip" style={{ color: s.color }}>
          <span aria-hidden="true">{s.icon}</span> {s.label}
        </span>
      </div>
      <div className="stat-context" style={{ marginTop: 8 }}>
        {stand.status === 'offline' ? (
          <>Last seen: {stand.last_seen ? new Date(stand.last_seen).toLocaleString() : 'never'}</>
        ) : (
          <>
            Camera: {hb.camera_connected ? 'connected' : 'not detected'} · Engine: {hb.engine ?? '—'}
          </>
        )}
      </div>
    </div>
  );
}
