import json
import redis
from datetime import datetime, timezone
from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models.journey_stage import JourneyStage
from app.services.sla_engine import get_sla_status
from app.services.cache import cache_invalidate_pattern
from app.config import settings


@celery_app.task(name="app.tasks.sla_monitor.scan_sla_thresholds", bind=True, max_retries=3)
def scan_sla_thresholds(self):
    """Recalculate SLA for all active stages every 60s. Invalidates analytics cache on change."""
    db = SessionLocal()
    r = None
    try:
        r = redis.from_url(settings.redis_url)
    except Exception:
        pass

    try:
        active_stages = db.query(JourneyStage).filter(JourneyStage.completed_at.is_(None)).all()
        updated = 0

        for stage in active_stages:
            sla_info = get_sla_status(stage.stage_name, stage.started_at)
            new_status = sla_info["status"]
            new_pct = sla_info["percentage"]

            if stage.status != new_status or abs((stage.sla_percentage or 0) - new_pct) > 1:
                stage.status = new_status
                stage.sla_percentage = new_pct
                db.add(stage)
                updated += 1

                if new_status in ("warning", "breached", "critical") and r:
                    alert = {
                        "type": "sla_alert",
                        "request_id": str(stage.request_id),
                        "stage": stage.stage_name,
                        "department": stage.department,
                        "status": new_status,
                        "sla_percentage": new_pct,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    try:
                        r.publish("events:sla_alert", json.dumps(alert))
                    except Exception:
                        pass

        db.commit()

        if updated > 0:
            cache_invalidate_pattern("analytics:*")

        return {"scanned": len(active_stages), "updated": updated}

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


@celery_app.task(name="app.tasks.sla_monitor.warm_analytics_cache", bind=True)
def warm_analytics_cache(self):
    """Pre-warm analytics cache so the first request after expiry is fast."""
    import httpx
    endpoints = [
        "http://localhost:8000/api/analytics/kpis",
        "http://localhost:8000/api/analytics/departments",
        "http://localhost:8000/api/analytics/regions",
        "http://localhost:8000/api/analytics/health-score",
        "http://localhost:8000/api/analytics/financial-kpis",
        "http://localhost:8000/api/analytics/recommendations",
    ]
    warmed = 0
    for url in endpoints:
        try:
            httpx.get(url, timeout=5)
            warmed += 1
        except Exception:
            pass
    return {"warmed": warmed}
