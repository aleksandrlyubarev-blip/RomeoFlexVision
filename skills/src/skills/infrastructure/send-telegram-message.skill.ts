import type { Skill } from "../../types.js";

export interface SendTelegramMessageInput {
  chatId: string | number;
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
}

export interface SendTelegramMessageOutput {
  delivered: boolean;
  messageId?: number;
}

export interface TelegramTransport {
  sendMessage: (
    chatId: string | number,
    text: string,
    parseMode?: "HTML" | "MarkdownV2",
  ) => Promise<{ messageId: number }>;
}

export function createSendTelegramMessageSkill(
  transport: TelegramTransport,
): Skill<SendTelegramMessageInput, SendTelegramMessageOutput> {
  return {
    manifest: {
      name: "infra.telegram.send_message",
      version: "0.1.0",
      kind: "infrastructure",
      owner: "platform",
      description:
        "Отправляет сообщение в Telegram-чат через подключённый transport.",
      inputs: {
        chatId: "string|number",
        text: "string",
        parseMode: "HTML|MarkdownV2?",
      },
      outputs: { delivered: "boolean", messageId: "number?" },
      risk: "medium",
      requiresHumanApproval: false,
      tags: ["telegram", "messaging"],
    },
    async run(input, ctx) {
      ctx.logger.info("sending telegram message", {
        runId: ctx.runId,
        chatId: input.chatId,
      });
      const result = await transport.sendMessage(
        input.chatId,
        input.text,
        input.parseMode,
      );
      return { delivered: true, messageId: result.messageId };
    },
  };
}
