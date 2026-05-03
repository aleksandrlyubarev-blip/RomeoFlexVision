export type SkillKind = "business" | "infrastructure";

export type SkillRiskLevel = "low" | "medium" | "high";

export interface SkillManifest {
  name: string;
  version: string;
  kind: SkillKind;
  owner: string;
  description: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  risk: SkillRiskLevel;
  requiresHumanApproval?: boolean;
  tags?: string[];
}

export interface SkillLogger {
  info: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
  error: (msg: string, data?: unknown) => void;
}

export interface ApprovalRequest {
  skill: string;
  reason: string;
  payload: unknown;
}

export interface ApprovalDecision {
  approved: boolean;
  approver?: string;
  note?: string;
}

export interface HumanApproval {
  request: (request: ApprovalRequest) => Promise<ApprovalDecision>;
}

export interface SkillContext {
  runId: string;
  caller: string;
  now: () => Date;
  logger: SkillLogger;
  approval?: HumanApproval;
  callSkill: <I, O>(name: string, input: I) => Promise<SkillResult<O>>;
}

export type SkillResult<O> =
  | { ok: true; output: O; durationMs: number }
  | { ok: false; error: string; durationMs: number };

export interface Skill<I = unknown, O = unknown> {
  manifest: SkillManifest;
  run: (input: I, ctx: SkillContext) => Promise<O>;
}
