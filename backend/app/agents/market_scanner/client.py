from __future__ import annotations

import json
import logging
from collections.abc import Iterator
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class PolymarketAPIError(RuntimeError):
    """Raised when the Polymarket Gamma API returns an unexpected response shape."""


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_json_field(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, list | dict):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return None


def normalize_gamma_market(raw: dict) -> dict:
    """Convert a raw Gamma API market payload into a normalized dict ready for persistence.

    The Gamma API encodes `outcomes` and `outcomePrices` as JSON-stringified arrays;
    this flattens them into native lists and derives convenience fields (spread,
    implied probability) used throughout the platform.
    """
    outcomes = _parse_json_field(raw.get("outcomes")) or []
    outcome_prices = _parse_json_field(raw.get("outcomePrices")) or []

    last_price: float | None = None
    if outcome_prices:
        last_price = _safe_float(outcome_prices[0])

    best_bid = _safe_float(raw.get("bestBid"))
    best_ask = _safe_float(raw.get("bestAsk"))
    spread = round(best_ask - best_bid, 6) if best_bid is not None and best_ask is not None else None

    return {
        "condition_id": raw.get("conditionId") or raw.get("id"),
        "slug": raw.get("slug"),
        "question": raw.get("question") or "",
        "category": raw.get("category"),
        "outcomes": outcomes,
        "active": bool(raw.get("active", True)),
        "closed": bool(raw.get("closed", False)),
        "volume": _safe_float(raw.get("volume")),
        "liquidity": _safe_float(raw.get("liquidity")),
        "best_bid": best_bid,
        "best_ask": best_ask,
        "spread": spread,
        "last_price": last_price,
        "implied_probability": last_price,
        "end_date": raw.get("endDate"),
        "raw_data": raw,
    }


class PolymarketClient:
    """Thin, typed client over Polymarket's public Gamma REST API.

    Used by the Market Scanner agent to poll active markets, their prices,
    liquidity and volume every minute. No API key is required for public
    market data.
    """

    def __init__(self, base_url: str | None = None, timeout: float | None = None) -> None:
        settings = get_settings()
        self._base_url = (base_url or settings.polymarket_gamma_api_url).rstrip("/")
        self._timeout = timeout or settings.http_timeout_seconds
        self._client = httpx.Client(base_url=self._base_url, timeout=self._timeout)

    def __enter__(self) -> PolymarketClient:
        return self

    def __exit__(self, *exc_info: object) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
        reraise=True,
    )
    def _get(self, path: str, params: dict) -> httpx.Response:
        response = self._client.get(path, params=params)
        response.raise_for_status()
        return response

    def fetch_markets_page(
        self, limit: int = 100, offset: int = 0, active: bool = True, closed: bool = False
    ) -> list[dict]:
        params = {
            "limit": limit,
            "offset": offset,
            "active": str(active).lower(),
            "closed": str(closed).lower(),
        }
        response = self._get("/markets", params)
        payload = response.json()
        if isinstance(payload, dict) and "data" in payload:
            payload = payload["data"]
        if not isinstance(payload, list):
            raise PolymarketAPIError(f"Unexpected Gamma API payload shape: {type(payload)!r}")
        return payload

    def iter_active_markets(self, page_size: int = 100, max_markets: int = 500) -> Iterator[dict]:
        """Yield raw market payloads, paginating until `max_markets` is reached or data runs out."""
        offset = 0
        fetched = 0
        while fetched < max_markets:
            page = self.fetch_markets_page(limit=page_size, offset=offset)
            if not page:
                return
            for raw in page:
                yield raw
                fetched += 1
                if fetched >= max_markets:
                    return
            offset += page_size
