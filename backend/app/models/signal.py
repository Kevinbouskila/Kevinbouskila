import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import utcnow, uuid_pk


class SignalType(str, enum.Enum):
    BUY_YES = "buy_yes"
    BUY_NO = "buy_no"
    HOLD = "hold"
    CLOSE = "close"


class SignalStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Signal(Base):
    """A trading signal produced by the Quant Agent, combining LLM analysis and market pricing."""

    __tablename__ = "signals"

    id: Mapped[uuid.UUID] = uuid_pk()
    market_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="CASCADE"), index=True, nullable=False
    )
    llm_analysis_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("llm_analyses.id", ondelete="SET NULL")
    )

    signal_type: Mapped[SignalType] = mapped_column(Enum(SignalType, name="signal_type"), nullable=False)
    status: Mapped[SignalStatus] = mapped_column(
        Enum(SignalStatus, name="signal_status"), default=SignalStatus.PENDING, nullable=False
    )

    edge: Mapped[float | None] = mapped_column(Numeric(10, 6))
    expected_value: Mapped[float | None] = mapped_column(Numeric(10, 6))
    kelly_fraction: Mapped[float | None] = mapped_column(Numeric(10, 6))
    sharpe_simplified: Mapped[float | None] = mapped_column(Numeric(10, 6))
    volatility: Mapped[float | None] = mapped_column(Numeric(10, 6))
    expected_drawdown: Mapped[float | None] = mapped_column(Numeric(10, 6))
    confidence_score: Mapped[float | None] = mapped_column(Numeric(6, 2))

    rejection_reason: Mapped[str | None] = mapped_column(String(512))
    explanation: Mapped[str | None] = mapped_column(Text)
    raw_data: Mapped[dict | None] = mapped_column(JSON)

    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Signal market_id={self.market_id} type={self.signal_type}>"
