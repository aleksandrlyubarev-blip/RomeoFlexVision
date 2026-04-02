/**
 * VoiceInterface — floating voice button for hands-free operator interaction.
 *
 * Audio pipeline:
 *   Mic → AudioContext(16 kHz) → ScriptProcessor → PCM16 Int16 → WebSocket(binary)
 *   WebSocket(binary) → PCM16 Int16 24 kHz → scheduled AudioContext playback
 *
 * Target round-trip latency: < 500 ms (dominated by Gemini Live API RTT).
 * No additional npm dependencies — Web Audio API + native WebSocket only.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionState =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

interface TranscriptLine {
  id: number;
  role: 'user' | 'model';
  text: string;
}

type GatewayMsg =
  | { type: 'status'; state: SessionState }
  | { type: 'transcript'; role: 'user' | 'model'; text: string; final: boolean }
  | { type: 'error'; message: string }
  | { type: 'tool_call' | 'tool_result'; name: string; data: unknown };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert Float32 samples → Int16 PCM (in-place into output buffer). */
function float32ToInt16(input: Float32Array, output: Int16Array): void {
  for (let i = 0; i < input.length; i++) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    output[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
  }
}

/** Convert Int16 PCM → Float32 samples (for AudioBuffer). */
function int16ToFloat32(input: Int16Array): Float32Array<ArrayBuffer> {
  const out = new Float32Array(new ArrayBuffer(input.length * 4));
  for (let i = 0; i < input.length; i++) {
    out[i] = input[i] / 32768;
  }
  return out;
}

// ---------------------------------------------------------------------------
// State indicator colours
// ---------------------------------------------------------------------------

const STATE_DOT_CLASS: Record<SessionState, string> = {
  idle: '',
  connecting: 'bg-slate-400',
  ready: 'bg-cyan-400',
  listening: 'bg-cyan-400 animate-pulse',
  thinking: 'bg-yellow-400 animate-pulse',
  speaking: 'bg-purple-400',
  error: 'bg-red-400',
};

