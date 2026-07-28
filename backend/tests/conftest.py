import os
import uuid

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg2://polymarket:polymarket@localhost:5432/polymarket_test",
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models as _models  # noqa: F401  (register all models on Base.metadata)
from app.core.config import get_settings
from app.core.database import Base, get_db
from app.main import app

settings = get_settings()
engine = create_engine(settings.database_url, future=True)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_gamma_market() -> dict:
    return {
        "id": str(uuid.uuid4()),
        "conditionId": f"0xcond-{uuid.uuid4().hex[:12]}",
        "slug": "will-example-happen",
        "question": "Will example event happen?",
        "category": "Politics",
        "outcomes": '["Yes", "No"]',
        "outcomePrices": '["0.62", "0.38"]',
        "active": True,
        "closed": False,
        "volume": "125000.50",
        "liquidity": "48000.25",
        "bestBid": "0.61",
        "bestAsk": "0.63",
        "endDate": "2026-12-31T00:00:00Z",
    }
