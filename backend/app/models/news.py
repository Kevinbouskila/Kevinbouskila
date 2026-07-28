import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_pk


class News(TimestampMixin, Base):
    """A news item collected by the News Agent, summarized and classified."""

    __tablename__ = "news"

    id: Mapped[uuid.UUID] = uuid_pk()

    source: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(1024), nullable=False)
    url: Mapped[str | None] = mapped_column(String(2048), unique=True)
    summary: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(128), index=True)
    sentiment: Mapped[float | None] = mapped_column(Float)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    entities: Mapped[dict | None] = mapped_column(JSON)
    raw_data: Mapped[dict | None] = mapped_column(JSON)

    market_links: Mapped[list["NewsMarketLink"]] = relationship(
        back_populates="news", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<News {self.source} {self.title[:40]!r}>"


class NewsMarketLink(Base):
    """Association between a News item and a Market it is relevant to."""

    __tablename__ = "news_market_links"

    id: Mapped[uuid.UUID] = uuid_pk()
    news_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("news.id", ondelete="CASCADE"), index=True, nullable=False
    )
    market_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="CASCADE"), index=True, nullable=False
    )
    relevance_score: Mapped[float | None] = mapped_column(Float)

    news: Mapped["News"] = relationship(back_populates="market_links")
