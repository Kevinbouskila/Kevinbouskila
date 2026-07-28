import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_pk
from app.models.portfolio import PortfolioMode
from app.models.position import PositionSide


class OrderType(str, enum.Enum):
    MARKET = "market"
    LIMIT = "limit"


class OrderAction(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"
    CANCEL = "cancel"
    MODIFY = "modify"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = uuid_pk()
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True, nullable=False
    )
    market_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("positions.id", ondelete="SET NULL")
    )

    side: Mapped[PositionSide] = mapped_column(Enum(PositionSide, name="order_side"), nullable=False)
    order_type: Mapped[OrderType] = mapped_column(Enum(OrderType, name="order_type"), nullable=False)
    action: Mapped[OrderAction] = mapped_column(Enum(OrderAction, name="order_action"), nullable=False)
    mode: Mapped[PortfolioMode] = mapped_column(Enum(PortfolioMode, name="order_mode"), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"), default=OrderStatus.PENDING, nullable=False
    )

    price: Mapped[float | None] = mapped_column(Numeric(10, 6))
    quantity: Mapped[float] = mapped_column(Numeric(20, 6), nullable=False)
    filled_quantity: Mapped[float] = mapped_column(Numeric(20, 6), default=0)

    external_order_id: Mapped[str | None] = mapped_column(String(128), index=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Order {self.action} {self.side} qty={self.quantity} status={self.status}>"
