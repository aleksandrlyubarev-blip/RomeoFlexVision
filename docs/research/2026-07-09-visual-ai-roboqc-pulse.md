# Visual AI / RoboQC Pulse — 9 July 2026

Research radar for the NeutronVision QC / RoboQC stack. Eight recent items on
vision-based inspection, anomaly detection, and dataset bootstrapping, each
mapped onto concrete repo artifacts and a next-step hook.

> **Scope note.** These are public papers/workflows. Any prototyping seeded from
> them stays inside the data/IP boundary in the root `README.md`: public
> datasets, synthetic examples, and generic QC concepts only — no employer,
> customer, or production data.

**Legend — practicality:** how ready the item is to turn into a RoboQC block
today, given what already exists in this repo.

| # | Item | Theme | Practicality | Primary repo touchpoint |
|---|---|---|---|---|
| 1 | Dimensional Defects (Roboflow) | Geometry / tolerance QC | High | `roboqc_data` cv_layer, `checker` |
| 2 | ICME 2026 Cross-Scenario + Severity | Severity grading | High | `roboqc_data/schema` (gap) |
| 3 | ProCon | Training-free golden-memory AD | High | `roboqc_data` Anomalib export |
| 4 | GLLS | SOP-logic + evidence search | High | `rhaef_v2` / `brigada` |
| 5 | LiZAD | Lightweight zero-shot AD | High | `checker` inference, ONNX/TensorRT export |
| 6 | GenAU | Language-grounded AD reporting | High | `checker` session + `schema` (gap) |
| 7 | CL-Anomaly | Continual learning registry | Medium–High | taxonomy/manifest versioning |
| 8 | SAM3 + Roboflow | Open-vocab bootstrap labeling | Medium–High | `roboqc_data/label_assist` |

---

## 1. Dimensional Defects: Automated Inspection with Vision AI

**Source:** Roboflow, 8 Jul 2026. Detect feature points → measure spacing/alignment
in a Python block → pass/fail against a tolerance. Example: mounting-hole spacing
on a steel bracket.

**Why it matters here.** RoboQC's taxonomy already carries geometry-adjacent
classes — `SCREW_TORQUE_VISUAL`, `CABLE_NOT_SEATED`, `CONNECTOR_NOT_SEATED`,
`WRONG_ROUTING` (`roboqc_data/src/roboqc_data/schema/taxonomy.py`). All of these
are "almost correct but out of tolerance" defects that a surface-only anomaly
model misses. Screw spacing, connector alignment, cable clearance, and cold-plate
mounting-hole fit are dimensional, not cosmetic.

**Repo fit.** The deterministic CV layer under
`roboqc_data/src/roboqc_data/brigada/cv_layer/` already follows the "LLM plans →
OpenCV executes" split; a dimensional-check op fits the same `base.py` /
`registry.py` contract as the existing `scratch_on_connector` op.

**Next step.** Prototype a `dimensional_check` block:
detector/VLM feature points → pixel-to-mm calibration → tolerance rule →
`pass / review / fail` JSON with an annotated measurement overlay. Calibration
(px→mm) is the load-bearing part and should be an explicit, per-fixture input.

---

## 2. ICME 2026 Grand Challenge — Cross-Scenario Defect Detection + Fine-Grained Severity

**Source:** arXiv, submitted 6 Jul 2026. Benchmark for two failure modes: models
breaking on unseen production scenarios, and inspection with no severity
awareness. Severity levels: **Acceptable / Marginal NG / NG / Gross NG**.
~3,800 pixel-level annotated images + ~2,600 severity-labeled images across seven
defect categories.

**Why it matters here — and the concrete gap.** RoboQC should not be binary. The
canonical record schema in `roboqc_data/src/roboqc_data/schema/records.py` today
has `DefectClass` and `DefectCategory`, a per-annotation `confidence`, and
`provenance` — **but no severity field and no PASS/REVIEW/FAIL/CRITICAL verdict.**
That is the single most actionable gap this digest surfaces: the taxonomy answers
*what* the defect is, nothing answers *how bad*.

