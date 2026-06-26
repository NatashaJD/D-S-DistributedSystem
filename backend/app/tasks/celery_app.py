from celery import Celery
from app.config import settings

celery_app = Celery(
    "dayliff_1000_eyes",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.sla_monitor"],
)

celery_app.conf.beat_schedule = {
    # SLA recalculation: every 60 seconds for live observability
    "sla-recalculate-every-60s": {
        "task": "app.tasks.sla_monitor.scan_sla_thresholds",
        "schedule": 60.0,
    },
    # Analytics cache warm-up: every 5 minutes
    "cache-warmup-every-5min": {
        "task": "app.tasks.sla_monitor.warm_analytics_cache",
        "schedule": 300.0,
    },
}

celery_app.conf.timezone = "Africa/Nairobi"
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.task_track_started = True
celery_app.conf.worker_prefetch_multiplier = 1
