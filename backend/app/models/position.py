import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import uuid_pk


class PositionSide(str, enum.Enum):
    YES = "yes"
    NO = "no"


class PositionStatus(str, enum.Enum):
    OPEN = "open"
    PARTIALLY_CLOSED = "partially_closed"
    CLOSED = "closed"


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[uuid.UUID] = uuid_pk()
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True, nullable=False
    )
    market_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="RESTRICT"), index=True, nullable=False
    )

    side: Mapped[PositionSide] = mapped_column(Enum(PositionSide, name="position_side"), nullable=False)
    status: Mapped[PositionStatus] = mapped_column(
        Enum(PositionStatus, name="position_status"), default=PositionStatus.OPEN, nullable=False
    )

    entry_price: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(20, 6), nullable=False)

    stop_loss: Mapped[float | None] = mapped_column(Numeric(10, 6))
    take_profit: Mapped[float | None] = mapped_column(Numeric(10, 6))

    realized_pnl: Mapped[float] = mapped_column(Numeric(20, 6), default=0)
    unrealized_pnl: Mapped[float] = mapped_column(Numeric(20, 6), default=0)

    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Position {self.side} qty={self.quantity} status={self.status}>"
