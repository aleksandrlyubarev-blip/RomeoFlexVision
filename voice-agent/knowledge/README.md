# Knowledge collections — Romeo voice agent

The Voice Agent Builder attaches document collections to the agent via the
built-in `file_search` tool (Collections API under the hood). This directory
defines what goes into each collection; the documents themselves are uploaded
in the console (or via the Collections API), not committed here unless they
are public/synthetic.

## Collection layout

| Collection | Contents | Source |
|---|---|---|
| `roboqc-defect-glossary` | One doc per defect class: name, spoken description, typical cause, severity guidance (solder bridge, missing component, misalignment, insufficient solder, tombstoning, ...) | `roboqc-defect-glossary.md` in this directory (public AOI/IPC-A-610 general knowledge — no customer defect records) |
| `roboqc-operator-guide` | How to phrase questions to Romeo, what each stat means (pass rate vs. first-pass yield, throughput), escalation matrix | `roboqc-operator-guide.md` in this directory; derived from `../playbook.md`, keep in sync |
| `neutronvision-overview` | Public positioning docs: what NeutronVision / RoboQC / the Checker demo are, what they are not | Root `README.md`, `ARCHITECTURE.md` (public sections only) |

Formats accepted by the builder: PDF, MD, DOCX, TXT and similar. Prefer
Markdown — smallest, cleanest chunking.

## Rules

1. **Public data only.** Same boundary as the root `README.md`: no employer or
   customer data, no production photos, no proprietary work instructions or
   defect records. Synthetic examples are fine and should be labeled synthetic.
2. **One topic per document.** Retrieval is chunk-based; a 40-page combined
   manual retrieves worse than 15 focused pages.
3. **Write for the ear.** Retrieved text gets spoken. Short sentences, numbers
   written the way they should be pronounced in examples.
4. **Version in git first.** Add or edit documents here (public ones) or in
   the private docs repo, then re-upload — the console copy is a deployment,
   not the source of truth.
