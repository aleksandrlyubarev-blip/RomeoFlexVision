# NeutronVision QC × NVIDIA — Positioning & Outreach Plan

> **Статус:** draft v0.1, 2026-07-10.
> **Контекст:** анонс NVIDIA + LangChain (июль 2026) — Nemotron 3 Ultra, OpenShell (secure agent
> runtime), NemoClaw (reference blueprints для agent harnesses). NVIDIA явно приглашает
> вертикальных игроков строить domain-specific «super agents» на открытом стеке.
> **Цель документа:** зафиксировать позиционирование NeutronVision QC относительно NVIDIA agent
> stack и дать пошаговый план захода в NVIDIA Inception и NVIDIA Israel.
> **Приватность:** документ внутренний. Соблюдает границы из корневого `README.md`: никаких
> публичных заявлений о пилотах/кастомерах, никаких данных работодателя. Брендинг — только
> NeutronVision / NeutronVision QC (см. `ROADMAP.md` §2).

---

## 1. Positioning statement

### One-liner (EN, для Inception-заявки и outreach)

> **NeutronVision QC is an edge-native agentic vision execution layer for visual quality control
> in complex electronics manufacturing — built to run on the open NVIDIA agent stack.**

### Расширенная версия (EN)

> Every dollar of AI capex becomes a physically assembled server. The hidden bottleneck is not
> chips — it is physical assembly QC: screws, cables, connectors, latches, liquid-cooling
> fittings. NeutronVision QC puts an agentic vision layer at the station: edge inference gives the
> operator a verdict in under a second, a multi-agent reasoning pipeline handles borderline and
> novel cases, and every inspection becomes an immutable, audit-ready evidence record that feeds a
> training-data flywheel. We don't sell a model — we sell the execution layer that actually
> deploys on the line.

### Позиция относительно NVIDIA (ключевой фрейм)

NVIDIA строит **горизонтальный слой**: модели, оптимизированные под агентов (Nemotron 3 Ultra),
безопасный runtime (OpenShell), reference blueprints (NemoClaw). Их публичная философия — «super
agents становятся crown jewels компаний», и вертикальные агенты строят те, у кого есть доменная
экспертиза.

**Мы — вертикаль.** Формула для любого разговора с NVIDIA:

| NVIDIA даёт | NeutronVision добавляет |
|---|---|
| Nemotron 3 Ultra — open MoE, post-trained под long-running agentic workflows | Доменный reasoning: defect taxonomy, SOP-контекст, escalation-логика QC |
| OpenShell — policy-based secure runtime (filesystem/network/process isolation) | Production-политики для factory floor: air-gapped/on-prem, никакой утечки данных клиента |
| NemoClaw — blueprints, связывающие модель + harness + runtime | Готовый вертикальный harness: 6-агентный inspection-пайплайн (LangGraph), evidence log, human-in-the-loop friction gates |
| Jetson-class edge inference economics | Edge-first архитектура: офлайн-вердикт без облака, <200ms на станции |

Мы **не конкурируем** ни с одним слоем NVIDIA — мы каноничный пример того, для кого этот стек
сделан. Это и есть тезис любого письма/заявки.

---

## 2. Что говорим и чего не говорим (traction framing)

Согласовано с `README.md` (data & IP boundary) и `ROADMAP.md`.

### Можно и нужно говорить

- **Стадия:** working prototype phase. Два трека: offline-capable camera app (checker) и
  6-агентный inspection-пайплайн (rhaef_v2) на LangGraph; camera-прототипы — цель июля 2026.
- **Технология:** edge-first (ONNX runtime, офлайн-вердикт), multi-agent reasoning с model
  routing, синтетический data-генератор по wedge-дефектам (screw / cable / connector / latch /
  routing), evidence-log формат, готовый к QMS/MES-интеграции.
- **Доменная экспертиза фаундера:** годы в high-mix electronics / server assembly manufacturing
  (NPI, QC-процессы, реальные RMA-паттерны) — без называния работодателя и его данных.
- **Рынок:** AI hardware build-out → нелинейный рост стоимости дефекта; traceability pressure от
  hyperscaler/auto/defense кастомеров; greenfield EMS/ODM под GPU-сборку.

### Нельзя говорить (публично и в заявках)

