import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_pk


class PortfolioMode(str, enum.Enum):
    PAPER = "paper"
    LIVE = "live"


class Portfolio(TimestampMixin, Base):
    __tablename__ = "portfolios"

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mode: Mapped[PortfolioMode] = mapped_column(
        Enum(PortfolioMode, name="portfolio_mode"), default=PortfolioMode.PAPER, nullable=False
    )
    currency: Mapped[str] = mapped_column(String(8), default="USDC")
    starting_balance: Mapped[float] = mapped_column(Numeric(20, 6), nullable=False)
    current_balance: Mapped[float] = mapped_column(Numeric(20, 6), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Portfolio {self.name} mode={self.mode}>"
