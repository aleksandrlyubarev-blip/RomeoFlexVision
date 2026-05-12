from rhaef_v2.storage.execution_store import ExecutionEvent, ExecutionRecord
from rhaef_v2.storage.sqlite_repo import SQLiteExecutionRepository


def test_sqlite_repo_save_and_get_record():
    repo = SQLiteExecutionRepository()
    rec = ExecutionRecord(
        request_id="r1",
        status="ok",
        decision="allow",
        policy_code="POLICY_OK",
        category="routine",
        fallback_used=False,
        retries_used=0,
        started_at="t1",
        finished_at="t2",
    )
    repo.save_record(rec)
    loaded = repo.get_record("r1")
    assert loaded is not None
    assert loaded.status == "ok"


def test_sqlite_repo_events_and_metrics():
    repo = SQLiteExecutionRepository()
    repo.add_event(ExecutionEvent(request_id="r1", event="run_started"))
    repo.add_event(ExecutionEvent(request_id="r1", event="run_failed"))
    timeline = repo.get_timeline("r1")
    assert len(timeline) == 2
    metrics = repo.metrics()
    assert metrics["failed_runs"] == 1
