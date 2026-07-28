from app.agents.market_scanner.client import normalize_gamma_market
from app.agents.market_scanner.service import upsert_market_and_snapshot


def test_list_markets_empty(client):
    response = client.get("/api/v1/markets")
    assert response.status_code == 200
    assert response.json() == []


def test_list_and_get_market(client, db_session, sample_gamma_market):
    normalized = normalize_gamma_market(sample_gamma_market)
    market = upsert_market_and_snapshot(db_session, normalized)
    db_session.commit()

    list_response = client.get("/api/v1/markets")
    assert list_response.status_code == 200
    body = list_response.json()
    assert len(body) == 1
    assert body[0]["condition_id"] == normalized["condition_id"]

    detail_response = client.get(f"/api/v1/markets/{market.id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["question"] == normalized["question"]


def test_get_market_not_found(client):
    import uuid

    response = client.get(f"/api/v1/markets/{uuid.uuid4()}")
    assert response.status_code == 404


def test_get_market_snapshots(client, db_session, sample_gamma_market):
    normalized = normalize_gamma_market(sample_gamma_market)
    market = upsert_market_and_snapshot(db_session, normalized)
    db_session.commit()

    response = client.get(f"/api/v1/markets/{market.id}/snapshots")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["market_id"] == str(market.id)
