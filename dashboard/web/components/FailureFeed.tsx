// Latest FAIL captures: thumbnail, stand, time, VLM rationale.
// React escapes rationale text (untrusted, comes from the VLM) by default.

import type { Capture } from '@/lib/api';

export default function FailureFeed({ failures }: { failures: Capture[] }) {
  return (
    <div className="card">
      <p className="section-title">Recent failures</p>
      {failures.length === 0 && <p className="conn-note">No failures recorded</p>}
      {failures.map((f) => (
        <div className="feed-item" key={f.capture_key}>
          {f.thumbnail_b64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="feed-thumb" src={`data:image/jpeg;base64,${f.thumbnail_b64}`} alt={`Capture ${f.capture_id}`} />
          ) : (
            <div className="feed-thumb" aria-hidden="true" />
          )}
          <div style={{ minWidth: 0 }}>
            <span className="status-chip" style={{ color: 'var(--status-critical)', fontSize: 12 }}>
              <span aria-hidden="true">✕</span> FAIL
            </span>
            <span className="feed-meta">
              {' '}
              · {f.stand_id} · #{f.capture_id} · {new Date(f.ts).toLocaleTimeString()}
            </span>
            <div className="feed-rationale">{f.rationale ?? 'No rationale recorded'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