- «Factory pilots», «customer deployments», «live investigations» и любые цифры внедрений — их
  нет; продукт в прототипной фазе, и README прямо запрещает такие публичные заявления.
- Имя работодателя, данные заказчиков, production-фото, внутренние work instructions.
- Старые бренды: RoboQC, LarmorSight — только NeutronVision / NeutronVision QC / checker.

> Честная стадия — не слабость для Inception: программа рассчитана на стартапы от идеи до
> scale-up, и «working prototype + deep domain expertise + built on your stack» — сильная заявка.

---

## 3. Техническая стыковка с NVIDIA stack (что показываем)

Минимальный «proof of alignment», который стоит собрать **до** серьёзного outreach (2–4 недели
работы, детали — отдельной задачей):

1. **Nemotron 3 Ultra в ModelRouter.** `rhaef_v2/` уже имеет ModelRouter с категориями задач
   (см. `ARCHITECTURE.md`). Добавить Nemotron 3 Ultra как backend для категорий
   Orchestration/Volume (позже — Vision, если появится VLM-вариант), прогнать
   `scripts/bench_roboqc` и получить сравнимые цифры cost/latency/accuracy против текущих
   облачных моделей. Одна таблица бенчмарка = главный слайд для любого разговора с NVIDIA.
2. **OpenShell как runtime для inspection-агентов.** Наш FrictionGate/human-approval паттерн +
   их policy-based sandbox — естественная пара. Обернуть выполнение пайплайна в OpenShell-policy
   (no network egress к данным клиента, filesystem allowlist) — это готовый security story для
   on-prem manufacturing.
3. **Jetson-таргет для checker.** Офлайн-движок (ONNX) уже выбран как портируемый default —
   прогнать checker на Jetson-class железе и зафиксировать latency. «Runs on Jetson» — входной
   билет в разговоры с NVIDIA edge/robotics командами.
4. **NemoClaw blueprint contribution (стретч).** Оформить наш inspection-пайплайн как
   вертикальный пример blueprint'а «manufacturing visual QC agent». Даже draft-PR или
   design-doc в их публичном репо — сильнейший сигнал для Inception и DevRel.

---

## 4. NVIDIA Inception — заявка

**Что это:** бесплатная программа NVIDIA для AI-стартапов (без equity и без сроков). Даёт:
кредиты/скидки на GPU и облако, доступ к DGX-ресурсам и техэкспертизе, preferred pricing,
VC Alliance (интро к инвесторам), go-to-market поддержку и маркетинговую витрину.

**Формальные требования:** зарегистрированное юрлицо, работающий сайт, направление — AI/data
science. Стадия — любая (от seed до scale-up).

**Pre-flight checklist (до подачи):**

- [ ] Юрлицо зарегистрировано (если ещё нет — это блокер, решить первым).
- [ ] Публичный сайт живёт под брендом NeutronVision и **чист от LarmorSight/RoboQC и от
      заявлений о пилотах** (пересекается с задачей разделения репозиториев из ROADMAP §2).
- [ ] Корпоративный e-mail на домене (заявки с gmail выглядят слабее).
- [ ] LinkedIn компании + фаундера синхронизированы с брендом и стадией.
- [ ] 1-страничный tech overview (из §1 и §3 этого документа) в PDF.

**Черновики ответов на типовые поля заявки (EN):**

- *What does your company do?* — абзац «Расширенная версия» из §1.
- *What is your AI/ML technology?* — Multi-agent visual inspection pipeline (LangGraph
  orchestration, model routing across frontier and open models incl. Nemotron 3 Ultra),
  edge-first ONNX inference for sub-second operator feedback, synthetic defect data generation
  for the top server-assembly defect classes, and an immutable evidence log that turns every
  human decision into training signal.
- *How do you use / plan to use NVIDIA technology?* — Jetson-class edge inference at the
  station; Nemotron 3 Ultra as the reasoning backbone of our agent pipeline; OpenShell as the
  secure on-prem runtime for factory deployments; evaluating NemoClaw blueprints as the
  packaging for our vertical harness. GPU training for fine-tuned defect models on DGX-class
  hardware as our dataset grows.
- *Stage / traction?* — Working prototype (offline-capable camera app + multi-agent pipeline),
  hardware prototype phase in progress; founder with deep operational background in high-mix
  electronics and server assembly manufacturing. Pre-revenue, pre-institutional-funding.