**Next step.** Add a severity dimension to the schema:

- A `Severity` enum aligned to the challenge levels
  (`ACCEPTABLE / MARGINAL / NG / GROSS_NG`) or the product-facing
  `PASS / REVIEW / FAIL / CRITICAL`.
- Bump `TAXONOMY_VERSION` when it lands (the taxonomy module already documents
  this discipline).
- Drive the verdict from component criticality × defect size × defect location ×
  confidence, with an evidence crop and an operator-override slot — the latter
  pairs with the existing `hold_for_review` / `re_image` actions in the brigada
  `critic_verifier` prompt.

---

## 3. ProCon: Projection-Consistency Memory for Training-Free Anomaly Detection

**Source:** arXiv / GitHub, submitted 6 Jul 2026. Training-free normal-memory AD.
Rather than nearest-neighbor lookup, it projects each test patch onto nearby
normal-memory vectors and uses the residual as anomaly evidence. Strong on
MVTec-AD, VisA, Real-IAD with no decoder training, backbone fine-tuning, learned
fusion, or pseudo-anomaly supervision.

**Why it matters here.** This is the golden-sample inspection path. `roboqc_data`
already ingests exactly these benchmarks (MVTec AD/LOCO, VisA, ISP-AD, PKU-PCB)
and exports an Anomalib folder layout (`export/anomalib_folder.py`). The schema
even has `AnomalyHeatmapRef` for float heatmaps. ProCon's "collect normal crops,
flag unsupported patches" fits per-SKU/per-ROI golden memory without a training
loop.

**Next step.** Implement ProCon-style normal memory: collect ~20 golden crops per
ROI → DINO/SigLIP features → projection-residual heatmap → review/fail threshold.
Store heatmaps via the existing `AnomalyHeatmapRef` so they round-trip through the
manifest.

---

## 4. GLLS: Global Logic and Local Search — Verifiable Industrial Anomaly Detection

**Source:** arXiv, submitted 4 Jul 2026. Training-free, reference-guided multimodal
inspection. Organizes normal references + structured specs into a part-aware
visual-logical atlas, uses SAM 3 for partially-checkable visual facts, and MCTS to
select evidence crops under a fixed budget.

**Why it matters here.** This is close to the RoboQC target architecture already
sketched in `docs/brigada-architecture.md` and the `rhaef_v2` agent pipeline:
SOP/logic first, evidence-crop search second, VLM reasoning **only over traceable
evidence**. The brigada `critic_verifier` already enforces "evidence must be
non-empty and tied to the verdict," which is the same discipline GLLS formalizes.

**Next step.** Build a GLLS-style verifier: SOP → expected parts/ROIs → SAM masks
→ crop search → VLM reasoning restricted to evidence → traceable JSON. The
"fixed evidence budget" idea maps well onto the retry/limit accounting the
critic prompt already tracks.

---

## 5. LiZAD: Lightweight Zero-Shot Anomaly Detection for Industrial Manufacturing

**Source:** arXiv / GitHub, Jul 2026. Combines DINOv3 visual features with
MobileCLIP2 text embeddings; explicitly targeted at real-time defect detection
when per-product labeled defect data is costly or unavailable.

**Why it matters here.** Good candidate for an early unknown-defect service on new
SKUs where only golden samples exist — the exact cold-start problem for a station
that hasn't been trained yet. The lightweight framing matches the edge posture:
`roboqc_data` already exports to ONNX/TensorRT (`export/` + the `[export]`
extra), and `checker` runs an on-device inference thread.

**Next step.** Prototype an edge suspicious-crop service: ROI crop → zero-shot
anomaly heatmap → threshold → save evidence → operator review queue. Feed the
queue into the same review UI the frame sampler (`OVERNIGHT_TASK.md`) targets.

---

