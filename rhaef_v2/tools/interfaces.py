from __future__ import annotations

from typing import Protocol


class RoboQCClient(Protocol):
    async def run_check(self, payload: str) -> str: ...


class HardwareBridgeClient(Protocol):
    async def execute(self, command: str) -> str: ...


class MockRoboQCClient:
    async def run_check(self, payload: str) -> str:
        return f"roboqc-ok:{payload}"


class MockHardwareBridgeClient:
    async def execute(self, command: str) -> str:
        return f"hardware-ok:{command}"
