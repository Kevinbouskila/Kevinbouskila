import uuid
from datetime import UTC, datetime

from app.models.backtest import Backtest, BacktestStatus
from app.models.configuration import Configuration
from app.models.llm_analysis import LLMAnalysis
from app.models.log import Log, LogCategory
from app.models.market import Market
from app.models.news import News
from app.models.order import Order, OrderAction, OrderType
from app.models.portfolio import Portfolio, PortfolioMode
from app.models.position import Position, PositionSide
from app.models.signal import Signal, SignalType
from app.models.user import User


def _make_user(db_session) -> User:
    user = User(email=f"{uuid.uuid4().hex}@example.com", hashed_password="hashed")
    db_session.add(user)
    db_session.flush()
    return user


def _make_market(db_session) -> Market:
    market = Market(condition_id=f"0x{uuid.uuid4().hex[:16]}", question="Will X happen?")
    db_session.add(market)
    db_session.flush()
    return market


def test_user_and_portfolio_lifecycle(db_session):
    user = _make_user(db_session)
    portfolio = Portfolio(
        user_id=user.id,
        name="Main",
        mode=PortfolioMode.PAPER,
        starting_balance=1000,
        current_balance=1000,
    )
    db_session.add(portfolio)
    db_session.commit()

    assert portfolio.id is not None
    assert portfolio.mode == PortfolioMode.PAPER


def test_position_and_order(db_session):
    user = _make_user(db_session)
    market = _make_market(db_session)
    portfolio = Portfolio(
        user_id=user.id, name="Main", starting_balance=1000, current_balance=1000
    )
    db_session.add(portfolio)
    db_session.flush()

    position = Position(
        portfolio_id=portfolio.id,
        market_id=market.id,
        side=PositionSide.YES,
        entry_price=0.5,
        quantity=100,
        opened_at=datetime.now(UTC),
    )
    db_session.add(position)
    db_session.flush()

    order = Order(
        portfolio_id=portfolio.id,
        market_id=market.id,
        position_id=position.id,
        side=PositionSide.YES,
        order_type=OrderType.MARKET,
        action=OrderAction.BUY,
        mode=PortfolioMode.PAPER,
        quantity=100,
        price=0.5,
    )
    db_session.add(order)
    db_session.commit()

    assert order.id is not None
    assert order.position_id == position.id


def test_signal_and_llm_analysis(db_session):
    market = _make_market(db_session)
    analysis = LLMAnalysis(
        market_id=market.id,
        model_provider="anthropic",
        model_name="claude-sonnet-5",
        estimated_probability=0.7,
        confidence_level=80,
    )
    db_session.add(analysis)
    db_session.flush()

    signal = Signal(
        market_id=market.id,
        llm_analysis_id=analysis.id,
        signal_type=SignalType.BUY_YES,
        edge=0.08,
        expected_value=0.05,
        kelly_fraction=0.02,
        confidence_score=75,
    )
    db_session.add(signal)
    db_session.commit()

    assert signal.id is not None
    assert signal.llm_analysis_id == analysis.id


def test_news_configuration_log_backtest(db_session):
    news = News(source="reuters", title="Big news", url=f"https://example.com/{uuid.uuid4()}")
    config = Configuration(key=f"risk.max_position_size.{uuid.uuid4().hex[:6]}", value={"amount": 500})
    log = Log(category=LogCategory.MARKET_SCANNER, message="Scan complete")
    backtest = Backtest(
        name="Baseline strategy",
        strategy_config={"min_edge": 0.05},
        start_date=datetime(2025, 1, 1, tzinfo=UTC),
        end_date=datetime(2025, 6, 1, tzinfo=UTC),
        status=BacktestStatus.PENDING,
    )

    db_session.add_all([news, config, log, backtest])
    db_session.commit()

    assert news.id is not None
    assert config.id is not None
    assert log.id is not None
    assert backtest.id is not None
