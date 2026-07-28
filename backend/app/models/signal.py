"""Trading signals produced by the Quant Agent from an LLM/market probability gap."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import SignalStatus
from app.models.types import JSONVariant

if TYPE_CHECKING:
    from app.models.market import Market


class Signal(TimestampMixin, Base):
    """A candidate opportunity: AI probability vs. market-implied probability."""

    __tablename__ = "signals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    market_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("markets.id", ondelete="CASCADE"), index=True
    )

    # Global 0-100 score combining liquidity, news, LLM confidence, edge, etc.
    score: Mapped[float] = mapped_column(Float)

    ai_probability: Mapped[float] = mapped_column(Float)
    market_probability: Mapped[float] = mapped_column(Float)
    edge: Mapped[float] = mapped_column(Float)
    expected_value: Mapped[float] = mapped_column(Float)
    kelly_fraction: Mapped[float] = mapped_column(Float)
    sharpe_simplified: Mapped[float | None] = mapped_column(Float, nullable=True)
    volatility: Mapped[float | None] = mapped_column(Float, nullable=True)
    expected_drawdown: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[SignalStatus] = mapped_column(
        SAEnum(SignalStatus, name="signal_status"),
        default=SignalStatus.PENDING,
        index=True,
    )
    # Human/agent-readable explanation of why the signal was retained or rejected.
    reason: Mapped[str] = mapped_column(Text)
    # Breakdown of the score components, risk checks applied, etc.
    details: Mapped[dict] = mapped_column(JSONVariant, default=dict)

    market: Mapped["Market"] = relationship(back_populates="signals")