---

## 5. NVIDIA Israel — заход

**Почему это реально:** NVIDIA называет Израиль «second home» — тысячи сотрудников, крупнейший
R&D-хаб вне США (наследие Mellanox: networking, interconnect — то самое железо, которое мы
инспектируем), строящийся мега-кампус на севере страны. Экосистемные команды активно работают со
стартапами через Inception.

**Логика захода (последовательность, не параллельно всё сразу):**

1. **Inception first (неделя 1–2).** Подать заявку (§4). Членство = легитимность + доступ к
   локальным ивентам и людям. Все следующие шаги ссылаются на «we're an Inception member».
2. **Бенчмарк-артефакт (недели 2–5).** Собрать proof of alignment из §3 (минимум пункты 1 и 3).
   Без технического артефакта outreach — просто слова.
3. **Warm-контур (параллельно).** Израильская NVIDIA-экосистема плотная: митапы (GTC-style
   local events, Jetson/robotics meetups), Inception-ивенты, AI-комьюнити Хайфы и Тель-Авива.
   Цель — 2–3 живых знакомства с DevRel / Inception program manager / edge-robotics людьми до
   любого холодного письма.
4. **Целевые роли для outreach (искать в LinkedIn):**
   - Inception Program Manager (Israel / EMEA);
   - Developer Relations — agentic AI / NeMo ecosystem;
   - Solutions Architect — edge / Jetson / manufacturing;
   - (позже, при traction) Business Development — industrial / robotics.
5. **Ask всегда конкретный.** Не «давайте дружить», а: feedback на бенчмарк Nemotron в нашем
   пайплайне; доступ к DGX-часам для fine-tune; включение нашего кейса как vertical example в
   NemoClaw; интро к EMS/ODM-партнёрам NVIDIA в Израиле.

**Шаблон холодного LinkedIn-сообщения (EN, ~90 слов, под DevRel/SA):**

> Hi {Name} — I'm building NeutronVision QC, an edge-native agentic vision layer for visual QC
> in server assembly (screws, cables, connectors, liquid-cooling fittings). We just benchmarked
> Nemotron 3 Ultra as the reasoning backbone of our LangGraph inspection pipeline —
> {X}× cheaper per inspection at comparable accuracy vs. the closed-model baseline, running
> toward Jetson at the edge. Deep background in high-mix electronics manufacturing on my side.
> Would love 20 minutes to show the benchmark and hear where this fits the NemoClaw blueprint
> direction. (We're an NVIDIA Inception member.)

**Шаблон follow-up после ивента (EN, короче):**

> Great meeting you at {event}. As promised — one-pager on NeutronVision QC: agentic visual
> inspection for electronics assembly, Nemotron + OpenShell at the core, evidence-log-first.
> The benchmark table is on page 2. Open to a short call if the manufacturing vertical is
> interesting for the {team} roadmap.

---

## 6. Последовательность (сводный план)

| Шаг | Что | Зависимости | Горизонт |
|---|---|---|---|
| 1 | Юрлицо + чистый публичный сайт NeutronVision | ROADMAP §2 (разделение репо) | блокер, первым |
| 2 | Подача в NVIDIA Inception | шаг 1 | неделя 1–2 |
| 3 | Nemotron 3 Ultra в ModelRouter + бенчмарк | rhaef_v2 tag `rhaef-v2-r1` | недели 2–4 |
| 4 | checker на Jetson-class железе, latency-цифры | camera-прототипы (июль) | недели 3–6 |
| 5 | One-pager + benchmark PDF | шаги 3–4 | неделя 5 |
| 6 | Локальные ивенты + 2–3 warm-интро | шаг 2 | параллельно |
| 7 | Целевой outreach (DevRel / SA / Inception PM) | шаги 5–6 | недели 6–8 |
| 8 | Стретч: NemoClaw vertical blueprint contribution | шаг 3 | после шага 7 |

**Критерий успеха фазы (8 недель):** Inception-членство получено; бенчмарк Nemotron в нашем
пайплайне опубликован (одобренная публичная версия); ≥1 содержательный разговор с NVIDIA Israel
(DevRel/SA) с конкретным follow-up.

---

*Файл живой — обновлять после подачи в Inception и первых ответов.*
