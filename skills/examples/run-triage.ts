import { runSkill, SkillRegistry, triageLeadSkill } from "../src/index.js";

async function main(): Promise<void> {
  const registry = new SkillRegistry();
  registry.register(triageLeadSkill);

  const cases = [
    { source: "telegram" as const, message: "Хотим запустить пилот RoboQC у нас на линии" },
    { source: "web" as const, message: "Расскажите подробнее про возможности" },
    { source: "telegram" as const, message: "Бот не работает, ошибка 500" },
    { source: "voice" as const, message: "hi" },
  ];

  for (const input of cases) {
    const result = await runSkill(registry, "business.triage_lead", input);
    console.log("---");
    console.log("input:", input);
    console.log("result:", JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
