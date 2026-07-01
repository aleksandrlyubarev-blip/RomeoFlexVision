'use client';

// Single-stand supervisor view. WS events trigger a debounced overview
// refetch; a 30s poll covers missed events. Refetch keeps the previous
// render (reduced opacity), no skeleton flash.

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearToken, connectLive, fetchOverview, getToken, setToken, type Overview } from '@/lib/api';
import FailureFeed from '@/components/FailureFeed';
import KpiBar from '@/components/KpiBar';
import PassRateChart from '@/components/PassRateChart';
import SessionList from '@/components/SessionList';
import StandTile from '@/components/StandTile';

export default function Page() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [liveUp, setLiveUp] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setOverview(await fetchOverview());
      setAuthed(true);
    } catch (err) {
      if ((err as Error).message === 'unauthorized') {
        clearToken();
        setAuthed(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setAuthed(false);
      return;
    }
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!authed) return;
    const onEvent = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void refresh(), 400);
    };
    const cleanup = connectLive(onEvent, setLiveUp);
    const poll = setInterval(() => void refresh(), 30000);
    return () => {
      cleanup();
      clearInterval(poll);
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [authed, refresh]);

  const submitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setToken(tokenInput.trim());
    setAuthError('');
    try {
      setOverview(await fetchOverview());
      setAuthed(true);
    } catch {
      clearToken();
      setAuthError('That token was rejected. Check DISPLAY_TOKEN on the server.');
    }
  };

  if (authed === null) return null;

  if (!authed) {
    return (
      <main>
        <form className="token-gate card" onSubmit={submitToken}>
          <h1>NeutronVision Display</h1>
          <p className="subtitle" style={{ margin: 0 }}>
            Enter the access token to open the dashboard.
          </p>
          <input
            type="password"
            placeholder="Access token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            autoFocus
          />
          {authError && <p className="error-text">{authError}</p>}
          <button type="submit">Open dashboard</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ opacity: refreshing && overview ? 0.7 : 1, transition: 'opacity 120ms' }}>
      <h1>NeutronVision Display</h1>
      <p className="subtitle">
        Supervisor view · {liveUp ? 'live' : 'reconnecting…'} · updates automatically
      </p>

      {overview && (
        <div className="grid" style={{ gap: 14 }}>
          <div className="grid grid-kpi">
            {overview.stands.map((stand) => (
              <StandTile key={stand.stand_id} stand={stand} />
            ))}
          </div>
          <KpiBar metrics={overview.metrics} />
          <div className="grid grid-main">
            <div className="grid" style={{ gap: 14 }}>
              <PassRateChart hourly={overview.metrics.hourly} />
              <SessionList sessions={overview.sessions} />
            </div>
            <FailureFeed failures={overview.recent_failures} />
          </div>
        </div>
      )}
    </main>
  );
}
