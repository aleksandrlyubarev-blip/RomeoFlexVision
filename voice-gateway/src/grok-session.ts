import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { executeTool, toGrokFunctionTools } from './rfv-tools.js';
import type { ClientBoundMessage, GrokServerEvent, SessionState } from './types.js';

// Overridable for staging/tests; production default is the public endpoint
const GROK_REALTIME_BASE = process.env.GROK_REALTIME_URL?.trim() || 'wss://api.x.ai/v1/realtime';

/**
 * Manages one bidirectional Grok Voice realtime session for a single operator
 * client. Mirrors GeminiSession's public surface (see VoiceSession in
 * types.ts) so index.ts can bridge either provider.
 *
 * Protocol: xAI realtime API (OpenAI-realtime-style events) —
 * https://docs.x.ai/developers/model-capabilities/audio/voice-agent
 *
 * Events emitted:
 *   'message'  (msg: ClientBoundMessage)  — JSON status/transcript/tool events
 *   'audio'    (chunk: Buffer)            — raw PCM16 24 kHz audio from the model
 *   'error'    (err: Error)
 *   'close'
 */
export class GrokSession extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: SessionState = 'idle';
  private setupDone = false;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly voice: string;

  constructor(apiKey: string, model: string, voice = 'rex') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.voice = voice;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Open the realtime WebSocket and send the session.update configuration. */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setState('connecting');
      const url = `${GROK_REALTIME_BASE}?model=${encodeURIComponent(this.model)}`;
      const ws = new WebSocket(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      this.ws = ws;

      const onSessionReady = () => {
        this.setState('ready');
        resolve();
      };

      ws.once('open', () => {
        this.sendSessionUpdate();
      });

      ws.on('message', (raw: WebSocket.RawData) => {
        try {
          const event = JSON.parse(raw.toString()) as GrokServerEvent;
          this.handleEvent(event, onSessionReady);
        } catch (err) {
          console.error('[GrokSession] Failed to parse event:', err);
        }
      });

      ws.on('error', (err: Error) => {
        this.setState('error');
        this.emit('error', err);
        reject(err);
      });

      ws.on('close', () => {
        if (this.state !== 'error') this.setState('idle');
        this.emit('close');
      });
    });
  }

  /**
   * Forward a raw PCM16 16 kHz audio buffer from the browser to Grok.
   * Silently drops frames until the session is configured.
   */
  sendAudio(pcm16: Buffer): void {
    if (!this.setupDone || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.state === 'ready') this.setState('listening');

    this.ws.send(
      JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: pcm16.toString('base64'),
      }),
    );
  }

  /** Gracefully close the realtime WebSocket. */
  close(): void {
    this.ws?.close();
    this.ws = null;
    this.setState('idle');
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private setState(next: SessionState): void {
    if (this.state === next) return;
    this.state = next;
    const msg: ClientBoundMessage = { type: 'status', state: next };
    this.emit('message', msg);
  }

  private send(event: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  private sendSessionUpdate(): void {
    // Keep aligned with voice-agent/session-config.json (the phone/console
    // deployment) — same VAD, voice and pronunciation map, but function tools
    // executed here in-process instead of via the remote MCP connector.
    this.send({
      type: 'session.update',
      session: {
        voice: this.voice,
        instructions: SYSTEM_PROMPT,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.85,
          silence_duration_ms: 500,
          prefix_padding_ms: 333,
        },
        audio: {
          input: { format: { type: 'audio/pcm', rate: 16000 } },
          output: { format: { type: 'audio/pcm', rate: 24000 } },
        },
        replace: {
          RoboQC: 'Robo Q C',
          AOI: 'A O I',
          RomeoFlexVision: 'Romeo Flex Vision',
        },
        tools: toGrokFunctionTools(),
      },
    });
  }

  private handleEvent(event: GrokServerEvent, onSessionReady: () => void): void {
    switch (event.type) {
      case 'session.updated': {
        if (!this.setupDone) {
          this.setupDone = true;
          onSessionReady();
        }
        return;
      }

      case 'response.output_audio.delta': {
        if (!event.audio) return;
        if (this.state !== 'speaking') this.setState('speaking');
        this.emit('audio', Buffer.from(event.audio, 'base64'));
        return;
      }

      // Cumulative user-speech transcript (may revise earlier updates)
      case 'conversation.item.input_audio_transcription.updated': {
        if (typeof event.transcript !== 'string') return;
        const msg: ClientBoundMessage = {
          type: 'transcript',
          role: 'user',
          text: event.transcript,
          final: false,
        };
        this.emit('message', msg);
        return;
      }

      case 'response.output_audio_transcript.delta': {
        if (typeof event.delta !== 'string') return;
        const msg: ClientBoundMessage = {
          type: 'transcript',
          role: 'model',
          text: event.delta,
          final: false,
        };
        this.emit('message', msg);
        return;
      }

      case 'response.output_audio_transcript.done': {
        if (typeof event.transcript !== 'string') return;
        const msg: ClientBoundMessage = {
          type: 'transcript',
          role: 'model',
          text: event.transcript,
          final: true,
        };
        this.emit('message', msg);
        return;
      }

      case 'response.function_call_arguments.done': {
        void this.handleFunctionCall(event);
        return;
      }

      // Caller barged in while the model was speaking
      case 'input_audio_buffer.speech_started': {
        if (this.state === 'speaking') this.setState('listening');
        return;
      }

      case 'response.created': {
        this.setState('thinking');
        return;
      }

      case 'response.done': {
        this.setState('ready');
        return;
      }

      case 'error': {
        const message = event.error?.message ?? 'Unknown realtime API error';
        console.error('[GrokSession] Server error:', message);
        this.emit('error', new Error(message));
        return;
      }

      default:
        // Lifecycle events the gateway doesn't need (conversation.created,
        // response.output_item.*, rate limits, ...) — ignore.
        return;
    }
  }

  private async handleFunctionCall(event: GrokServerEvent): Promise<void> {
    const name = event.name ?? '';
    const callId = event.call_id ?? '';

    let args: Record<string, unknown> = {};
    try {
      args = event.arguments ? (JSON.parse(event.arguments) as Record<string, unknown>) : {};
    } catch {
      console.error(`[GrokSession] Bad function arguments for ${name}:`, event.arguments);
    }

    this.setState('thinking');
    const callMsg: ClientBoundMessage = { type: 'tool_call', name, data: args };
    this.emit('message', callMsg);

    let result: unknown;
    try {
      result = await executeTool(name, args);
    } catch (err) {
      result = { error: err instanceof Error ? err.message : String(err) };
    }

    const resultMsg: ClientBoundMessage = {
      type: 'tool_result',
      name,
      data: result as Record<string, unknown>,
    };
    this.emit('message', resultMsg);

    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(result),
      },
    });
    this.send({ type: 'response.create' });
  }
}
