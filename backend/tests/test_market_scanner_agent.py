"""Integration tests for the Market Scanner agent against a mocked Polymarket API."""

import json

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.agents.market_scanner.agent import MarketScannerAgent
from app.agents.market_scanner.polymarket_client import PolymarketClient
from app.models.enums import MarketStatus
from app.models.market import Market, MarketSnapshot

GAMMA_MARKET = {
    "conditionId": "0xabc123",
    "question": "Will X happen?",
    "slug": "will-x-happen",
    "category": "Politics",
    "active": True,
    "closed": False,
    "volume": "12345.6",
    "liquidity": "5000.0",
    "volume24hr": "890.1",
    "outcomes": json.dumps(["Yes", "No"]),
    "outcomePrices": json.dumps(["0.62", "0.38"]),
    "clobTokenIds": json.dumps(["tok-yes", "tok-no"]),
    "endDate": "2026-12-31T00:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z",
}


def _handler(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/markets":
        offset = int(request.url.params.get("offset", 0))
        if offset == 0:
            return httpx.Response(200, json=[GAMMA_MARKET])
        return httpx.Response(200, json=[])
    if request.url.path == "/book":
        return httpx.Response(
            200,
            json={
                "bids": [{"price": "0.60", "size": "100"}],
                "asks": [{"price": "0.63", "size": "50"}],
            },
        )
    return httpx.Response(404)


def _make_client() -> PolymarketClient:
    transport = httpx.MockTransport(_handler)
    http_client = httpx.AsyncClient(transport=transport)
    return PolymarketClient(
        client=http_client, gamma_base_url="http://gamma", clob_base_url="http://clob"
    )


@pytest.mark.asyncio
async def test_scan_creates_market_and_snapshot(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    client = _make_client()
    agent = MarketScannerAgent(
        client=client, session_factory=session_factory, page_size=100, max_markets=500
    )

    result = await agent.run()

    assert result.markets_scanned == 1
    assert result.snapshots_created == 1
    assert result.errors == []

    async with session_factory() as session:
        market = (await session.execute(select(Market))).scalar_one()
        assert market.slug == "will-x-happen"
        assert market.status == MarketStatus.ACTIVE
        assert market.volume == 12345.6

        snapshot = (await session.execute(select(MarketSnapshot))).scalar_one()
        assert snapshot.yes_price == 0.62
        assert snapshot.no_price == 0.38
        assert snapshot.spread == pytest.approx(0.03)
        assert snapshot.order_book_depth["bids"] == [[0.60, 100.0]]


@pytest.mark.asyncio
async def test_scan_is_idempotent_on_condition_id(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    agent = MarketScannerAgent(
        client=_make_client(), session_factory=session_factory, max_markets=500
    )
    await agent.run()

    agent2 = MarketScannerAgent(
        client=_make_client(), session_factory=session_factory, max_markets=500
    )
    result2 = await agent2.run()

    assert result2.markets_scanned == 1
    async with session_factory() as session:
        markets = (await session.execute(select(Market))).scalars().all()
        snapshots = (await session.execute(select(MarketSnapshot))).scalars().all()
        assert len(markets) == 1  # upserted, not duplicated
        assert len(snapshots) == 2  # one new time-series point per run


@pytest.mark.asyncio
async def test_scan_skips_order_books_when_disabled(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    agent = MarketScannerAgent(
        client=_make_client(),
        session_factory=session_factory,
        max_markets=500,
        fetch_order_books=False,
    )
    result = await agent.run()
    assert result.snapshots_created == 1

    async with session_factory() as session:
        snapshot = (await session.execute(select(MarketSnapshot))).scalar_one()
        assert snapshot.spread is None
        assert snapshot.order_book_depth == {}


@pytest.mark.asyncio
async def test_scan_handles_empty_market_list(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    def empty_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[])

    http_client = httpx.AsyncClient(transport=httpx.MockTransport(empty_handler))
    client = PolymarketClient(
        client=http_client, gamma_base_url="http://gamma", clob_base_url="http://clob"
    )
    agent = MarketScannerAgent(client=client, session_factory=session_factory)
    result = await agent.run()

    assert result.markets_scanned == 0
    assert result.snapshots_created == 0
