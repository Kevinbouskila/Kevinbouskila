"""Model-level tests: persistence, relationships, cascades, constraints."""

from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MarketStatus, PortfolioMode, UserRole
from app.models.market import Market, MarketSnapshot
from app.models.portfolio import Portfolio
from app.models.user import User


def _now() -> datetime:
    return datetime.now(UTC)


async def _make_user(session: AsyncSession) -> User:
    user = User(
        email="trader@example.com",
        hashed_password="hashed",
        role=UserRole.TRADER,
    )
    session.add(user)
    await session.flush()
    return user


async def _make_market(session: AsyncSession, condition_id: str = "0xabc") -> Market:
    market = Market(
        condition_id=condition_id,
        question="Will it happen?",
        slug="will-it-happen",
        status=MarketStatus.ACTIVE,
        outcomes=[{"name": "Yes", "token_id": "tok-yes"}],
    )
    session.add(market)
    await session.flush()
    return market


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession) -> None:
    user = await _make_user(db_session)
    await db_session.commit()

    fetched = await db_session.get(User, user.id)
    assert fetched is not None
    assert fetched.email == "trader@example.com"
    assert fetched.is_active is True
    assert fetched.role == UserRole.TRADER


@pytest.mark.asyncio
async def test_user_email_unique(db_session: AsyncSession) -> None:
    await _make_user(db_session)
    await db_session.commit()

    db_session.add(User(email="trader@example.com", hashed_password="x"))
    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_market_snapshot_cascade_delete(db_session: AsyncSession) -> None:
    market = await _make_market(db_session)
    db_session.add(
        MarketSnapshot(
            market_id=market.id,
            timestamp=_now(),
            yes_price=0.6,
            no_price=0.4,
            implied_probability=0.6,
        )
    )
    await db_session.commit()

    result = await db_session.execute(
        select(MarketSnapshot).where(MarketSnapshot.market_id == market.id)
    )
    assert len(result.scalars().all()) == 1

    await db_session.delete(market)
    await db_session.commit()

    result = await db_session.execute(select(MarketSnapshot))
    assert result.scalars().all() == []


@pytest.mark.asyncio
async def test_market_condition_id_unique(db_session: AsyncSession) -> None:
    await _make_market(db_session, condition_id="0xdup")
    await db_session.commit()

    db_session.add(
        Market(
            condition_id="0xdup",
            question="Duplicate?",
            slug="duplicate",
            status=MarketStatus.ACTIVE,
        )
    )
    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_portfolio_belongs_to_user(db_session: AsyncSession) -> None:
    user = await _make_user(db_session)
    portfolio = Portfolio(
        user_id=user.id,
        name="Main",
        mode=PortfolioMode.PAPER,
        currency="USDC",
        initial_balance=1000.0,
        balance=1000.0,
    )
    db_session.add(portfolio)
    await db_session.commit()

    result = await db_session.execute(select(Portfolio).where(Portfolio.user_id == user.id))
    fetched = result.scalar_one()
    assert fetched.name == "Main"
    assert fetched.balance == 1000.0
