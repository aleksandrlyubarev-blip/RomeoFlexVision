import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { RFV_FUNCTION_DECLARATIONS, executeTool } from './rfv-tools.js';
import type {
  ClientBoundMessage,
  GeminiServerMessage,
  GeminiServerContent,
  GeminiToolCall,
  SessionState,
} from './types.js';

const GEMINI_LIVE_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

/**
 * Manages one bidirectional Gemini Live session for a single operator client.
 *
 * Events emitted:
 *   'message'  (msg: ClientBoundMessage)  — JSON status/transcript/tool events
 *   'audio'    (chunk: Buffer)            — raw PCM16 24 kHz audio from the model
 *   'error'    (err: Error)
 *   'close'
 */
export class GeminiSession extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: SessionState = 'idle';
  private setupDone = false;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Open the Gemini Live WebSocket and send the setup message. */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setState('connecting');
      const url = `${GEMINI_LIVE_BASE}?key=${this.apiKey}`;
      const ws = new WebSocket(url);
      this.ws = ws;

      const onSetupComplete = () => {
        this.setState('ready');
        resolve();
      };

      ws.once('open', () => {
        this.sendSetup();
      });

      ws.on('message', (raw: WebSocket.RawData) => {
        try {
          const msg = JSON.parse(raw.toString()) as GeminiServerMessage;
          this.handleMessage(msg, onSetupComplete);
        } catch (err) {
          console.error('[GeminiSession] Failed to parse message:', err);
        }
      });

      ws.once('error', (err: Error) => {
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
   * Forward a raw PCM16 16 kHz audio buffer from the browser to Gemini.
   * Silently drops frames until setup is complete.
   */
  sendAudio(pcm16: Buffer): void {
    if (!this.setupDone || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.state === 'ready') this.setState('listening');

    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            { mimeType: 'audio/pcm;rate=16000', data: pcm16.toString('base64') },
          ],
        },
      }),
    );
  }

  /** Gracefully close the Gemini WebSocket. */
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

  private sendSetup(): void {
    const payload = {
      setup: {
        model: `models/${this.model}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Aoede' },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        tools: [{ functionDeclarations: RFV_FUNCTION_DECLARATIONS }],
      },
    };
    this.ws?.send(JSON.stringify(payload));
  }

  private handleMessage(msg: GeminiServerMessage, onSetupComplete: () => void): void {
    if ('setupComplete' in msg) {
      this.setupDone = true;
      onSetupComplete();
      return;
    }

    if ('toolCall' in msg) {
      void this.handleToolCall(msg as GeminiToolCall);
      return;
    }

    if ('serverContent' in msg) {
      this.handleServerContent(msg as GeminiServerContent);
    }
  }

  private handleServerContent(msg: GeminiServerContent): void {
    const { modelTurn, turnComplete, interrupted } = msg.serverContent;

    if (interrupted) {
      // Model was interrupted — return to listening
      this.setState('listening');
      return;
    }

    if (modelTurn?.parts) {
      for (const part of modelTurn.parts) {
        // Audio chunk
        if (part.inlineData?.mimeType.startsWith('audio/pcm')) {
          if (this.state !== 'speaking') this.setState('speaking');
          const audio = Buffer.from(part.inlineData.data, 'base64');
          this.emit('audio', audio);
        }

        // Text transcript from model
        if (part.text) {
          const transcriptMsg: ClientBoundMessage = {
            type: 'transcript',
            role: 'model',
            text: part.text,
            final: !!turnComplete,
          };
          this.emit('message', transcriptMsg);
        }
      }
    }

    if (turnComplete) {
      this.setState('ready');
    }
  }

  private async handleToolCall(msg: GeminiToolCall): Promise<void> {
    this.setState('thinking');

    const responses = await Promise.all(
      msg.toolCall.functionCalls.map(async (call) => {
        const callMsg: ClientBoundMessage = {
          type: 'tool_call',
          name: call.name,
          data: call.args,
        };
        this.emit('message', callMsg);

        let result: unknown;
        try {
          result = await executeTool(call.name, call.args);
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
        }

        const resultMsg: ClientBoundMessage = {
          type: 'tool_result',
          name: call.name,
          data: result as Record<string, unknown>,
        };
        this.emit('message', resultMsg);

        return { id: call.id, response: { output: result } };
      }),
    );

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
    }
  }
}
