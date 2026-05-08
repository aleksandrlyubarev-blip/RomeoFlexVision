# RomeoFlexVision — Pitch Deck (Draft)

> Status: **draft v0.1** — narrative pass, не дизайн.
> Audience: seed / Series A investors с интересом к AI infra и industrial AI.
> Tone: short, punchy, evidence-first. Каждый слайд = одна идея + один график/визуал.

---

## Slide 1 — AI infrastructure is exploding

**One-liner.** Каждый доллар, который мир тратит на AI, рано или поздно превращается в физически собранный сервер.

- AI compute spend → GPU servers → liquid cooling → dense cable / interconnect assembly.
- Hyperscaler capex на AI hardware растёт двузначными темпами; bottleneck смещается с чипов на сборку и интеграцию.
- Каждый новый rack = больше кабелей, connector points, шлангов жидкостного охлаждения, screw-операций.

**Visual:** воронка — AI spend → GPUs → racks → cables/connectors/latches → physical QC.

**Takeaway.** AI build-out — это в значительной мере *manufacturing problem*, не software problem.

---

## Slide 2 — Hidden bottleneck: physical assembly quality

**One-liner.** Чем сложнее серверы, тем дороже ошибки сборки.

Defect categories, которые мы видим в AI hardware и high-end electronics:

- **Screw** — missing / wrong torque / wrong type.
- **Cable** — wrong port, недотянут, перепутан, перекрещен.
- **Connector** — повреждён, не до конца защёлкнут.
- **Latch** — open/closed, broken.
- **Leak** — liquid cooling fittings, hose routing.
- **Routing** — кабельные жгуты идут поверх hot zones / blocking airflow.

Один пропущенный defect → field failure → downtime hyperscaler-кастомера → RMA + штрафы + репутация.

**Takeaway.** Defect cost растёт нелинейно с ценой системы. На AI rack за $2–3M ошибка $5 connector-а становится катастрофой.

---

## Slide 3 — Manual QC does not scale

**One-liner.** Текущий QC — глаза уставшего человека и Excel-чеклист.

- **Slow** — inspection time бутылочное горлышко на NPI ramp.
- **Inconsistent** — два инспектора, два разных вердикта.
- **Human-dependent** — attention drift, ночные смены, текучка.
- **Poorly documented** — нет фото-evidence, нет immutable log, нет root-cause возможности.
- **Not AI-ready** — данные не собираются в форме, пригодной для обучения моделей.

**Visual:** typical QC station сегодня — printed checklist, фонарик, телефон оператора.

**Takeaway.** QC сегодня — это не процесс, а ритуал. Это не выдержит x10 объёмов AI hardware.

---

## Slide 4 — RomeoFlexVision

**One-liner.** AI-powered visual QC execution layer for complex electronics manufacturing.

Мы — не «ещё одно AI app». Мы — слой контроля качества, который сидит между:

- **Оператором** на станции,
- **Камерами** (edge cameras + smart phones + jigs),
- **QMS / MES** системами завода,
- **QC-инженером** (human-in-the-loop).

**Что делает RomeoFlexVision:**
1. Видит юнит на станции через камеру.
2. Понимает, какая операция сейчас идёт (по SOP / work order).
3. Проверяет конкретные visual checks за миллисекунды.
4. Подсказывает оператору / эскалирует в QC-инженера.
5. Сохраняет полный evidence trail.

**Takeaway.** Мы продаём не модель, а *execution layer* — то, что реально внедряется на линии.

---

## Slide 5 — Why now

Окно открылось одновременно по четырём направлениям:

- **Multimodal AI** — модели умеют читать SOP и смотреть на железку *в одном промпте*. Раньше нужно было обучать узкие классификаторы на каждый defect.
- **Cheaper edge inference** — Jetson-class и аналоги делают <100ms inference economics нормальной.
- **Traceability pressure** — AI hardware buyers (hyperscalers, auto, defense) требуют evidence chain. Не «у нас QC есть», а «покажите фото каждой операции».
- **AI hardware boom** — новые EMS, ODM, contract manufacturers стоят в очереди под GPU server builds, у них *нет* legacy QC процессов. Greenfield = легче внедряться.

