"""User-editable configuration: scan frequency, model weights, risk rules, etc."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.types import JSONVariant

if TYPE_CHECKING:
    from app.models.user import User


class Configuration(TimestampMixin, Base):
    """A single configurable key/value entry, grouped by category.

    Categories used by the platform: ``scanner`` (frequency), ``llm`` (models,
    weights), ``risk`` (position sizing, limits), ``signals`` (selection
    criteria), ``notifications`` (channels/thresholds).
    """

    __tablename__ = "configurations"
    __table_args__ = (UniqueConstraint("user_id", "category", "key"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    category: Mapped[str] = mapped_column(String(64), index=True)
    key: Mapped[str] = mapped_column(String(128))
    value: Mapped[dict] = mapped_column(JSONVariant, default=dict)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User | None"] = relationship(back_populates="configurations")
