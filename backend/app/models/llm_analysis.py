"""LLM Analyst output for a market: estimated probability, confidence, rationale."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import LLMProvider
from app.models.types import JSONVariant

if TYPE_CHECKING:
    from app.models.market import Market


class LLMAnalysis(TimestampMixin, Base):
    """A single LLM's probability estimate and reasoning for one market."""

    __tablename__ = "llm_analyses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    market_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("markets.id", ondelete="CASCADE"), index=True
    )

    provider: Mapped[LLMProvider] = mapped_column(SAEnum(LLMProvider, name="llm_provider"))
    model_name: Mapped[str] = mapped_column(String(128))

    estimated_probability: Mapped[float] = mapped_column(Float)
    confidence_interval_low: Mapped[float] = mapped_column(Float)
    confidence_interval_high: Mapped[float] = mapped_column(Float)
    confidence_level: Mapped[float] = mapped_column(Float)  # 0-1

    arguments_for: Mapped[list] = mapped_column(JSONVariant, default=list)
    arguments_against: Mapped[list] = mapped_column(JSONVariant, default=list)
    explanation: Mapped[str] = mapped_column(Text)

    # Raw inputs referenced by this analysis (news ids, snapshot id, etc.)
    sources: Mapped[dict] = mapped_column(JSONVariant, default=dict)

    market: Mapped["Market"] = relationship(back_populates="llm_analyses")
