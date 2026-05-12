import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [status, setStatus] = useState('idle');
  const [pc, setPc] = useState(null);

  async function startSession() {
    setStatus('requesting_token');
    const tokenResp = await fetch('/api/realtime/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voice: 'alloy' }) });
    const tokenData = await tokenResp.json();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const peer = new RTCPeerConnection();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    const dc = peer.createDataChannel('oai-events');
    dc.onopen = () => setStatus('connected');
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const sdpResp = await fetch('https://api.openai.com/v1/realtime?model=gpt-realtime-2', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenData.client_secret.value}`, 'Content-Type': 'application/sdp' },
      body: offer.sdp,
    });
    const answer = { type: 'answer', sdp: await sdpResp.text() };
    await peer.setRemoteDescription(answer);
    setPc(peer);
  }

  function stopSession() {
    if (pc) pc.close();
    setPc(null);
    setStatus('stopped');
  }

  return <div><h1>Voice Copilot V0.1</h1><p>Status: {status}</p><button onClick={startSession}>Start Voice Session</button><button onClick={stopSession}>Stop Voice Session</button></div>;
}

createRoot(document.getElementById('root')).render(<App />);
