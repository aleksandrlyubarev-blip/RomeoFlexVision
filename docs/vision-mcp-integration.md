# Vision MCP Integration (Draft-Safe)

## Goal
Integrate Roboflow MCP as an optional vision provider without coupling business logic to a single vendor.

## Provider model
- `VisionDataProvider` protocol
- `LocalVisionProvider`
- `RoboflowMCPProvider`

## Safety policy
All external and write actions remain `draft_pending_human_approval`.
No automated final QC pass/fail decisions are permitted.

## Recommended runtime flag
- `RHAEF_VISION_PROVIDER=local|roboflow_mcp`
