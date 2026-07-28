from __future__ import annotations

import logging

from app.agents.market_scanner.client import PolymarketClient, normalize_gamma_market
from app.agents.market_scanner.service import upsert_market_and_snapshot
from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


@celery_app.task(name="app.agents.market_scanner.tasks.scan_markets_task", bind=True, max_retries=3)
def scan_markets_task(self) -> dict:
    """Poll all active Polymarket markets and persist a Market row + MarketSnapshot for each.

    Runs on a fixed schedule (default: every 60s) via Celery beat.
    """
    settings = get_settings()
    scanned = 0
    failed = 0

    db = SessionLocal()
    try:
        with PolymarketClient() as client:
            for raw_market in client.iter_active_markets(
                page_size=settings.market_scan_page_size,
                max_markets=settings.market_scan_max_markets,
            ):
                try:
                    normalized = normalize_gamma_market(raw_market)
                    upsert_market_and_snapshot(db, normalized)
                    scanned += 1
                except Exception:
                    failed += 1
                    logger.exception(
                        "Failed to process market payload id=%r", raw_market.get("id")
                    )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    logger.info("Market scan complete: scanned=%s failed=%s", scanned, failed)
    return {"scanned": scanned, "failed": failed}
