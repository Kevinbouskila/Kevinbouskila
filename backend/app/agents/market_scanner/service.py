from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.market import Market, MarketSnapshot

logger = logging.getLogger(__name__)


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        logger.warning("Could not parse market end_date value: %r", value)
        return None


def upsert_market_and_snapshot(db: Session, normalized: dict) -> Market:
    """Create or update a Market row and append a MarketSnapshot for this scan cycle."""
    condition_id = normalized.get("condition_id")
    if not condition_id:
        raise ValueError("Market payload is missing a condition_id")

    market = db.query(Market).filter(Market.condition_id == condition_id).one_or_none()
    end_date = _parse_datetime(normalized.get("end_date"))

    if market is None:
        market = Market(condition_id=condition_id)
        db.add(market)

    market.slug = normalized.get("slug")
    market.question = normalized.get("question") or market.question or ""
    market.category = normalized.get("category")
    market.outcomes = normalized.get("outcomes") or []
    market.active = bool(normalized.get("active", True))
    market.closed = bool(normalized.get("closed", False))
    market.end_date = end_date
    market.volume = normalized.get("volume")
    market.liquidity = normalized.get("liquidity")
    market.best_bid = normalized.get("best_bid")
    market.best_ask = normalized.get("best_ask")
    market.spread = normalized.get("spread")
    market.last_price = normalized.get("last_price")
    market.implied_probability = normalized.get("implied_probability")
    market.raw_data = normalized.get("raw_data")

    db.flush()

    snapshot = MarketSnapshot(
        market_id=market.id,
        timestamp=datetime.now(UTC),
        price=normalized.get("last_price"),
        implied_probability=normalized.get("implied_probability"),
        volume=normalized.get("volume"),
        liquidity=normalized.get("liquidity"),
        best_bid=normalized.get("best_bid"),
        best_ask=normalized.get("best_ask"),
        spread=normalized.get("spread"),
        order_book_depth=normalized.get("order_book_depth"),
    )
    db.add(snapshot)

    return market
