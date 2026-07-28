"""Tests for the Celery task wrapper around the Market Scanner agent."""

from dataclasses import dataclass, field

import pytest

from app.agents.market_scanner import tasks as tasks_module


@dataclass
class _FakeResult:
    markets_scanned: int = 3
    snapshots_created: int = 3
    errors: list = field(default_factory=list)


class _FakeAgent:
    def __init__(self, *args: object, **kwargs: object) -> None:
        pass

    async def run(self) -> _FakeResult:
        return _FakeResult()


def test_scan_markets_task_returns_summary(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(tasks_module, "MarketScannerAgent", _FakeAgent)

    result = tasks_module.scan_markets_task()

    assert result == {"markets_scanned": 3, "snapshots_created": 3, "errors": []}


class _FailingAgent:
    def __init__(self, *args: object, **kwargs: object) -> None:
        pass

    async def run(self) -> _FakeResult:
        raise RuntimeError("boom")


def test_scan_markets_task_retries_on_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(tasks_module, "MarketScannerAgent", _FailingAgent)

    # Called directly (as here, outside a worker) Celery's self.retry() has
    # nothing to requeue and re-raises the original exception; under a real
    # worker this same code path raises Retry and reschedules the task.
    with pytest.raises(RuntimeError, match="boom"):
        tasks_module.scan_markets_task()
