"""Initial schema: markets, positions, orders, news, signals, LLM analyses,
metrics, logs, portfolios, backtests, users, configurations.

Revision ID: 0001
Revises:
Create Date: 2026-07-28

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column(
            "role",
            sa.Enum("admin", "trader", "viewer", name="user_role"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "markets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("condition_id", sa.String(128), nullable=False),
        sa.Column("question", sa.String(1024), nullable=False),
        sa.Column("slug", sa.String(512), nullable=False),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column("subcategory", sa.String(128), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "closed", "resolved", name="market_status"),
            nullable=False,
        ),
        sa.Column(
            "outcomes",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("resolved_outcome", sa.String(256), nullable=True),
        sa.Column("volume", sa.Float(), nullable=True),
        sa.Column("liquidity", sa.Float(), nullable=True),
        sa.Column("external_created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "extra_metadata",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_markets_condition_id", "markets", ["condition_id"], unique=True
    )
    op.create_index("ix_markets_slug", "markets", ["slug"])
    op.create_index("ix_markets_status", "markets", ["status"])

    op.create_table(
        "portfolios",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "mode", sa.Enum("paper", "live", name="portfolio_mode"), nullable=False
        ),
        sa.Column("currency", sa.String(8), nullable=False),
        sa.Column("initial_balance", sa.Float(), nullable=False),
        sa.Column("balance", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_portfolios_user_id", "portfolios", ["user_id"])

    op.create_table(
        "market_snapshots",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("market_id", sa.Uuid(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("yes_price", sa.Float(), nullable=True),
        sa.Column("no_price", sa.Float(), nullable=True),
        sa.Column("implied_probability", sa.Float(), nullable=True),
        sa.Column("spread", sa.Float(), nullable=True),
        sa.Column("volume_24h", sa.Float(), nullable=True),
        sa.Column("liquidity", sa.Float(), nullable=True),
        sa.Column(
            "order_book_depth",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_market_snapshots_market_id", "market_snapshots", ["market_id"])
    op.create_index("ix_market_snapshots_timestamp", "market_snapshots", ["timestamp"])
    op.create_index(
        "ix_market_snapshots_market_id_timestamp",
        "market_snapshots",
        ["market_id", "timestamp"],
    )

    op.create_table(
        "news",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("source", sa.String(128), nullable=False),
        sa.Column("title", sa.String(1024), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("raw_content", sa.Text(), nullable=True),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column(
            "sentiment",
            sa.Enum("positive", "negative", "neutral", name="news_sentiment"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url"),
    )
    op.create_index("ix_news_source", "news", ["source"])
    op.create_index("ix_news_published_at", "news", ["published_at"])

    op.create_table(
        "news_market_links",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("news_id", sa.Uuid(), nullable=False),
        sa.Column("market_id", sa.Uuid(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["news_id"], ["news.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_news_market_links_news_id", "news_market_links", ["news_id"])
    op.create_index(
        "ix_news_market_links_market_id", "news_market_links", ["market_id"]
    )

    op.create_table(
        "signals",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("market_id", sa.Uuid(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("ai_probability", sa.Float(), nullable=False),
        sa.Column("market_probability", sa.Float(), nullable=False),
        sa.Column("edge", sa.Float(), nullable=False),
        sa.Column("expected_value", sa.Float(), nullable=False),
        sa.Column("kelly_fraction", sa.Float(), nullable=False),
        sa.Column("sharpe_simplified", sa.Float(), nullable=True),
        sa.Column("volatility", sa.Float(), nullable=True),
        sa.Column("expected_drawdown", sa.Float(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "approved",
                "rejected",
                "executed",
                "expired",
                name="signal_status",
            ),
            nullable=False,
        ),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column(
            "details",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_signals_market_id", "signals", ["market_id"])
    op.create_index("ix_signals_status", "signals", ["status"])

    op.create_table(
        "llm_analyses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("market_id", sa.Uuid(), nullable=False),
        sa.Column(
            "provider",
            sa.Enum("openai", "anthropic", "google", "ollama", name="llm_provider"),
            nullable=False,
        ),
        sa.Column("model_name", sa.String(128), nullable=False),
        sa.Column("estimated_probability", sa.Float(), nullable=False),
        sa.Column("confidence_interval_low", sa.Float(), nullable=False),
        sa.Column("confidence_interval_high", sa.Float(), nullable=False),
        sa.Column("confidence_level", sa.Float(), nullable=False),
        sa.Column(
            "arguments_for",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column(
            "arguments_against",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column(
            "sources",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_llm_analyses_market_id", "llm_analyses", ["market_id"])

    op.create_table(
        "positions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("portfolio_id", sa.Uuid(), nullable=False),
        sa.Column("market_id", sa.Uuid(), nullable=False),
        sa.Column("outcome", sa.String(256), nullable=False),
        sa.Column(
            "side", sa.Enum("long", "short", name="position_side"), nullable=False
        ),
        sa.Column(
            "status",
            sa.Enum("open", "closed", name="position_status"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("avg_entry_price", sa.Float(), nullable=False),
        sa.Column("current_price", sa.Float(), nullable=True),
        sa.Column("stop_loss", sa.Float(), nullable=True),
        sa.Column("take_profit", sa.Float(), nullable=True),
        sa.Column("realized_pnl", sa.Float(), nullable=False),
        sa.Column("unrealized_pnl", sa.Float(), nullable=False),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["portfolio_id"], ["portfolios.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_positions_portfolio_id", "positions", ["portfolio_id"])
    op.create_index("ix_positions_market_id", "positions", ["market_id"])
    op.create_index("ix_positions_status", "positions", ["status"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("portfolio_id", sa.Uuid(), nullable=False),
        sa.Column("position_id", sa.Uuid(), nullable=True),
        sa.Column("market_id", sa.Uuid(), nullable=False),
        sa.Column("side", sa.Enum("buy", "sell", name="order_side"), nullable=False),
        sa.Column(
            "order_type",
            sa.Enum("market", "limit", "stop", "take_profit", name="order_type"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "open",
                "filled",
                "partially_filled",
                "cancelled",
                "rejected",
                name="order_status",
            ),
            nullable=False,
        ),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("filled_quantity", sa.Float(), nullable=False),
        sa.Column("external_order_id", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["portfolio_id"], ["portfolios.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["position_id"], ["positions.id"]),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_portfolio_id", "orders", ["portfolio_id"])
    op.create_index("ix_orders_position_id", "orders", ["position_id"])
    op.create_index("ix_orders_market_id", "orders", ["market_id"])
    op.create_index("ix_orders_status", "orders", ["status"])

    op.create_table(
        "configurations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("key", sa.String(128), nullable=False),
        sa.Column(
            "value",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "category", "key"),
    )
    op.create_index("ix_configurations_user_id", "configurations", ["user_id"])
    op.create_index("ix_configurations_category", "configurations", ["category"])

    op.create_table(
        "metrics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("portfolio_id", sa.Uuid(), nullable=True),
        sa.Column("metric_type", sa.String(128), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "extra_metadata",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["portfolio_id"], ["portfolios.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_metrics_portfolio_id", "metrics", ["portfolio_id"])
    op.create_index("ix_metrics_metric_type", "metrics", ["metric_type"])
    op.create_index("ix_metrics_timestamp", "metrics", ["timestamp"])

    op.create_table(
        "logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "level",
            sa.Enum(
                "debug", "info", "warning", "error", "critical", name="log_level"
            ),
            nullable=False,
        ),
        sa.Column("category", sa.String(128), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "context",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("related_entity_type", sa.String(64), nullable=True),
        sa.Column("related_entity_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logs_timestamp", "logs", ["timestamp"])
    op.create_index("ix_logs_category", "logs", ["category"])

    op.create_table(
        "backtests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "running", "completed", "failed", name="backtest_status"
            ),
            nullable=False,
        ),
        sa.Column(
            "strategy_config",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "results",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_backtests_user_id", "backtests", ["user_id"])
    op.create_index("ix_backtests_status", "backtests", ["status"])


def downgrade() -> None:
    op.drop_table("backtests")
    op.drop_table("logs")
    op.drop_table("metrics")
    op.drop_table("configurations")
    op.drop_table("orders")
    op.drop_table("positions")
    op.drop_table("llm_analyses")
    op.drop_table("signals")
    op.drop_table("news_market_links")
    op.drop_table("news")
    op.drop_table("market_snapshots")
    op.drop_table("portfolios")
    op.drop_table("markets")
    op.drop_table("users")

    bind = op.get_bind()
    for enum_name in (
        "backtest_status",
        "log_level",
        "order_status",
        "order_type",
        "order_side",
        "position_status",
        "position_side",
        "llm_provider",
        "signal_status",
        "news_sentiment",
        "market_status",
        "portfolio_mode",
        "user_role",
    ):
        sa.Enum(name=enum_name).drop(bind, checkfirst=True)
