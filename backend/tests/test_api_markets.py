from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MarketStatus
from app.models.market import Market, MarketSnapshot


async def _seed_market(db_session: AsyncSession, **overrides: object) -> Market:
    defaults = dict(
        condition_id="0xabc",
        question="Will X happen?",
        slug="will-x-happen",
        category="Politics",
        status=MarketStatus.ACTIVE,
        outcomes=[{"name": "Yes", "token_id": "tok-yes"}],
        volume=1000.0,
        liquidity=500.0,
    )
    defaults.update(overrides)
    market = Market(**defaults)
    db_session.add(market)
    await db_session.commit()
    await db_session.refresh(market)
    return market


@pytest.mark.asyncio
async def test_list_markets_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/markets")
    assert response.status_code == 200
    body = response.json()
    assert body == {"items": [], "total": 0, "limit": 50, "offset": 0}


@pytest.mark.asyncio
async def test_list_and_get_market(client: AsyncClient, db_session: AsyncSession) -> None:
    market = await _seed_market(db_session)

    list_response = await client.get("/api/v1/markets")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "will-x-happen"

    get_response = await client.get(f"/api/v1/markets/{market.id}")
    assert get_response.status_code == 200
    assert get_response.json()["condition_id"] == "0xabc"


@pytest.mark.asyncio
async def test_get_market_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/markets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_filter_markets_by_status(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_market(db_session, condition_id="0x1", slug="active-one", status=MarketStatus.ACTIVE)
    await _seed_market(db_session, condition_id="0x2", slug="closed-one", status=MarketStatus.CLOSED)

    response = await client.get("/api/v1/markets", params={"status": "closed"})
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "closed-one"


@pytest.mark.asyncio
async def test_filter_markets_by_category(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_market(db_session, condition_id="0x1", slug="pol-one", category="Politics")
    await _seed_market(db_session, condition_id="0x2", slug="sports-one", category="Sports")

    response = await client.get("/api/v1/markets", params={"category": "Sports"})
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "sports-one"


@pytest.mark.asyncio
async def test_list_markets_pagination(client: AsyncClient, db_session: AsyncSession) -> None:
    for i in range(3):
        await _seed_market(db_session, condition_id=f"0x{i}", slug=f"market-{i}", volume=float(i))

    response = await client.get("/api/v1/markets", params={"limit": 2, "offset": 1})
    body = response.json()
    assert body["total"] == 3
    assert body["limit"] == 2
    assert body["offset"] == 1
    assert len(body["items"]) == 2


@pytest.mark.asyncio
async def test_list_market_snapshots(client: AsyncClient, db_session: AsyncSession) -> None:
    market = await _seed_market(db_session)
    db_session.add(
        MarketSnapshot(
            market_id=market.id,
            timestamp=datetime.now(UTC),
            yes_price=0.6,
            no_price=0.4,
            implied_probability=0.6,
        )
    )
    await db_session.commit()

    response = await client.get(f"/api/v1/markets/{market.id}/snapshots")
    assert response.status_code == 200
    snapshots = response.json()
    assert len(snapshots) == 1
    assert snapshots[0]["yes_price"] == 0.6


@pytest.mark.asyncio
async def test_list_market_snapshots_not_found(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/markets/00000000-0000-0000-0000-000000000000/snapshots"
    )
    assert response.status_code == 404
