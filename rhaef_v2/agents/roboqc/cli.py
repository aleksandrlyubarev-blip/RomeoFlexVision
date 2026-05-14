"""CLI для локальных прогонов: ``python -m rhaef_v2.agents.roboqc.cli run --image ...``."""

from __future__ import annotations

import asyncio
import json
import sys

from rhaef_v2.core.model_router import ModelRouter

from .graph import run
from .state import RoboQCState


def _parse_args(argv: list[str]) -> dict[str, str]:
    args: dict[str, str] = {}
    i = 0
    while i < len(argv):
        key = argv[i]
        if key.startswith("--"):
            value = argv[i + 1] if i + 1 < len(argv) else ""
            args[key.lstrip("-")] = value
            i += 2
        else:
            i += 1
    return args


async def _main(argv: list[str]) -> int:
    if not argv or argv[0] != "run":
        print("usage: python -m rhaef_v2.agents.roboqc.cli run --image PATH [--workcell ID] [--subject NAME]")
        return 2
    args = _parse_args(argv[1:])
    image = args.get("image")
    if not image:
        print("--image обязателен", file=sys.stderr)
        return 2

    state = RoboQCState(
        image_uri=image,
        workcell_id=args.get("workcell", "WC-00"),
        subject=args.get("subject", "unknown"),
    )
    router = ModelRouter()
    final = await run(state, router=router)
    payload = {
        "action": final.action.model_dump() if final.action else None,
        "critic": final.critic.model_dump() if final.critic else None,
        "retries": final.retries,
        "hypotheses": [h.model_dump() for h in final.hypotheses],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(_main(sys.argv[1:])))