## 6. GenAU: Language-Grounded Industrial Anomaly Understanding with VLMs

**Source:** arXiv, submitted 1 Jul 2026. Beyond binary AD: unifies image-level
detection, pixel segmentation, multi-type detection, and textual analysis. Adds
`[SEG_defect]` / `[SEG_normal]` tokens so a VLM emits structured language *and*
localized masks.

**Why it matters here.** Blueprint for RoboQC reporting: defect type + localized
mask + component ID + severity + explanation, not just "FAIL." The pieces exist —
`checker/checker/session/pdf_export.py` already builds evidence artifacts, and the
schema has `MaskRef` + `AnomalyHeatmapRef`. What's missing is the structured
verdict object that stitches them together (see the severity gap in item 2).

**Next step.** Prototype GenAU-style reporting: anomaly mask + component ROI +
rule ID → VLM explanation → structured JSON with defect type, severity,
confidence, mask path, and evidence crop. This is the natural consumer of the
`Severity` enum from item 2.

---

## 7. CL-Anomaly: Continual Learning in Anomaly Detection with MLLMs

**Source:** arXiv, Jul 2026. Continual learning for AD with MLLMs; parameter-efficient
task-private PrivLoRA experts + shared experts to cut semantic interference when
learning new tasks across domains, modalities, and defect scales.

**Why it matters here.** Long-running deployment: station 1 starts on screws/cables,
then adds PCB zones, labels, connectors, cold plates, supplier variants, and
lighting changes without breaking earlier behavior. The repo already has the
versioning primitives — `TAXONOMY_VERSION` and per-manifest `manifest_sha256`
reproducibility — but no per-station/per-SKU adapter registry.

**Next step.** Design a continual-learning registry: each station/SKU gets an
adapter version, a normal-memory bank (ties to items 3/5), a defect taxonomy
version, an evaluation set, a rollback path, and a drift report. Practicality is
Medium–High because it depends on items 2/3 landing first.

---

## 8. Detect Anything Model — SAM3 + Roboflow Workflows

**Source:** Roboflow, 7 Jul 2026. SAM3 open-vocabulary detection from text prompts —
no fixed classes, no retraining. Returns boxes for prompts like "forklift,"
"pallet," "wire cage"; positioned as a fast way to add visual concepts before
training a fixed detector.

**Why it matters here.** Dataset bootstrapping. `roboqc_data/label_assist` is
currently spec'd around **Grounded SAM 2** (bootstrap-only, per the package
README); SAM3 open-vocab prompting is a direct upgrade path. Prompt for "screw,"
"connector," "cable clip," "label," "coolant residue," "cold plate scratch,"
correct the results, then train RF-DETR/YOLO — which the `export/` (COCO,
YOLO-seg) + `train/` adapters already support.

**Next step.** Create a SAM3 bootstrap labeling tool: prompt list → boxes/masks/
counts → human-correction UI → export COCO/YOLO → train RF-DETR / YOLO-seg.
Practicality Medium–High: SAM3 availability/licensing needs confirming before it
replaces Grounded SAM 2 in `label_assist`.

---

## Cross-cutting takeaways

1. **Ship a severity model first (item 2).** It is the highest-leverage, lowest-risk
   change and unblocks reporting (item 6) and the registry (item 7). It is also a
   concrete, self-contained edit to `roboqc_data/schema` rather than a new subsystem.
2. **Golden-memory AD (3 + 5) is the fastest new capability** because ingest and
   Anomalib/edge export already exist — the missing piece is the residual/heatmap
   scorer, not the data plumbing.
3. **GLLS (4) validates the existing brigada direction:** SOP-logic → evidence
   search → VLM-over-evidence is already the shape of the `critic_verifier` loop;
   the paper adds a budgeted crop-search to formalize it.
4. **SAM3 (8) is an incremental swap** in `label_assist`, gated on availability.

*Compiled 2026-07-09. Update cadence: as-needed; supersede rather than edit prior
dated pulses.*
