# NeutronVision

Independent visual-AI research and demo stack for human-in-the-loop inspection workflows.

## System role

This repo is the camera capture, frame-quality checks and assisted human review container of the Physical AI inspection system.
System map: https://github.com/aleksandrlyubarev-blip/physical-ai-inspection-system
Generated architecture: [./docs/litho/](./docs/litho/) (created by a successful Litho run).
Product canon: [litho/context/PRODUCT.md](litho/context/PRODUCT.md).

## Public positioning

This public repository should be treated as a research and demo surface, not as a production customer deployment.

The public layer is:

- **NeutronVision** — research layer for visual inspection workflows, evidence logging, and human review.
- **NeutronVision Checker** — camera-based demo/reference application for image capture, frame-quality checks, assisted review, and evidence artifacts.

## Data and IP boundary

The public repository is intended for public datasets, synthetic examples, and generic manufacturing-quality concepts only.

It should not include employer data, customer data, production photos, internal work instructions, proprietary layouts, confidential defect records, or reverse-engineered geometry from any third-party manufacturing site.

Future production deployments should use customer-supplied data only under a written agreement.

## Monorepo

| Directory | Purpose | Public posture |
|---|---|---|
| `checker/` | NeutronVision Checker demo app: camera -> assisted review -> evidence artifacts | Public demo/reference layer |
| `roboqc_data/` | Dataset tooling for public/synthetic examples | Public only if license-tracked |
| `rhaef_v2/` | Agent pipeline experiments | Consider private if tied to product roadmap |
| `docs/` | Notes, architecture, and decks | Needs cleanup before public use |
| `infra/` | Deployment/testbed scaffolding | Consider private |

## Current cleanup priority

1. Keep the public site focused on NeutronVision and NeutronVision Checker.
2. Remove public claims about pilots, proprietary datasets, customer deployments, factory-specific knowledge, and unnamed future product tracks.
3. Replace old pitch decks with a safe public overview before promoting the site.

## Architecture docs

[Litho runbook](litho/README.md) · [Product canon](litho/context/PRODUCT.md).
Generated architecture is written to [docs/litho/](docs/litho/) after a successful run.
No model-generated documentation is committed by this scaffold: the implementation environment has no `LITHO_LLM_API_KEY`.

```bash
cargo install deepwiki-rs --version 1.6.0 --locked
# Export LITHO_LLM_API_KEY securely in your shell; never store it in Git.
bash scripts/litho_generate.sh --check
bash scripts/litho_generate.sh
```

The workflow uploads documentation artifacts on configured runs and skips generation when the key is absent.
Review generated claims against the canon before committing Markdown; do not commit caches.
