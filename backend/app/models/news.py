"""News items ingested by the News Agent and their links to markets."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.enums import NewsSentiment

if TYPE_CHECKING:
    from app.models.market import Market


class News(TimestampMixin, Base):
    """A single news item (article, press release, tweet, RSS entry, ...)."""

    __tablename__ = "news"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(128), index=True)
    title: Mapped[str] = mapped_column(String(1024))
    url: Mapped[str] = mapped_column(String(2048), unique=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    sentiment: Mapped[NewsSentiment | None] = mapped_column(
        SAEnum(NewsSentiment, name="news_sentiment"), nullable=True
    )

    market_links: Mapped[list["NewsMarketLink"]] = relationship(
        back_populates="news", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<News {self.title[:40]!r} source={self.source!r}>"


class NewsMarketLink(Base):
    """Many-to-many link between a :class:`News` item and a :class:`Market`."""

    __tablename__ = "news_market_links"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    news_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("news.id", ondelete="CASCADE"), index=True
    )
    market_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("markets.id", ondelete="CASCADE"), index=True
    )
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)

    news: Mapped["News"] = relationship(back_populates="market_links")
    market: Mapped["Market"] = relationship(back_populates="news_links")
