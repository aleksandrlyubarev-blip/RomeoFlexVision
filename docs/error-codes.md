# RHAEF v2 Error Codes

| Code | Meaning | Typical Trigger |
|---|---|---|
| `EMPTY_MESSAGES` | Invalid input payload | `/run` called with empty `messages` |
| `MODEL_ROUTING_FAILED` | Model router failed after retries/fallback | Upstream model failures |
| `RUN_NOT_FOUND` | Execution record was not found | Unknown `request_id` in `/runs/{request_id}` |

## Notes
- Errors are returned in a structured `APIError` payload.
- `request_id` is always included for tracing.
