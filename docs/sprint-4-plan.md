# Sprint 4 Plan — Productionization & Integration Readiness

## Objective
Move RHAEF v2 from a validated runtime scaffold to a productionization-ready integration layer with stronger persistence, observability, and operational controls.

## Scope

### 1) Persistent execution store
- Replace in-memory idempotency and execution traces with pluggable persistence.
- Introduce repository protocol (`ExecutionRepository`) and initial SQLite adapter.
- Guarantee request replay and run retrieval across process restarts.

**Deliverables**
- `rhaef_v2/storage/repository.py` protocol
- `rhaef_v2/storage/sqlite_repo.py`
- Migration/bootstrap utility for local DB

**Acceptance Criteria**
- `POST /run` idempotency survives process restart.
- `GET /runs/{request_id}` returns historic records from DB.

---

### 2) Execution timeline endpoint
- Provide detailed run timeline for audit/replay.
- Add event records: `run_started`, `policy_evaluated`, `route_attempted`, `fallback_triggered`, `run_finished`, `run_failed`.

**Deliverables**
- `GET /runs/{request_id}/timeline`
- Timeline schema in `rhaef_v2/schemas/`.

**Acceptance Criteria**
- Timeline includes ordered events with timestamps.
- At least one integration test validates full timeline for success and failure path.

---

### 3) Policy profile externalization
- Move policy thresholds from static logic to configurable profile file/env.
- Support named profiles: `dev`, `stage`, `prod`, `strict-prod`.

**Deliverables**
- `rhaef_v2/core/policy_profiles.py`
- Profile loading in `RuntimeSettings`
- API stats include active profile name

**Acceptance Criteria**
- Profile switch changes behavior without code edits.
- Unit tests cover each profile branch.

---

### 4) Observability hardening
- Add structured JSON logger with correlation fields.
- Enforce log shape for key execution events.

**Deliverables**
- `rhaef_v2/core/logging.py`
- Centralized logger usage in router/api/policy paths

**Acceptance Criteria**
- Logs contain: `request_id`, `category`, `policy_code`, `decision`, `status`, `fallback_used`.
- Smoke test asserts log payload keys.

---

### 5) HTTP integration test layer
- Add endpoint-level tests using FastAPI `TestClient` when available.
- Keep fallback-safe unit tests for dependency-constrained environments.

**Deliverables**
- `tests/test_http_api.py`
- Graceful skip markers when `fastapi` is unavailable.

**Acceptance Criteria**
- Success, blocked, validation error, and idempotency HTTP scenarios are covered.

---

## Out of scope
- Full production authn/authz
- Distributed cache (Redis) rollout
- Async queue workers and long-running task orchestration

## Risks and mitigations
- **Risk:** dependency availability differs across environments.
  - **Mitigation:** dual-layer tests (pure unit + HTTP integration with skips).
- **Risk:** persistence schema drift.
  - **Mitigation:** minimal migration utility + fixture-based compatibility tests.

## Sprint 4 Definition of Done
- Persistent idempotency and run retrieval implemented.
- Timeline endpoint and schemas shipped.
- Policy profiles configurable at runtime.
- Structured logs implemented for critical path.
- Unit + integration tests green in supported environments.
