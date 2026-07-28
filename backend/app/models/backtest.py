"""Backtest runs: a strategy configuration replayed over historical market data."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import BacktestStatus
from app.models.types import JSONVariant

if TYPE_CHECKING:
    from app.models.user import User


class Backtest(TimestampMixin, Base):
    __tablename__ = "backtests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    status: Mapped[BacktestStatus] = mapped_column(
        SAEnum(BacktestStatus, name="backtest_status"),
        default=BacktestStatus.PENDING,
        index=True,
    )

    strategy_config: Mapped[dict] = mapped_column(JSONVariant, default=dict)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # ROI, PnL, win_rate, profit_factor, max_drawdown, expectancy, sharpe, sortino, calmar
    results: Mapped[dict] = mapped_column(JSONVariant, default=dict)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship()
