import uuid

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_pk


class Configuration(TimestampMixin, Base):
    """A single configurable rule/setting, editable from the dashboard.

    Examples of keys: 'market_scanner.interval_seconds', 'risk.max_position_size',
    'risk.max_daily_loss', 'llm.default_provider', 'quant.min_edge'.
    """

    __tablename__ = "configurations"

    id: Mapped[uuid.UUID] = uuid_pk()
    key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    value: Mapped[dict] = mapped_column(JSON, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Configuration {self.key}={self.value!r}>"
