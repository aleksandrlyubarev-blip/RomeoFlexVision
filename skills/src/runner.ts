import { randomUUID } from "node:crypto";
import type { SkillRegistry } from "./registry.js";
import type {
  HumanApproval,
  Skill,
  SkillContext,
  SkillLogger,
  SkillResult,
} from "./types.js";

export interface RunSkillOptions {
  caller?: string;
  approval?: HumanApproval;
  logger?: SkillLogger;
}

const consoleLogger: SkillLogger = {
  info: (msg, data) => console.log(`[skill] ${msg}`, data ?? ""),
  warn: (msg, data) => console.warn(`[skill] ${msg}`, data ?? ""),
  error: (msg, data) => console.error(`[skill] ${msg}`, data ?? ""),
};

export async function runSkill<I, O>(
  registry: SkillRegistry,
  name: string,
  input: I,
  options: RunSkillOptions = {},
): Promise<SkillResult<O>> {
  const startedAt = Date.now();
  const skill = registry.get(name) as Skill<I, O> | undefined;
  if (!skill) {
    return {
      ok: false,
      error: `skill "${name}" not found`,
      durationMs: Date.now() - startedAt,
    };
  }

  const logger = options.logger ?? consoleLogger;
  const ctx: SkillContext = {
    runId: randomUUID(),
    caller: options.caller ?? "anonymous",
    now: () => new Date(),
    logger,
    approval: options.approval,
    callSkill: (n, i) => runSkill(registry, n, i, options),
  };

  if (skill.manifest.requiresHumanApproval) {
    if (!options.approval) {
      return {
        ok: false,
        error: `skill "${name}" requires human approval but no approval channel was provided`,
        durationMs: Date.now() - startedAt,
      };
    }
    const decision = await options.approval.request({
      skill: name,
      reason: skill.manifest.description,
      payload: input,
    });
    if (!decision.approved) {
      const note = decision.note ? `: ${decision.note}` : "";
      return {
        ok: false,
        error: `human declined skill "${name}"${note}`,
        durationMs: Date.now() - startedAt,
      };
    }
  }

  try {
    const output = await skill.run(input, ctx);
    return { ok: true, output, durationMs: Date.now() - startedAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`skill "${name}" failed`, { runId: ctx.runId, message });
    return { ok: false, error: message, durationMs: Date.now() - startedAt };
  }
}
