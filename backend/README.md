# Backend

FastAPI + SQLAlchemy (async) + Celery + PostgreSQL + Redis.

## Run with Docker (recommended)

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, Redis, runs migrations (`migrate` service), then
starts the API (`http://localhost:8000/docs`), the Celery worker, and Celery
beat (which triggers the Market Scanner every `MARKET_SCAN_INTERVAL_SECONDS`,
60s by default).

## Run locally (without Docker)

Requires Python 3.13, a running PostgreSQL and Redis instance.

```bash
cd backend
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # edit DATABASE_URL / REDIS_URL for your local setup

alembic upgrade head
uvicorn app.main:app --reload

# in separate terminals:
celery -A app.core.celery_app worker --loglevel=info
celery -A app.core.celery_app beat --loglevel=info
```

## Tests

```bash
pytest                      # unit + integration tests (SQLite in-memory, no external services needed)
pytest --cov=app            # with coverage
ruff check .                # lint
```

## Migrations

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

## Project layout

```
app/
  core/            settings, DB engine/session, Celery app, logging
  models/          SQLAlchemy ORM models (full schema)
  schemas/         Pydantic (API) schemas
  api/routers/      FastAPI routers
  agents/
    base.py         shared BaseAgent contract
    market_scanner/  implemented: polls Polymarket, writes Market + MarketSnapshot
    news_agent/       next step
    llm_analyst/      next step
    quant_agent/      next step
    risk_manager/     next step
    execution_engine/ next step
tests/             pytest suite (models, agents, API), no external services required
alembic/           migrations
```
