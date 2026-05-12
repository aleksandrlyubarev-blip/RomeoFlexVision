# RomeoFlex Voice Copilot V0.1

## Safety limitations
- Voice copilot is **not** final QC authority.
- Final QC Pass/Fail must be performed by a human.
- All external/write actions remain `draft_pending_human_approval`.

## Backend setup
```bash
cd apps/voice-copilot/backend
export OPENAI_API_KEY=...
uvicorn main:app --reload --port 8010
```

## Frontend setup
```bash
cd apps/voice-copilot/frontend
npm install
npm run dev
```

Configure frontend proxy to backend `/api/realtime/token`.


## Edge deployment note
- Primary capture can run on Jetson Nano.
- Heavy inference can run on Jetson Orin 64GB.
- Any resulting decision remains `draft_pending_human_approval` until human QC sign-off.