**Takeaway.** Точно сейчас одновременно есть и технологическая возможность, и рыночное давление, и greenfield deployments.

---

## Slide 6 — Product wedge / MVP

**One-liner.** Мы не делаем «AI для всего завода». Мы заходим через 3–4 операции, которые реально болят.

**Wedge actions (MVP scope):**
- ✅ **Screw presence** — все ли винты на месте, в правильных позициях.
- ✅ **Connector / cable connected** — кабель в правильном порту, до защёлки.
- ✅ **Latch open / closed** — состояние защёлок и фиксаторов.
- ✅ **Wrong routing / crossing** — кабельный жгут идёт по правильной трассе.
- ✅ **Connector damage** — bent pins, scratches, contamination.

Почему это правильный wedge:
- Эти ошибки = top-5 RMA причин в server assembly.
- Visually inspectable → AI tractable.
- Каждая может быть оценена за < 1 секунды на станции.
- Внедряется на одной станции за 1–2 недели, не за квартал.

**Takeaway.** Узкий, остро болящий wedge → быстрый ROI → доверие → расширение по линии.

---

## Slide 7 — Evidence log = immediate value

**One-liner.** Даже до идеальной AI-точности система генерит ценность через traceability.

Каждая инспекция сохраняется как immutable record:

| Поле                | Пример                                  |
|---------------------|-----------------------------------------|
| Photo before/after  | full-resolution + crop вокруг defect-а  |
| Station ID          | `ST-A4-RACK-FINAL`                      |
| Operator ID         | `op_4821`                               |
| Work order          | `WO-2026-05-118822`                     |
| Issue type          | `connector_not_seated`                  |
| AI confidence       | `0.83`                                  |
| Human decision      | `approved` / `reject` / `rework`        |
| Correction status   | `fixed_at_station` / `escalated`        |

**Что это даёт сразу, ещё до 99% AI accuracy:**
- Customer audit-ready package.
- Root-cause analysis по defect trends.
- Training data flywheel — каждое решение оператора tunes систему.

**Takeaway.** Evidence log сам по себе — продаваемая ценность. AI улучшает его со временем, но не блокирует ROI на старте.

---

