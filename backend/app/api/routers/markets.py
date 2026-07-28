"""Read-only endpoints over markets collected by the Market Scanner agent."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.enums import MarketStatus
from app.models.market import Market, MarketSnapshot
from app.schemas.market import MarketListResponse, MarketRead, MarketSnapshotRead

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("", response_model=MarketListResponse)
async def list_markets(
    status: MarketStatus | None = None,
    category: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> MarketListResponse:
    query = select(Market)
    count_query = select(func.count()).select_from(Market)

    if status is not None:
        query = query.where(Market.status == status)
        count_query = count_query.where(Market.status == status)
    if category is not None:
        query = query.where(Market.category == category)
        count_query = count_query.where(Market.category == category)

    total = (await db.execute(count_query)).scalar_one()
    result = await db.execute(
        query.order_by(Market.volume.desc().nulls_last()).limit(limit).offset(offset)
    )
    items = list(result.scalars().all())
    return MarketListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{market_id}", response_model=MarketRead)
async def get_market(market_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Market:
    market = await db.get(Market, market_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Market not found")
    return market


@router.get("/{market_id}/snapshots", response_model=list[MarketSnapshotRead])
async def list_market_snapshots(
    market_id: uuid.UUID,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> list[MarketSnapshot]:
    market = await db.get(Market, market_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Market not found")

    result = await db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.market_id == market_id)
        .order_by(MarketSnapshot.timestamp.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
