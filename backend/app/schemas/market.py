import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MarketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    condition_id: str
    slug: str | None
    question: str
    category: str | None
    outcomes: list
    active: bool
    closed: bool
    volume: float | None
    liquidity: float | None
    best_bid: float | None
    best_ask: float | None
    spread: float | None
    last_price: float | None
    implied_probability: float | None
    end_date: datetime | None
    created_at: datetime
    updated_at: datetime


class MarketSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    market_id: uuid.UUID
    timestamp: datetime
    price: float | None
    implied_probability: float | None
    volume: float | None
    liquidity: float | None
    best_bid: float | None
    best_ask: float | None
    spread: float | None
