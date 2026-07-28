"""Unit tests for the Gamma API market payload parser."""

import json

from app.agents.market_scanner.parser import parse_gamma_market


def _raw_market(**overrides: object) -> dict:
    base = {
        "conditionId": "0xabc",
        "question": "Will X happen?",
        "slug": "will-x-happen",
        "category": "Politics",
        "active": True,
        "closed": False,
        "volume": "12345.6",
        "liquidity": "5000.0",
        "volume24hr": "890.1",
        "outcomes": json.dumps(["Yes", "No"]),
        "outcomePrices": json.dumps(["0.62", "0.38"]),
        "clobTokenIds": json.dumps(["tok-yes", "tok-no"]),
        "endDate": "2026-12-31T00:00:00Z",
        "createdAt": "2026-01-01T00:00:00Z",
    }
    base.update(overrides)
    return base


def test_parse_valid_market() -> None:
    parsed = parse_gamma_market(_raw_market())
    assert parsed is not None
    assert parsed.condition_id == "0xabc"
    assert parsed.volume == 12345.6
    assert parsed.liquidity == 5000.0
    assert parsed.volume_24h == 890.1
    assert len(parsed.outcomes) == 2
    assert parsed.yes_outcome.name == "Yes"
    assert parsed.yes_outcome.token_id == "tok-yes"
    assert parsed.yes_outcome.price == 0.62
    assert parsed.no_outcome.price == 0.38
    assert parsed.end_date is not None
    assert parsed.end_date.year == 2026


def test_parse_missing_required_field_returns_none() -> None:
    assert parse_gamma_market(_raw_market(conditionId=None)) is None
    assert parse_gamma_market(_raw_market(question=None)) is None
    assert parse_gamma_market(_raw_market(slug=None)) is None


def test_parse_malformed_json_fields_degrades_gracefully() -> None:
    parsed = parse_gamma_market(
        _raw_market(outcomes="not-json", outcomePrices="[", clobTokenIds=None)
    )
    assert parsed is not None
    assert parsed.outcomes == []
    assert parsed.yes_outcome is None


def test_parse_non_numeric_volume_becomes_none() -> None:
    parsed = parse_gamma_market(_raw_market(volume="N/A", liquidity=None))
    assert parsed is not None
    assert parsed.volume is None
    assert parsed.liquidity is None


def test_parse_closed_market_status_inputs() -> None:
    parsed = parse_gamma_market(_raw_market(active=False, closed=True))
    assert parsed is not None
    assert parsed.active is False
    assert parsed.closed is True
