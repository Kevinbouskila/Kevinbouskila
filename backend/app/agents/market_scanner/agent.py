"""Market Scanner agent: collects price, liquidity, volume, spread and order-book
depth for every active Polymarket market, once per run (scheduled every minute
by Celery beat), and persists a :class:`Market` row plus a :class:`MarketSnapshot`
time-series point for each.
"""

import asyncio
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.agents.base import BaseAgent
from app.agents.market_scanner.parser import ParsedMarket, parse_gamma_market
from app.agents.market_scanner.polymarket_client import PolymarketClient
from app.core.config import settings
from app.core.database import AsyncSessionLocal, utcnow
from app.core.logging import get_logger
from app.models.enums import MarketStatus
from app.models.market import Market, MarketSnapshot

logger = get_logger(__name__)

_DEPTH_LEVELS = 10


@dataclass
class MarketScanResult:
    markets_scanned: int = 0
    snapshots_created: int = 0
    errors: list[str] = field(default_factory=list)


def _to_float(value: object) -> float | None:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _compute_spread_and_depth(book: dict | None) -> tuple[float | None, dict]:
    if not book:
        return None, {}

    bids = sorted(
        (
            (p, s)
            for p, s in (
                (_to_float(level.get("price")), _to_float(level.get("size")))
                for level in book.get("bids", [])
            )
            if p is not None
        ),
        key=lambda level: level[0],
        reverse=True,
    )
    asks = sorted(
        (
            (p, s)
            for p, s in (
                (_to_float(level.get("price")), _to_float(level.get("size")))
                for level in book.get("asks", [])
            )
            if p is not None
        ),
        key=lambda level: level[0],
    )

    spread = None
    if bids and asks:
        spread = asks[0][0] - bids[0][0]

    depth = {
        "bids": bids[:_DEPTH_LEVELS],
        "asks": asks[:_DEPTH_LEVELS],
    }
    return spread, depth


def _market_status(parsed: ParsedMarket) -> MarketStatus:
    if parsed.closed:
        return MarketStatus.CLOSED
    if parsed.active:
        return MarketStatus.ACTIVE
    return MarketStatus.CLOSED


class MarketScannerAgent(BaseAgent):
    name = "market_scanner"

    def __init__(
        self,
        client: PolymarketClient | None = None,
        session_factory: async_sessionmaker[AsyncSession] = AsyncSessionLocal,
        page_size: int | None = None,
        max_markets: int | None = None,
        order_book_concurrency: int = 10,
        fetch_order_books: bool = True,
    ) -> None:
        self._client = client
        self._owns_client = client is None
        self._session_factory = session_factory
        self._page_size = page_size or settings.market_scan_page_size
        self._max_markets = max_markets or settings.market_scan_max_markets
        self._semaphore = asyncio.Semaphore(order_book_concurrency)
        self._fetch_order_books = fetch_order_books

    async def run(self) -> MarketScanResult:
        client = self._client or PolymarketClient()
        result = MarketScanResult()
        try:
            parsed_markets = await self._fetch_all_markets(client, result)

            # Order book lookups are pure network I/O and safe to run
            # concurrently; DB writes below happen on a single AsyncSession,
            # which is *not* safe for concurrent use, so they stay sequential.
            books = await asyncio.gather(
                *(self._fetch_order_book(client, parsed, result) for parsed in parsed_markets)
            )

            async with self._session_factory() as session:
                for parsed, (spread, depth) in zip(parsed_markets, books, strict=True):
                    try:
                        market = await self._upsert_market(session, parsed)
                        snapshot = self._build_snapshot(market, parsed, spread, depth)
                        session.add(snapshot)
                        result.snapshots_created += 1
                    except Exception as exc:  # noqa: BLE001 - isolate failures per market
                        result.errors.append(
                            f"process_market_failed condition_id={parsed.condition_id}: {exc}"
                        )
                        logger.warning(
                            "process_market_failed",
                            condition_id=parsed.condition_id,
                            error=str(exc),
                        )
                await session.commit()

            result.markets_scanned = len(parsed_markets)
            logger.info(
                "market_scan_completed",
                markets_scanned=result.markets_scanned,
                snapshots_created=result.snapshots_created,
                errors=len(result.errors),
            )
            return result
        finally:
            if self._owns_client:
                await client.close()

    async def _fetch_all_markets(
        self, client: PolymarketClient, result: MarketScanResult
    ) -> list[ParsedMarket]:
        parsed_markets: list[ParsedMarket] = []
        offset = 0
        while len(parsed_markets) < self._max_markets:
            try:
                page = await client.get_markets(limit=self._page_size, offset=offset)
            except Exception as exc:  # noqa: BLE001 - one bad page must not abort the scan
                result.errors.append(f"fetch_markets_page_failed offset={offset}: {exc}")
                logger.warning("fetch_markets_page_failed", offset=offset, error=str(exc))
                break

            if not page:
                break

            for raw in page:
                parsed = parse_gamma_market(raw)
                if parsed is not None:
                    parsed_markets.append(parsed)

            if len(page) < self._page_size:
                break
            offset += self._page_size

        return parsed_markets[: self._max_markets]

    async def _fetch_order_book(
        self, client: PolymarketClient, parsed: ParsedMarket, result: MarketScanResult
    ) -> tuple[float | None, dict]:
        yes_outcome = parsed.yes_outcome
        if not self._fetch_order_books or not yes_outcome or not yes_outcome.token_id:
            return None, {}
        try:
            async with self._semaphore:
                book = await client.get_order_book(yes_outcome.token_id)
            return _compute_spread_and_depth(book)
        except Exception as exc:  # noqa: BLE001 - one book failure must not abort the scan
            result.errors.append(
                f"order_book_failed condition_id={parsed.condition_id}: {exc}"
            )
            return None, {}

    async def _upsert_market(self, session: AsyncSession, parsed: ParsedMarket) -> Market:
        existing = await session.execute(
            select(Market).where(Market.condition_id == parsed.condition_id)
        )
        market = existing.scalar_one_or_none()

        outcomes_payload = [
            {"name": o.name, "token_id": o.token_id} for o in parsed.outcomes
        ]

        if market is None:
            market = Market(
                condition_id=parsed.condition_id,
                question=parsed.question,
                slug=parsed.slug,
                category=parsed.category,
                subcategory=parsed.subcategory,
                status=_market_status(parsed),
                outcomes=outcomes_payload,
                volume=parsed.volume,
                liquidity=parsed.liquidity,
                external_created_at=parsed.external_created_at,
                end_date=parsed.end_date,
                extra_metadata={},
            )
            session.add(market)
        else:
            market.question = parsed.question
            market.category = parsed.category
            market.subcategory = parsed.subcategory
            market.status = _market_status(parsed)
            market.outcomes = outcomes_payload
            market.volume = parsed.volume
            market.liquidity = parsed.liquidity
            market.end_date = parsed.end_date

        await session.flush()
        return market

    def _build_snapshot(
        self,
        market: Market,
        parsed: ParsedMarket,
        spread: float | None,
        depth: dict,
    ) -> MarketSnapshot:
        yes_outcome = parsed.yes_outcome
        no_outcome = parsed.no_outcome

        return MarketSnapshot(
            market_id=market.id,
            timestamp=utcnow(),
            yes_price=yes_outcome.price if yes_outcome else None,
            no_price=no_outcome.price if no_outcome else None,
            implied_probability=yes_outcome.price if yes_outcome else None,
            spread=spread,
            volume_24h=parsed.volume_24h,
            liquidity=parsed.liquidity,
            order_book_depth=depth,
        )
