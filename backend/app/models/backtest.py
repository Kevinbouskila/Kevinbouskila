import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_pk


class BacktestStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Backtest(TimestampMixin, Base):
    __tablename__ = "backtests"

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    strategy_config: Mapped[dict] = mapped_column(JSON, nullable=False)

    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    status: Mapped[BacktestStatus] = mapped_column(
        Enum(BacktestStatus, name="backtest_status"), default=BacktestStatus.PENDING, nullable=False
    )
    results: Mapped[dict | None] = mapped_column(JSON)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Backtest {self.name} status={self.status}>"
