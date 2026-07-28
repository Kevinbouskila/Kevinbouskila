from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration, sourced from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"
    secret_key: str = "change-me-in-production"

    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]

    database_url: str = (
        "postgresql+psycopg2://polymarket:polymarket@localhost:5432/polymarket"
    )

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    polymarket_gamma_api_url: str = "https://gamma-api.polymarket.com"
    polymarket_clob_api_url: str = "https://clob.polymarket.com"

    market_scan_interval_seconds: int = 60
    market_scan_page_size: int = 100
    market_scan_max_markets: int = 500
    http_timeout_seconds: float = 10.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
