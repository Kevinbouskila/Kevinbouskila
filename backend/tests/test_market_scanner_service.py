from app.agents.market_scanner.client import normalize_gamma_market
from app.agents.market_scanner.service import upsert_market_and_snapshot
from app.models.market import Market, MarketSnapshot


def test_upsert_creates_market_and_snapshot(db_session, sample_gamma_market):
    normalized = normalize_gamma_market(sample_gamma_market)

    market = upsert_market_and_snapshot(db_session, normalized)
    db_session.commit()

    assert db_session.query(Market).count() == 1
    assert db_session.query(MarketSnapshot).count() == 1

    snapshot = db_session.query(MarketSnapshot).one()
    assert snapshot.market_id == market.id
    assert float(snapshot.price) == float(normalized["last_price"])


def test_upsert_updates_existing_market_and_appends_snapshot(db_session, sample_gamma_market):
    normalized = normalize_gamma_market(sample_gamma_market)
    upsert_market_and_snapshot(db_session, normalized)
    db_session.commit()

    updated_raw = dict(sample_gamma_market)
    updated_raw["outcomePrices"] = '["0.70", "0.30"]'
    updated_raw["volume"] = "200000.00"
    updated_normalized = normalize_gamma_market(updated_raw)

    upsert_market_and_snapshot(db_session, updated_normalized)
    db_session.commit()

    assert db_session.query(Market).count() == 1
    assert db_session.query(MarketSnapshot).count() == 2

    market = db_session.query(Market).one()
    assert float(market.last_price) == 0.70
    assert float(market.volume) == 200000.00


def test_upsert_raises_without_condition_id(db_session):
    import pytest

    with pytest.raises(ValueError):
        upsert_market_and_snapshot(db_session, {"question": "no id"})
