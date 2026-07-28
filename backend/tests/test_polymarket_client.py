"""Tests for the Polymarket Gamma/CLOB HTTP client, using respx to mock httpx."""

import httpx
import pytest
import respx

from app.agents.market_scanner.polymarket_client import PolymarketClient

GAMMA_URL = "http://gamma.test"
CLOB_URL = "http://clob.test"


@pytest.mark.asyncio
@respx.mock
async def test_get_markets_returns_parsed_list() -> None:
    respx.get(f"{GAMMA_URL}/markets").mock(
        return_value=httpx.Response(200, json=[{"conditionId": "0x1"}])
    )
    async with PolymarketClient(gamma_base_url=GAMMA_URL, clob_base_url=CLOB_URL) as client:
        markets = await client.get_markets(limit=10, offset=0)
    assert markets == [{"conditionId": "0x1"}]


@pytest.mark.asyncio
@respx.mock
async def test_get_markets_unwraps_data_envelope() -> None:
    respx.get(f"{GAMMA_URL}/markets").mock(
        return_value=httpx.Response(200, json={"data": [{"conditionId": "0x2"}]})
    )
    async with PolymarketClient(gamma_base_url=GAMMA_URL, clob_base_url=CLOB_URL) as client:
        markets = await client.get_markets()
    assert markets == [{"conditionId": "0x2"}]


@pytest.mark.asyncio
@respx.mock
async def test_get_order_book_success() -> None:
    respx.get(f"{CLOB_URL}/book").mock(
        return_value=httpx.Response(200, json={"bids": [], "asks": []})
    )
    async with PolymarketClient(gamma_base_url=GAMMA_URL, clob_base_url=CLOB_URL) as client:
        book = await client.get_order_book("tok-yes")
    assert book == {"bids": [], "asks": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_order_book_returns_none_on_repeated_failure() -> None:
    respx.get(f"{CLOB_URL}/book").mock(return_value=httpx.Response(500))
    async with PolymarketClient(gamma_base_url=GAMMA_URL, clob_base_url=CLOB_URL) as client:
        book = await client.get_order_book("tok-yes")
    assert book is None


@pytest.mark.asyncio
@respx.mock
async def test_get_markets_retries_then_succeeds() -> None:
    route = respx.get(f"{GAMMA_URL}/markets")
    route.side_effect = [
        httpx.Response(500),
        httpx.Response(200, json=[{"conditionId": "0x3"}]),
    ]
    async with PolymarketClient(gamma_base_url=GAMMA_URL, clob_base_url=CLOB_URL) as client:
        markets = await client.get_markets()
    assert markets == [{"conditionId": "0x3"}]
    assert route.call_count == 2
