import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import utcnow, uuid_pk


class LogLevel(str, enum.Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class LogCategory(str, enum.Enum):
    SYSTEM = "system"
    MARKET_SCANNER = "market_scanner"
    NEWS = "news"
    LLM = "llm"
    QUANT = "quant"
    RISK = "risk"
    EXECUTION = "execution"


class Log(Base):
    """Decision journal / audit log entry. Every automated decision is logged here."""

    __tablename__ = "logs"

    id: Mapped[uuid.UUID] = uuid_pk()
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True, nullable=False
    )
    level: Mapped[LogLevel] = mapped_column(
        Enum(LogLevel, name="log_level"), default=LogLevel.INFO, nullable=False
    )
    category: Mapped[LogCategory] = mapped_column(
        Enum(LogCategory, name="log_category"), index=True, nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[dict | None] = mapped_column(JSON)

    market_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="SET NULL")
    )
    portfolio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="SET NULL")
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Log {self.category} {self.level} {self.message[:40]!r}>"