const STATE_LABEL: Record<SessionState, string> = {
  idle: '',
  connecting: 'Connecting…',
  ready: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  error: 'Error',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GATEWAY_URL = (import.meta.env.VITE_VOICE_GATEWAY_URL as string | undefined)?.trim();

export function VoiceInterface() {
  const [isActive, setIsActive] = useState(false);
  const [state, setState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);

  // Audio + WS refs (not state — mutations must not trigger re-render)
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scheduledUntilRef = useRef<number>(0);
  const isReadyRef = useRef(false);        // true once gateway sends 'ready'
  const sessionActiveRef = useRef(false);  // prevents double-cleanup
  const lineIdRef = useRef(0);

  // -------------------------------------------------------------------------
  // Audio playback: schedule PCM16 24 kHz chunk into the output AudioContext
  // -------------------------------------------------------------------------

  const scheduleAudioChunk = useCallback((data: ArrayBuffer): void => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    const int16 = new Int16Array(data);
    if (int16.length === 0) return;

    const float32 = int16ToFloat32(int16);
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    // Schedule 20 ms ahead of now, or right after the previous chunk
    const startAt = Math.max(now + 0.02, scheduledUntilRef.current);
    source.start(startAt);
    scheduledUntilRef.current = startAt + buffer.duration;
  }, []);

  // -------------------------------------------------------------------------
  // Cleanup: tear down audio pipeline + WebSocket
  // -------------------------------------------------------------------------

  const cleanup = useCallback((): void => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;

    // Disconnect ScriptProcessorNode before closing AudioContext
    processorRef.current?.disconnect();
    processorRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    inputCtxRef.current?.close().catch(() => undefined);
    inputCtxRef.current = null;

    outputCtxRef.current?.close().catch(() => undefined);
    outputCtxRef.current = null;
    scheduledUntilRef.current = 0;

    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }

    isReadyRef.current = false;
    setIsActive(false);
    setState('idle');
  }, []);

  // -------------------------------------------------------------------------
  // Start session
  // -------------------------------------------------------------------------

  const startSession = useCallback(async (): Promise<void> => {
    if (!GATEWAY_URL || sessionActiveRef.current) return;

    sessionActiveRef.current = true;
    setIsActive(true);
    setState('connecting');
    setErrorText(null);
    setTranscript([]);

    try {
      // 1. Microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // 2. AudioContexts
      //    input: 16 kHz — Gemini Live requires PCM16 at 16 kHz
      //    output: device-native — browser will resample 24 kHz buffers automatically
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      inputCtxRef.current = inputCtx;
      const outputCtx = new AudioContext();
      outputCtxRef.current = outputCtx;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      // 3. WebSocket to voice gateway
      const ws = new WebSocket(GATEWAY_URL);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onmessage = (ev: MessageEvent<unknown>) => {
        if (ev.data instanceof ArrayBuffer) {
          scheduleAudioChunk(ev.data);
          return;
        }
        if (typeof ev.data !== 'string') return;
        try {
          const msg = JSON.parse(ev.data) as GatewayMsg;
          if (msg.type === 'status') {
            setState(msg.state);
            if (msg.state === 'ready') isReadyRef.current = true;
          } else if (msg.type === 'transcript' && msg.text.trim()) {
            setTranscript((prev) => {
              const line: TranscriptLine = {
                id: lineIdRef.current++,
                role: msg.role,
                text: msg.text,
              };
              // Keep last 6 lines
              return [...prev.slice(-5), line];
            });
          } else if (msg.type === 'error') {
            setErrorText(msg.message);
            setState('error');
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        setErrorText('Connection to voice service lost');
        setState('error');
        cleanup();
      };

      ws.onclose = () => {
        if (sessionActiveRef.current) cleanup();
      };

      // 4. Microphone → PCM16 → WebSocket
      //    ScriptProcessorNode runs at 16 kHz (inputCtx sample rate)
      //    bufferSize 4096 → ~256 ms chunks — acceptable for streaming
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!isReadyRef.current || ws.readyState !== WebSocket.OPEN) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        float32ToInt16(float32, int16);
        ws.send(int16.buffer);
      };

      source.connect(processor);
      // Connect to destination to keep the graph alive (output is silent)
      processor.connect(inputCtx.destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start voice session';
      setErrorText(message);
      setState('error');
      cleanup();
    }
  }, [cleanup, scheduleAudioChunk]);

  const stopSession = useCallback((): void => {
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Don't render if gateway URL is not configured
  if (!GATEWAY_URL) return null;

  const dotClass = STATE_DOT_CLASS[state];
  const stateLabel = STATE_LABEL[state];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ---- Transcript panel ---- */}
      {isActive && transcript.length > 0 && showTranscript && (
        <div className="w-72 rounded-2xl border border-white/10 bg-[#0b1220]/95 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
              Romeo Voice
            </span>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-slate-500 transition hover:text-white"
              aria-label="Hide transcript"
            >
              <X size={13} />
            </button>
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto p-3">
            {transcript.map((line) => (
              <div
                key={line.id}
                className={`text-[13px] leading-relaxed ${
                  line.role === 'model' ? 'text-cyan-300' : 'text-slate-300'
                }`}
              >
                <span className="mr-1 font-semibold">
                  {line.role === 'model' ? 'Romeo' : 'You'}:
                </span>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Error toast ---- */}
      {errorText && (
        <div className="flex max-w-xs items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/60 px-3 py-2 text-xs text-red-300 shadow-lg backdrop-blur-sm">
          <span className="mt-px shrink-0 text-red-400">⚠</span>
          <span>{errorText}</span>
        </div>
      )}

      {/* ---- State label ---- */}
      {isActive && stateLabel && (
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b1220]/80 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-sm">
          {dotClass && (
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
          )}
          {stateLabel}
        </div>
      )}

      {/* ---- Voice button ---- */}
      <div className="relative">
        {/* Pulse rings while listening */}
        {isActive && (state === 'listening' || state === 'ready') && (
          <>
            <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
            <span className="absolute inset-0 scale-110 rounded-full bg-cyan-400/10 animate-ping [animation-delay:150ms]" />
          </>
        )}

        {/* Breathing glow while speaking */}
        {state === 'speaking' && (
          <span className="absolute inset-0 rounded-full bg-purple-400/25 animate-pulse" />
        )}

        <button
          onClick={isActive ? stopSession : () => void startSession()}
          aria-label={isActive ? 'Stop voice session' : 'Start Romeo voice assistant'}
          title={isActive ? 'Stop voice session' : 'Talk to Romeo'}
          className={[
            'relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-200',
            isActive
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
              : 'border-white/15 bg-white/5 text-slate-400 hover:border-white/30 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          {state === 'connecting' ? (
            <Loader2 size={22} className="animate-spin" />
          ) : isActive ? (
            <Mic size={22} />
          ) : (
            <MicOff size={22} />
          )}

          {/* State indicator dot */}
          {isActive && dotClass && (
            <span
              className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#060b16] ${dotClass.replace(' animate-pulse', '')}`}
            />
          )}
        </button>
      </div>

      {/* Re-show transcript button */}
      {isActive && transcript.length > 0 && !showTranscript && (
        <button
          onClick={() => setShowTranscript(true)}
          className="rounded-lg border border-white/10 bg-[#0b1220]/80 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-sm transition hover:text-white"
        >
          Show transcript
        </button>
      )}
    </div>
  );
}
