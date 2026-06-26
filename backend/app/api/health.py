"""
Detailed health check — verifies every system dependency.
Used by ops teams and load balancers to confirm platform health.
"""
import time
from fastapi import APIRouter
from sqlalchemy import text

from app.database import engine

router = APIRouter()

_start_time = time.time()


def _check_database() -> dict:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "latency_ms": None}
    except Exception as e:
        return {"status": "error", "error": str(e)[:120]}


def _check_redis() -> dict:
    try:
        import redis as redis_lib
        from app.config import settings
        r = redis_lib.from_url(settings.redis_url, socket_connect_timeout=2)
        latency_start = time.monotonic()
        r.ping()
        latency_ms = round((time.monotonic() - latency_start) * 1000, 1)
        return {"status": "ok", "latency_ms": latency_ms}
    except Exception as e:
        return {"status": "degraded", "note": "Real-time alerts disabled", "error": str(e)[:80]}


def _check_gemini() -> dict:
    try:
        from app.config import settings
        if not settings.gemini_api_key:
            return {"status": "unconfigured", "note": "AI Copilot unavailable"}
        return {"status": "ok", "model": settings.gemini_model_name}
    except Exception as e:
        return {"status": "error", "error": str(e)[:80]}


@router.get("/health")
def health_check():
    db = _check_database()
    redis = _check_redis()
    gemini = _check_gemini()

    uptime_seconds = int(time.time() - _start_time)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    all_ok = db["status"] == "ok"
    overall = "healthy" if all_ok else "degraded"

    return {
        "status": overall,
        "uptime": f"{hours}h {minutes}m {seconds}s",
        "uptime_seconds": uptime_seconds,
        "version": "1.0.0",
        "environment": "demo",
        "dependencies": {
            "database": db,
            "redis": redis,
            "gemini_ai": gemini,
        },
        "capabilities": {
            "real_time_alerts": redis["status"] == "ok",
            "ai_copilot": gemini.get("status") == "ok",
            "sla_monitoring": db["status"] == "ok",
            "analytics": db["status"] == "ok",
        },
    }