## Slide 8 — Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  STATION (edge)                                                   │
│  Camera(s) → Edge inference → Live operator feedback (<200ms)     │
└──────────┬───────────────────────────────────────────────────────┘
           │ borderline cases, evidence
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  CLOUD REASONING                                                  │
│  Multimodal LLM + defect knowledge graph + SOP context            │
└──────────┬───────────────────────────────────────────────────────┘
           │ flagged items
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  HUMAN APPROVAL (QC engineer console)                             │
│  Approve / reject / annotate → feeds back into model              │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  EVIDENCE LOG  ←→  QMS / MES integration  ←→  Customer audit       │
└──────────────────────────────────────────────────────────────────┘
```

**Принципы:**
- **Edge-first** — линия не должна ждать облако.
- **Cloud reasoning** — для borderline / novel случаев.
- **Human-in-the-loop** — operator approval, QC engineer escalation.
- **Open integration** — QMS / MES не выкидываем, а подключаемся.

**Takeaway.** Reliability-first architecture. Завод не остановится если упадёт API.

---

## Slide 9 — Economics

**One-liner.** Мы продаём не compute. Мы продаём фабричные KPI.

| Что мы продаём                | Как считается ROI у клиента                       |
|-------------------------------|---------------------------------------------------|
| Faster inspection             | seconds saved per unit × units/day                |
| Fewer missed defects          | ↓ RMA cost, ↓ field failure, ↓ customer penalties |
| Lower rework                  | ↓ touch labor, ↓ scrap                            |
| Better NPI ramp               | новые продукты выходят на yield быстрее            |
| Visual traceability           | new contracts, которые требуют evidence           |

**Pricing model (директива, не финал):**
- Per-station subscription + per-inspection meter.
- Implementation services на старте.
- Premium tier — AI assistant for QC engineer (см. slide 10).

**Unit economics направление:**
- Один defect, пойманный в RomeoFlexVision = $X сэкономлено vs RMA.
- Год подписки на станцию ≪ цена одного полевого incident.

**Takeaway.** Мы продаём value, привязанную к hardware-grade KPI, а не к токенам.

---

## Slide 10 — AI assistant for QC engineer

**One-liner.** Agentic AI — но в кабинете QC-инженера, не в real-time control loop.

Что умеет ассистент:
- **«Why this defect?»** — объяснение по фото + контексту операции.
- **«Show similar cases»** — поиск по evidence log за всё время.
- **«Create defect report»** — auto-генерация документа в формате клиента.
- **«Update checklist»** — предложение нового check-а после серии похожих RMA.
- **«Compare across stations / shifts / operators»** — analytics по живым данным.

**Почему это безопасно:**
- Не управляет линией.
- Не останавливает производство автономно.
- QC engineer = последняя точка апрува.

**Takeaway.** Это AI, которая не «разрушает», а *освобождает* самого дорогого человека на линии — QC-инженера.

---

## Slide 11 — Moat

Несколько слоёв, каждый усиливается со временем:

1. **Proprietary defect dataset** — фото, аннотации, evidence chain. Не покупается на open market.
2. **Factory-specific knowledge graph** — какие SOP, какие SKU, какие исторические defect patterns у *этого* завода.
3. **Visual instruction understanding** — модель читает SOP/work order и сопоставляет с тем, что видит. Это compound capability.
4. **Production feedback loop** — каждая коррекция оператора и QC-инженера → tuning → улучшение accuracy → больше доверия → больше операций под управление.
5. **QMS / MES integration** — после того как мы прошиты в производственный процесс, switching cost растёт квартал за кварталом.

**Takeaway.** Moat не «у нас лучше модель». Moat — *где мы стоим* и *что у нас в логе*.

---

## Slide 12 — Investment thesis

**Тезис в одном абзаце.**
AI hardware build-out не замедлится в горизонте 5+ лет. Скрытое узкое горлышко — не чипы, а physical assembly QC. RomeoFlexVision — execution layer, который сидит в этом узком месте: software-маржа, hardware-grade defensibility (proprietary data + deep integration). Wedge сейчас → расширение в QC operating system для AI infrastructure manufacturing.

**Почему мы:**
- Команда: [TODO — founder backgrounds, manufacturing + AI].
- Traction: [TODO — pilots, design partners, LOIs, evidence-log volume].
- Технология: edge-ready, multimodal-native, integration-first.

**Ask.**
- Раунд: $[TODO]M seed / Series A.
- Use of funds: [TODO — % product, % deployments, % go-to-market, % data ops].
- Milestones к следующему раунду: [TODO — # paying factories, # stations live, % defects auto-caught, ARR].

**Takeaway.** AI hardware boom уже оплачен. Мы — слой, который защищает каждый собранный rack и одновременно собирает данные, которых нет ни у кого.

---

## Appendix (для бэкапа на Q&A)

- Конкурентный ландшафт: legacy machine vision (Cognex/Keyence) — заточены под одну задачу, не multimodal, не traceability-first; generic «AI vision» стартапы — нет factory integration; in-house EMS решения — фрагментарны.
- Risks: data access на старте, customer procurement циклы, hardware supply (cameras/edge boxes), regulatory в защитных вертикалях.
- Roadmap milestones: [TODO].

---

*Файл живой — обновляем по мере pilot-data и feedback от инвесторов.*
