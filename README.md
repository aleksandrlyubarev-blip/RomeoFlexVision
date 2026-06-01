# NeutronVision

Independent visual-AI research and demo stack for human-in-the-loop inspection workflows.

## Public positioning

This public repository should be treated as a research and demo surface, not as a production customer deployment.

The public layer is:

- **NeutronVision** — research layer for visual inspection workflows, evidence logging, and human review.
- **NeutronVision Checker** — camera-based demo/reference application for image capture, frame-quality checks, assisted review, and evidence artifacts.

A future commercial product track may be separated into a private repository later. That track is intentionally not named or promoted in the public repository.

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
2. Keep any future commercial product track private and unnamed in public materials until the split is ready.
3. Remove public claims about pilots, proprietary datasets, customer deployments, and factory-specific knowledge unless they are verified and approved for publication.
4. Replace old pitch decks with a safe public overview before promoting the site.
