"""A user's paper or live trading portfolio."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import PortfolioMode

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.position import Position
    from app.models.user import User


class Portfolio(TimestampMixin, Base):
    __tablename__ = "portfolios"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    mode: Mapped[PortfolioMode] = mapped_column(
        SAEnum(PortfolioMode, name="portfolio_mode"), default=PortfolioMode.PAPER
    )
    currency: Mapped[str] = mapped_column(String(8), default="USDC")
    initial_balance: Mapped[float] = mapped_column(Float)
    balance: Mapped[float] = mapped_column(Float)

    user: Mapped["User"] = relationship(back_populates="portfolios")
    positions: Mapped[list["Position"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )
