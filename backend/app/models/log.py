"""Append-only decision/audit journal for every agent (risk, execution, signals...)."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import LogLevel
from app.models.types import JSONVariant


class Log(Base):
    __tablename__ = "logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    level: Mapped[LogLevel] = mapped_column(
        SAEnum(LogLevel, name="log_level"), default=LogLevel.INFO
    )
    category: Mapped[str] = mapped_column(String(128), index=True)
    message: Mapped[str] = mapped_column(Text)
    context: Mapped[dict] = mapped_column(JSONVariant, default=dict)

    related_entity_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    related_entity_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
