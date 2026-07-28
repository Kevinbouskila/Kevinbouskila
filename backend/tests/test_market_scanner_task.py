from unittest.mock import MagicMock, patch

from app.agents.market_scanner.tasks import scan_markets_task
from app.models.market import Market


def test_scan_markets_task_persists_markets(sample_gamma_market):
    fake_client = MagicMock()
    fake_client.__enter__.return_value = fake_client
    fake_client.__exit__.return_value = False
    fake_client.iter_active_markets.return_value = iter([sample_gamma_market])

    with patch("app.agents.market_scanner.tasks.PolymarketClient", return_value=fake_client):
        result = scan_markets_task.run()

    assert result == {"scanned": 1, "failed": 0}

    from tests.conftest import TestingSessionLocal

    session = TestingSessionLocal()
    try:
        market = session.query(Market).filter_by(condition_id=sample_gamma_market["conditionId"]).one()
        assert market.question == sample_gamma_market["question"]
    finally:
        session.query(Market).filter_by(condition_id=sample_gamma_market["conditionId"]).delete()
        session.commit()
        session.close()


def test_scan_markets_task_counts_failures(sample_gamma_market):
    broken_market = {"question": "no condition id"}
    fake_client = MagicMock()
    fake_client.__enter__.return_value = fake_client
    fake_client.__exit__.return_value = False
    fake_client.iter_active_markets.return_value = iter([sample_gamma_market, broken_market])

    with patch("app.agents.market_scanner.tasks.PolymarketClient", return_value=fake_client):
        result = scan_markets_task.run()

    assert result["scanned"] == 1
    assert result["failed"] == 1

    from tests.conftest import TestingSessionLocal

    session = TestingSessionLocal()
    try:
        session.query(Market).filter_by(condition_id=sample_gamma_market["conditionId"]).delete()
        session.commit()
    finally:
        session.close()
