import httpx
import pytest
import respx

from app.agents.market_scanner.client import (
    PolymarketAPIError,
    PolymarketClient,
    normalize_gamma_market,
)


def test_normalize_gamma_market_parses_json_encoded_fields(sample_gamma_market):
    normalized = normalize_gamma_market(sample_gamma_market)

    assert normalized["condition_id"] == sample_gamma_market["conditionId"]
    assert normalized["outcomes"] == ["Yes", "No"]
    assert normalized["last_price"] == pytest.approx(0.62)
    assert normalized["implied_probability"] == pytest.approx(0.62)
    assert normalized["best_bid"] == pytest.approx(0.61)
    assert normalized["best_ask"] == pytest.approx(0.63)
    assert normalized["spread"] == pytest.approx(0.02)
    assert normalized["volume"] == pytest.approx(125000.50)
    assert normalized["active"] is True
    assert normalized["closed"] is False


def test_normalize_gamma_market_handles_missing_prices():
    raw = {"conditionId": "0xabc", "question": "Q?", "outcomes": "[]", "outcomePrices": "[]"}
    normalized = normalize_gamma_market(raw)

    assert normalized["last_price"] is None
    assert normalized["spread"] is None
    assert normalized["outcomes"] == []


@respx.mock
def test_fetch_markets_page_returns_list(sample_gamma_market):
    route = respx.get("https://gamma-api.polymarket.com/markets").mock(
        return_value=httpx.Response(200, json=[sample_gamma_market])
    )

    with PolymarketClient(base_url="https://gamma-api.polymarket.com") as client:
        page = client.fetch_markets_page(limit=100, offset=0)

    assert route.called
    assert page == [sample_gamma_market]


@respx.mock
def test_fetch_markets_page_unwraps_data_envelope(sample_gamma_market):
    respx.get("https://gamma-api.polymarket.com/markets").mock(
        return_value=httpx.Response(200, json={"data": [sample_gamma_market]})
    )

    with PolymarketClient(base_url="https://gamma-api.polymarket.com") as client:
        page = client.fetch_markets_page()

    assert page == [sample_gamma_market]


@respx.mock
def test_fetch_markets_page_raises_on_unexpected_shape():
    respx.get("https://gamma-api.polymarket.com/markets").mock(
        return_value=httpx.Response(200, json={"unexpected": "shape"})
    )

    with PolymarketClient(base_url="https://gamma-api.polymarket.com") as client:
        with pytest.raises(PolymarketAPIError):
            client.fetch_markets_page()


@respx.mock
def test_iter_active_markets_paginates_until_empty_page(sample_gamma_market):
    page_one = [sample_gamma_market, sample_gamma_market]
    respx.get("https://gamma-api.polymarket.com/markets", params={"offset": "0"}).mock(
        return_value=httpx.Response(200, json=page_one)
    )
    respx.get("https://gamma-api.polymarket.com/markets", params={"offset": "2"}).mock(
        return_value=httpx.Response(200, json=[])
    )

    with PolymarketClient(base_url="https://gamma-api.polymarket.com") as client:
        results = list(client.iter_active_markets(page_size=2, max_markets=500))

    assert len(results) == 2


@respx.mock
def test_iter_active_markets_respects_max_markets(sample_gamma_market):
    respx.get("https://gamma-api.polymarket.com/markets").mock(
        return_value=httpx.Response(200, json=[sample_gamma_market] * 10)
    )

    with PolymarketClient(base_url="https://gamma-api.polymarket.com") as client:
        results = list(client.iter_active_markets(page_size=10, max_markets=3))

    assert len(results) == 3
