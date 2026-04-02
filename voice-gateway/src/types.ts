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
