"""Normalizes raw Gamma API market payloads into a stable internal shape.

The Gamma API encodes several fields (``outcomes``, ``outcomePrices``,
``clobTokenIds``) as JSON strings rather than native JSON arrays, and numeric
fields are sometimes strings. This module isolates that parsing so the rest
of the codebase only deals with clean Python types.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime


def _parse_json_list(raw: object) -> list:
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return []
        return parsed if isinstance(parsed, list) else []
    return []


def _parse_float(raw: object) -> float | None:
    if raw is None or raw == "":
        return None
    try:
        return float(raw)
    except (TypeError, ValueError):
        return None


def _parse_datetime(raw: object) -> datetime | None:
    if not raw or not isinstance(raw, str):
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


@dataclass
class ParsedOutcome:
    name: str
    token_id: str | None
    price: float | None


@dataclass
class ParsedMarket:
    condition_id: str
    question: str
    slug: str
    category: str | None
    subcategory: str | None
    active: bool
    closed: bool
    volume: float | None
    liquidity: float | None
    volume_24h: float | None
    end_date: datetime | None
    external_created_at: datetime | None
    outcomes: list[ParsedOutcome] = field(default_factory=list)
    raw: dict = field(default_factory=dict)

    @property
    def yes_outcome(self) -> ParsedOutcome | None:
        for outcome in self.outcomes:
            if outcome.name.strip().lower() == "yes":
                return outcome
        return self.outcomes[0] if self.outcomes else None

    @property
    def no_outcome(self) -> ParsedOutcome | None:
        for outcome in self.outcomes:
            if outcome.name.strip().lower() == "no":
                return outcome
        return self.outcomes[1] if len(self.outcomes) > 1 else None


def parse_gamma_market(raw: dict) -> ParsedMarket | None:
    """Parse one Gamma API market object. Returns ``None`` if unusable."""
    condition_id = raw.get("conditionId") or raw.get("condition_id")
    question = raw.get("question")
    slug = raw.get("slug")
    if not condition_id or not question or not slug:
        return None

    names = _parse_json_list(raw.get("outcomes"))
    prices = _parse_json_list(raw.get("outcomePrices"))
    token_ids = _parse_json_list(raw.get("clobTokenIds"))

    outcomes: list[ParsedOutcome] = []
    for idx, name in enumerate(names):
        outcomes.append(
            ParsedOutcome(
                name=str(name),
                token_id=str(token_ids[idx]) if idx < len(token_ids) else None,
                price=_parse_float(prices[idx]) if idx < len(prices) else None,
            )
        )

    return ParsedMarket(
        condition_id=str(condition_id),
        question=str(question),
        slug=str(slug),
        category=raw.get("category"),
        subcategory=raw.get("subcategory"),
        active=bool(raw.get("active", True)),
        closed=bool(raw.get("closed", False)),
        volume=_parse_float(raw.get("volume")),
        liquidity=_parse_float(raw.get("liquidity")),
        volume_24h=_parse_float(raw.get("volume24hr")),
        end_date=_parse_datetime(raw.get("endDate")),
        external_created_at=_parse_datetime(raw.get("createdAt")),
        outcomes=outcomes,
        raw=raw,
    )
