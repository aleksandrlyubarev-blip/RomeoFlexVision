import type { Skill } from "../../types.js";

export interface TriageLeadInput {
  source: "telegram" | "voice" | "web";
  message: string;
  contact?: string;
}

export interface TriageLeadOutput {
  intent: "pilot_request" | "info" | "support" | "noise";
  priority: "p0" | "p1" | "p2";
  nextAction:
    | "schedule_pilot_call"
    | "open_support_ticket"
    | "send_info_pack"
    | "ignore";
  rationale: string;
}

const PILOT_HINTS = ["пилот", "pilot", "внедр", "интегр", "тест на нашей"];
const SUPPORT_HINTS = ["не работает", "ошибк", "сломал", "support"];

export const triageLeadSkill: Skill<TriageLeadInput, TriageLeadOutput> = {
  manifest: {
    name: "business.triage_lead",
    version: "0.1.0",
    kind: "business",
    owner: "growth",
    description:
      "Классифицирует входящий лид (Telegram / voice / web) и выбирает следующее действие.",
    inputs: {
      source: "telegram|voice|web",
      message: "string",
      contact: "string?",
    },
    outputs: {
      intent: "pilot_request|info|support|noise",
      priority: "p0|p1|p2",
      nextAction:
        "schedule_pilot_call|open_support_ticket|send_info_pack|ignore",
      rationale: "string",
    },
    risk: "low",
    tags: ["lead", "triage", "growth"],
  },
  async run(input, ctx) {
    const text = input.message.toLowerCase();
    const isPilot = PILOT_HINTS.some((h) => text.includes(h));
    const isSupport = SUPPORT_HINTS.some((h) => text.includes(h));

    if (isPilot) {
      ctx.logger.info("lead classified as pilot_request", {
        runId: ctx.runId,
        source: input.source,
      });
      return {
        intent: "pilot_request",
        priority: "p0",
        nextAction: "schedule_pilot_call",
        rationale:
          "В сообщении явный запрос на пилот / внедрение RoboQC.",
      };
    }

    if (isSupport) {
      return {
        intent: "support",
        priority: "p1",
        nextAction: "open_support_ticket",
        rationale: "Сообщение похоже на запрос поддержки.",
      };
    }

    if (text.length < 5) {
      return {
        intent: "noise",
        priority: "p2",
        nextAction: "ignore",
        rationale: "Слишком короткое сообщение, скорее шум.",
      };
    }

    return {
      intent: "info",
      priority: "p2",
      nextAction: "send_info_pack",
      rationale: "Запрос на общую информацию о RoboQC.",
    };
  },
};
