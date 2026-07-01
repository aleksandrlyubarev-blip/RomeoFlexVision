// Recent sessions table: tabular figures in the count columns.

import type { SessionRow } from '@/lib/api';

export default function SessionList({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div className="card">
      <p className="section-title">Recent sessions</p>
      {sessions.length === 0 ? (
        <p className="conn-note">No sessions yet</p>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>Session</th>
              <th>Started</th>
              <th>Captures</th>
              <th>Pass</th>
              <th>Fail</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.session_key}>
                <td>{s.name || s.session_id}</td>
                <td>{s.started_at ? new Date(s.started_at).toLocaleString() : '—'}</td>
                <td>{s.capture_count}</td>
                <td>{s.pass_count}</td>
                <td>{s.fail_count}</td>
                <td>{s.ended_at ? 'ended' : 'open'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
