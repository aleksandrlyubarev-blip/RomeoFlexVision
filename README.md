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
If the variable is missing, the app falls back to a local mock snapshot so the UI can still be reviewed.
