// ---------- Client-facing message types (gateway → browser) ----------

export type SessionState =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface StatusMessage {
  type: 'status';
  state: SessionState;
}

export interface TranscriptMessage {
  type: 'transcript';
  role: 'user' | 'model';
  text: string;
  final: boolean;
}

export interface ToolEventMessage {
  type: 'tool_call' | 'tool_result';
  name: string;
  data: Record<string, unknown>;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type ClientBoundMessage =
  | StatusMessage
  | TranscriptMessage
  | ToolEventMessage
  | ErrorMessage;

// ---------- Gemini Live protocol types ----------

export interface ParameterSchema {
  type: 'STRING' | 'INTEGER' | 'NUMBER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
  description?: string;
  enum?: string[];
  items?: ParameterSchema;
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, ParameterSchema>;
    required?: string[];
  };
}

export interface GeminiSetup {
  setup: {
    model: string;
    generationConfig: {
      responseModalities: string[];
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: string };
        };
      };
    };
    systemInstruction: {
      parts: Array<{ text: string }>;
    };
    tools: Array<{ functionDeclarations: FunctionDeclaration[] }>;
  };
}

export interface GeminiRealtimeInput {
  realtimeInput: {
    mediaChunks?: Array<{ mimeType: string; data: string }>;
  };
}

export interface GeminiToolResponse {
  toolResponse: {
    functionResponses: Array<{
      id: string;
      response: { output: unknown };
    }>;
  };
}

// ---------- Gemini server → gateway message shapes ----------

export interface GeminiSetupComplete {
  setupComplete: Record<string, never>;
}

export interface GeminiServerContent {
  serverContent: {
    modelTurn?: {
      parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }>;
    };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
}

export interface GeminiFunctionCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiToolCall {
  toolCall: {
    functionCalls: GeminiFunctionCall[];
  };
}

export type GeminiServerMessage =
  | GeminiSetupComplete
  | GeminiServerContent
  | GeminiToolCall;

// ---------- Provider-agnostic session interface ----------

import type { EventEmitter } from 'node:events';

/**
 * Common surface of GeminiSession / GrokSession so the gateway can bridge
 * either provider. Events: 'message' (ClientBoundMessage), 'audio' (Buffer),
 * 'error' (Error), 'close'.
 */
export interface VoiceSession extends EventEmitter {
  connect(): Promise<void>;
  sendAudio(pcm16: Buffer): void;
  close(): void;
}

// ---------- Grok realtime protocol types (wss://api.x.ai/v1/realtime) ----------

export interface GrokFunctionTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

/** Server → gateway events. Only the fields the gateway consumes are typed. */
export interface GrokServerEvent {
  type: string;
  // response.output_audio.delta
  audio?: string;
  // response.output_audio_transcript.delta / .done
  delta?: string;
  transcript?: string;
  // response.function_call_arguments.done
  name?: string;
  call_id?: string;
  arguments?: string;
  // conversation.created
  conversation?: { id?: string };
  // error
  error?: { message?: string; [key: string]: unknown };
}
