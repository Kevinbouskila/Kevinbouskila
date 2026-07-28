import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_pk


class Market(TimestampMixin, Base):
    """A single Polymarket market, as tracked by the Market Scanner agent."""

    __tablename__ = "markets"

    id: Mapped[uuid.UUID] = uuid_pk()

    condition_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    slug: Mapped[str | None] = mapped_column(String(255), index=True)
    question: Mapped[str] = mapped_column(String(1024), nullable=False)
    category: Mapped[str | None] = mapped_column(String(128), index=True)

    outcomes: Mapped[list] = mapped_column(JSON, default=list)

    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    closed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    volume: Mapped[float | None] = mapped_column(Numeric(20, 6))
    liquidity: Mapped[float | None] = mapped_column(Numeric(20, 6))
    best_bid: Mapped[float | None] = mapped_column(Numeric(10, 6))
    best_ask: Mapped[float | None] = mapped_column(Numeric(10, 6))
    spread: Mapped[float | None] = mapped_column(Numeric(10, 6))
    last_price: Mapped[float | None] = mapped_column(Numeric(10, 6))
    implied_probability: Mapped[float | None] = mapped_column(Numeric(10, 6))

    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    raw_data: Mapped[dict | None] = mapped_column(JSON)

    snapshots: Mapped[list["MarketSnapshot"]] = relationship(
        back_populates="market", cascade="all, delete-orphan", order_by="MarketSnapshot.timestamp"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Market {self.condition_id} {self.question[:40]!r}>"


class MarketSnapshot(Base):
    """Point-in-time snapshot of a market's price/liquidity/order book, captured every scan."""

    __tablename__ = "market_snapshots"

    id: Mapped[uuid.UUID] = uuid_pk()
    market_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="CASCADE"), index=True, nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)

    price: Mapped[float | None] = mapped_column(Numeric(10, 6))
    implied_probability: Mapped[float | None] = mapped_column(Numeric(10, 6))
    volume: Mapped[float | None] = mapped_column(Numeric(20, 6))
    liquidity: Mapped[float | None] = mapped_column(Numeric(20, 6))
    best_bid: Mapped[float | None] = mapped_column(Numeric(10, 6))
    best_ask: Mapped[float | None] = mapped_column(Numeric(10, 6))
    spread: Mapped[float | None] = mapped_column(Numeric(10, 6))
    order_book_depth: Mapped[dict | None] = mapped_column(JSON)

    market: Mapped["Market"] = relationship(back_populates="snapshots")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<MarketSnapshot market_id={self.market_id} ts={self.timestamp}>"
