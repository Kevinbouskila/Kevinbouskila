import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import utcnow, uuid_pk


class Metric(Base):
    """Point-in-time performance metrics for a portfolio."""

    __tablename__ = "metrics"

    id: Mapped[uuid.UUID] = uuid_pk()
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True, nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True, nullable=False
    )

    roi: Mapped[float | None] = mapped_column(Numeric(10, 6))
    pnl: Mapped[float | None] = mapped_column(Numeric(20, 6))
    win_rate: Mapped[float | None] = mapped_column(Numeric(6, 4))
    profit_factor: Mapped[float | None] = mapped_column(Numeric(10, 4))
    max_drawdown: Mapped[float | None] = mapped_column(Numeric(10, 6))
    expectancy: Mapped[float | None] = mapped_column(Numeric(10, 6))
    sharpe: Mapped[float | None] = mapped_column(Numeric(10, 6))
    sortino: Mapped[float | None] = mapped_column(Numeric(10, 6))
    calmar: Mapped[float | None] = mapped_column(Numeric(10, 6))

    raw_data: Mapped[dict | None] = mapped_column(JSON)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Metric portfolio_id={self.portfolio_id} ts={self.timestamp}>"
