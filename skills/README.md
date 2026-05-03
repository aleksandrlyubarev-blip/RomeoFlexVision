# @rfv/skills

Skeleton AI-first skills architecture for Romeo FlexVision / RoboQC.

A **skill** is a small, versioned, schema-described unit of work that can be
invoked by a human operator, by another skill, or by an autonomous agent loop
(the existing voice-gateway, telegram-bot, or the future Brigada orchestrator).

Two kinds of skills:

- **business** — encodes domain expertise (lead triage, pilot summary,
  defect-policy decisions). Authored by domain experts, ideally via vibe-coding.
- **infrastructure** — wraps a side effect (Telegram send, scene-ops fetch,
  CRM write). Authored by engineers and audited.

## Quickstart

```ts
import { runSkill, SkillRegistry, triageLeadSkill } from "@rfv/skills";

const registry = new SkillRegistry();
registry.register(triageLeadSkill);

const result = await runSkill(registry, "business.triage_lead", {
  source: "telegram",
  message: "Хотим запустить пилот RoboQC",
});

if (result.ok) {
  console.log(result.output.nextAction);
}
```

Run the demo:

```bash
cd skills
npm install
npm run demo
```

See [`docs/ai-first-skills-architecture.md`](../docs/ai-first-skills-architecture.md)
for the full design and how this layer relates to the Brigada multi-agent system.
