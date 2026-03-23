# RomeoFlexVision
My web page

## SceneOps Integration

The frontend now exposes a single SceneOps seam for the multi-agent video workflow:

- `PinoCut` scene bundle and timing
- `Andrew-Analitic` review summary and confidence
- `Bassito` visual job queue state

Use `VITE_SCENE_OPS_URL` in `romeoflexvision/.env.example` to point the UI at a real JSON endpoint.
During local integration, the Andrew bridge can already serve a compatible demo payload at
`http://localhost:8100/scene/ops/demo`.
For GitHub Pages production, the app can also read a same-origin static snapshot from
`/scene-ops.json`, so `romeoflexvision.com` does not require a separate backend host.
If the variable is missing, the app falls back to a local mock snapshot so the UI can still be reviewed.

## SceneOps Sync Without External Hosting

This repository now includes a GitHub Actions workflow:

- [.github/workflows/sync-scene-ops.yml](.github/workflows/sync-scene-ops.yml)

It can refresh `romeoflexvision/public/scene-ops.json` in three ways:

1. `workflow_dispatch` with a `source_url`
2. `repository_dispatch` with `event_type=scene_ops_snapshot` and an inline `snapshot` payload
3. repository variable `SCENE_OPS_SOURCE_URL` for pull-based sync from a public JSON URL

If none of those are set, the workflow now falls back to the canonical public
snapshot in `PinoCut`:

- `https://raw.githubusercontent.com/aleksandrlyubarev-blip/Pino_cut/main/docs/pinnocat-scene-ops-v1.example.json`

The workflow also runs on a schedule every 6 hours, so the static Pages site can
keep following the shared SceneOps contract without needing a separate backend
host.

Every successful sync commits the updated `scene-ops.json` to `main`, which automatically triggers the Pages deploy workflow and updates `romeoflexvision.com`.
