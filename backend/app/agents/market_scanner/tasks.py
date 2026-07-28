"""Celery task wiring for the Market Scanner agent (run every minute)."""

import asyncio

from app.agents.market_scanner.agent import MarketScannerAgent
from app.core.celery_app import celery_app
from app.core.logging import get_logger

logger = get_logger(__name__)


@celery_app.task(
    name="app.agents.market_scanner.tasks.scan_markets_task",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def scan_markets_task(self) -> dict:
    """Synchronous Celery entrypoint that drives the async scanner agent."""
    try:
        result = asyncio.run(MarketScannerAgent().run())
    except Exception as exc:  # noqa: BLE001 - retry on unexpected/transient failures
        logger.error("market_scan_task_failed", error=str(exc))
        raise self.retry(exc=exc) from exc

    return {
        "markets_scanned": result.markets_scanned,
        "snapshots_created": result.snapshots_created,
        "errors": result.errors,
    }
