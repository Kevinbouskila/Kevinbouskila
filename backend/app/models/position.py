"""Open or closed positions held within a portfolio."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import PositionSide, PositionStatus

if TYPE_CHECKING:
    from app.models.market import Market
    from app.models.order import Order
    from app.models.portfolio import Portfolio


class Position(TimestampMixin, Base):
    __tablename__ = "positions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("portfolios.id", ondelete="CASCADE"), index=True
    )
    market_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("markets.id"), index=True
    )

    outcome: Mapped[str] = mapped_column(String(256))
    side: Mapped[PositionSide] = mapped_column(SAEnum(PositionSide, name="position_side"))
    status: Mapped[PositionStatus] = mapped_column(
        SAEnum(PositionStatus, name="position_status"),
        default=PositionStatus.OPEN,
        index=True,
    )

    quantity: Mapped[float] = mapped_column(Float)
    avg_entry_price: Mapped[float] = mapped_column(Float)
    current_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    stop_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    take_profit: Mapped[float | None] = mapped_column(Float, nullable=True)

    realized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pnl: Mapped[float] = mapped_column(Float, default=0.0)

    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    portfolio: Mapped["Portfolio"] = relationship(back_populates="positions")
    market: Mapped["Market"] = relationship(back_populates="positions")
    orders: Mapped[list["Order"]] = relationship(back_populates="position")
