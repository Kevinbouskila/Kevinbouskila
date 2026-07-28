"""Polymarket market and its periodic (per-minute) snapshots."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import MarketStatus
from app.models.types import JSONVariant

if TYPE_CHECKING:
    from app.models.llm_analysis import LLMAnalysis
    from app.models.news import NewsMarketLink
    from app.models.order import Order
    from app.models.position import Position
    from app.models.signal import Signal


class Market(TimestampMixin, Base):
    """A single Polymarket market (one question, N outcomes)."""

    __tablename__ = "markets"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    condition_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    question: Mapped[str] = mapped_column(String(1024))
    slug: Mapped[str] = mapped_column(String(512), index=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    subcategory: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[MarketStatus] = mapped_column(
        SAEnum(MarketStatus, name="market_status"),
        default=MarketStatus.ACTIVE,
        index=True,
    )

    # ``outcomes`` e.g. [{"name": "Yes", "token_id": "..."}, {"name": "No", "token_id": "..."}]
    outcomes: Mapped[list] = mapped_column(JSONVariant, default=list)
    resolved_outcome: Mapped[str | None] = mapped_column(String(256), nullable=True)

    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    liquidity: Mapped[float | None] = mapped_column(Float, nullable=True)

    external_created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    extra_metadata: Mapped[dict] = mapped_column(JSONVariant, default=dict)

    snapshots: Mapped[list["MarketSnapshot"]] = relationship(
        back_populates="market", cascade="all, delete-orphan"
    )
    news_links: Mapped[list["NewsMarketLink"]] = relationship(
        back_populates="market", cascade="all, delete-orphan"
    )
    signals: Mapped[list["Signal"]] = relationship(
        back_populates="market", cascade="all, delete-orphan"
    )
    llm_analyses: Mapped[list["LLMAnalysis"]] = relationship(
        back_populates="market", cascade="all, delete-orphan"
    )
    positions: Mapped[list["Position"]] = relationship(back_populates="market")
    orders: Mapped[list["Order"]] = relationship(back_populates="market")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Market {self.slug!r} status={self.status.value}>"


class MarketSnapshot(Base):
    """Point-in-time snapshot of a market's price/liquidity/order book.

    Written every minute by the Market Scanner agent; forms the market's
    historical time series used by the LLM Analyst, Quant Agent and backtester.
    """

    __tablename__ = "market_snapshots"
    __table_args__ = (
        Index("ix_market_snapshots_market_id_timestamp", "market_id", "timestamp"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    market_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("markets.id", ondelete="CASCADE"), index=True
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    yes_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    no_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    implied_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    spread: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume_24h: Mapped[float | None] = mapped_column(Float, nullable=True)
    liquidity: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Order book depth snapshot, e.g. {"bids": [[price, size], ...], "asks": [...]}
    order_book_depth: Mapped[dict] = mapped_column(JSONVariant, default=dict)

    market: Mapped["Market"] = relationship(back_populates="snapshots")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<MarketSnapshot market_id={self.market_id} ts={self.timestamp}>"
