"""Orders placed by the Execution Engine (paper or live)."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import OrderSide, OrderStatus, OrderType

if TYPE_CHECKING:
    from app.models.market import Market
    from app.models.portfolio import Portfolio
    from app.models.position import Position


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("portfolios.id", ondelete="CASCADE"), index=True
    )
    position_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("positions.id"), nullable=True, index=True
    )
    market_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("markets.id"), index=True)

    side: Mapped[OrderSide] = mapped_column(SAEnum(OrderSide, name="order_side"))
    order_type: Mapped[OrderType] = mapped_column(SAEnum(OrderType, name="order_type"))
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, name="order_status"),
        default=OrderStatus.PENDING,
        index=True,
    )

    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    filled_quantity: Mapped[float] = mapped_column(Float, default=0.0)

    external_order_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    portfolio: Mapped["Portfolio"] = relationship(back_populates="orders")
    position: Mapped["Position | None"] = relationship(back_populates="orders")
    market: Mapped["Market"] = relationship(back_populates="orders")
