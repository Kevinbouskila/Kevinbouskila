"""Pydantic (read) schemas for markets and their snapshots."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import MarketStatus


class MarketOutcome(BaseModel):
    name: str
    token_id: str | None = None


class MarketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    condition_id: str
    question: str
    slug: str
    category: str | None
    subcategory: str | None
    status: MarketStatus
    outcomes: list[dict]
    resolved_outcome: str | None
    volume: float | None
    liquidity: float | None
    end_date: datetime | None
    created_at: datetime
    updated_at: datetime


class MarketSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    market_id: uuid.UUID
    timestamp: datetime
    yes_price: float | None
    no_price: float | None
    implied_probability: float | None
    spread: float | None
    volume_24h: float | None
    liquidity: float | None


class MarketListResponse(BaseModel):
    items: list[MarketRead]
    total: int
    limit: int
    offset: int
