import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.market import Market, MarketSnapshot
from app.schemas.market import MarketRead, MarketSnapshotRead

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("", response_model=list[MarketRead])
def list_markets(
    active: bool | None = Query(default=True),
    category: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Market]:
    stmt = select(Market)
    if active is not None:
        stmt = stmt.where(Market.active == active)
    if category:
        stmt = stmt.where(Market.category == category)
    stmt = stmt.order_by(Market.volume.desc().nulls_last()).offset(offset).limit(limit)
    return list(db.scalars(stmt))


@router.get("/{market_id}", response_model=MarketRead)
def get_market(market_id: uuid.UUID, db: Session = Depends(get_db)) -> Market:
    market = db.get(Market, market_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Market not found")
    return market


@router.get("/{market_id}/snapshots", response_model=list[MarketSnapshotRead])
def get_market_snapshots(
    market_id: uuid.UUID,
    limit: int = Query(default=200, le=2000),
    db: Session = Depends(get_db),
) -> list[MarketSnapshot]:
    market = db.get(Market, market_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Market not found")

    stmt = (
        select(MarketSnapshot)
        .where(MarketSnapshot.market_id == market_id)
        .order_by(MarketSnapshot.timestamp.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))
