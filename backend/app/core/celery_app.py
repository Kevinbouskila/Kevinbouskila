"""Celery application: task queue used by all agents (scanner, news, LLM, quant...)."""

from celery import Celery
from celery.schedules import schedule

from app.core.config import settings

celery_app = Celery(
    "polymarket_platform",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.agents.market_scanner.tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_max_tasks_per_child=200,
)

celery_app.conf.beat_schedule = {
    "scan-polymarket-markets": {
        "task": "app.agents.market_scanner.tasks.scan_markets_task",
        "schedule": schedule(run_every=settings.market_scan_interval_seconds),
    },
}
