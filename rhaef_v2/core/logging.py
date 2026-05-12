from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any


def log_event(event: str, **payload: Any) -> str:
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event,
        **payload,
    }
    line = json.dumps(record, ensure_ascii=False)
    print(line)
    return line
