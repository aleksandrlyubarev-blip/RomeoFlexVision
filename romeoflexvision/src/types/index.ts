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

export type View = 'landing' | 'catalog' | 'workspace' | 'dashboard';

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

export interface SceneOpsClipScore {
  visualQuality: number;
  continuityFit: number;
  promptMatch: number;
  motionStability: number;
  timelineUsefulness: number;
  recommendedAction: string;
}

export interface SceneOpsSceneBundle {
  sceneId: string;
  sceneGoal: string;
  editingTemplate: string;
  targetDurationSec: number;
  actualDurationSec: number;
  usedClips: string[];
  rejectedClips: string[];
  queueState: 'ready' | 'reviewing' | 'waiting_bassito' | 'completed';
}

export interface SceneOpsAndrewReview {
  confidence: number;
  summary: string;
  warnings: string[];
  recommendedActions: string[];
  qualityBreakdown: Record<string, number>;
  hitlDecision: 'approve' | 'reject' | 'modify' | 'skipped';
}

export interface SceneOpsBassitoJob {
  jobId: string;
  jobType: 'bridge_shot' | 'extend' | 'restyle';
  status: 'queued' | 'completed_stub' | 'running' | 'failed';
  sourceClipId?: string;
  artifactPath?: string;
}

export interface SceneOpsSnapshot {
  scene: SceneOpsSceneBundle;
  clipScores: Record<string, SceneOpsClipScore>;
  andrew: SceneOpsAndrewReview;
  bassitoJobs: SceneOpsBassitoJob[];
  updatedAt: string;
  source: 'mock' | 'api';
}
