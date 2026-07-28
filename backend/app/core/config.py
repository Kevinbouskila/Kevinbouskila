"""Application settings, loaded from environment variables / .env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- App ---
    env: str = "development"
    log_level: str = "INFO"
    secret_key: str = "change-me-in-production"
    api_v1_prefix: str = "/api/v1"

    # --- Database ---
    database_url: str = (
        "postgresql+asyncpg://polymarket:polymarket@localhost:5432/polymarket"
    )
    database_url_sync: str = (
        "postgresql+psycopg2://polymarket:polymarket@localhost:5432/polymarket"
    )

    # --- Redis / Celery ---
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # --- Polymarket APIs ---
    polymarket_gamma_api_url: str = "https://gamma-api.polymarket.com"
    polymarket_clob_api_url: str = "https://clob.polymarket.com"
    polymarket_http_timeout_seconds: float = 15.0

    # --- Market Scanner ---
    market_scan_interval_seconds: int = 60
    market_scan_page_size: int = 100
    market_scan_max_markets: int = 500

    # --- LLM providers (used by later agents; safe to leave unset for now) ---
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"

    # --- Notifications (used by later steps) ---
    discord_webhook_url: str | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    slack_webhook_url: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
