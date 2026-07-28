import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import utcnow


class LLMAnalysis(Base):
    """Output of the LLM Analyst agent for a given market and model."""

    __tablename__ = "llm_analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    market_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="CASCADE"), index=True, nullable=False
    )

    model_provider: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)

    estimated_probability: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False)
    confidence_interval_low: Mapped[float | None] = mapped_column(Numeric(10, 6))
    confidence_interval_high: Mapped[float | None] = mapped_column(Numeric(10, 6))
    confidence_level: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)

    arguments_for: Mapped[list | None] = mapped_column(JSON)
    arguments_against: Mapped[list | None] = mapped_column(JSON)
    explanation: Mapped[str | None] = mapped_column(Text)

    raw_response: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<LLMAnalysis market_id={self.market_id} provider={self.model_provider}>"
