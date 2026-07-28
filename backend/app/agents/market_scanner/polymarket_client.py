"""Thin async client for the public Polymarket Gamma and CLOB REST APIs.

Gamma API (https://gamma-api.polymarket.com) exposes market metadata (question,
category, outcomes, prices, volume, liquidity). The CLOB API
(https://clob.polymarket.com) exposes the live order book for a given outcome
token, used to compute spread and depth.
"""

from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_RETRYABLE_EXCEPTIONS = (httpx.TransportError, httpx.HTTPStatusError)


class PolymarketClient:
    """Async wrapper around the Gamma (metadata) and CLOB (order book) APIs."""

    def __init__(
        self,
        gamma_base_url: str | None = None,
        clob_base_url: str | None = None,
        timeout: float | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._gamma_base_url = (gamma_base_url or settings.polymarket_gamma_api_url).rstrip("/")
        self._clob_base_url = (clob_base_url or settings.polymarket_clob_api_url).rstrip("/")
        self._timeout = timeout or settings.polymarket_http_timeout_seconds
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(timeout=self._timeout)

    async def __aenter__(self) -> "PolymarketClient":
        return self

    async def __aexit__(self, *exc_info: object) -> None:
        await self.close()

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    @retry(
        retry=retry_if_exception_type(_RETRYABLE_EXCEPTIONS),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        reraise=True,
    )
    async def _get(self, url: str, params: dict[str, Any] | None = None) -> Any:
        response = await self._client.get(url, params=params)
        response.raise_for_status()
        return response.json()

    async def get_markets(
        self,
        limit: int = 100,
        offset: int = 0,
        active: bool = True,
        closed: bool = False,
    ) -> list[dict[str, Any]]:
        """Fetch a page of markets from the Gamma API."""
        params = {
            "limit": limit,
            "offset": offset,
            "active": str(active).lower(),
            "closed": str(closed).lower(),
        }
        data = await self._get(f"{self._gamma_base_url}/markets", params=params)
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data or []

    async def get_order_book(self, token_id: str) -> dict[str, Any] | None:
        """Fetch the live order book for a single outcome token.

        Returns ``None`` (rather than raising) when the book is temporarily
        unavailable, so a single market's failure never aborts a full scan.
        """
        try:
            return await self._get(
                f"{self._clob_base_url}/book", params={"token_id": token_id}
            )
        except _RETRYABLE_EXCEPTIONS as exc:
            logger.warning("order_book_fetch_failed", token_id=token_id, error=str(exc))
            return None
