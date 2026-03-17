export type AgentStatus = 'idle' | 'computing' | 'error' | 'ready' | 'dev';

export type AgentCategory = 'analytic' | 'creative' | 'orchestrator';

export interface Agent {
  id: string;
  name: string;
  nameRu: string;
  category: AgentCategory;
  status: AgentStatus;
  description: string;
  subAgents: number;
  dataSources: string[];
  limitations: string[];
  icon: string;
  color: string;
}

export type View = 'landing' | 'catalog' | 'workspace' | 'dashboard' | 'profile';

export interface TraceStep {
  id: string;
  step: number;
  type: 'prompt' | 'tool_call' | 'tool_response' | 'llm_response';
  label: string;
  content: string;
  latencyMs: number;
  tokens?: { input: number; output: number; cached: number };
  status: 'ok' | 'error';
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  status: 'queued' | 'running' | 'completed' | 'error' | 'waiting_human';
  progress: number;
  createdAt: string;
}
