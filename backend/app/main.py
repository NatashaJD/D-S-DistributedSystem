import asyncio
import time
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import requests, events, analytics, copilot
from app.api import auth, health, webhooks
from app.websocket import manager as ws_manager


# ── In-memory rate limiter (per-IP per-path, per minute) ─────────────────────
_rate_limit_store: dict = defaultdict(list)
RATE_LIMITS = {
    "/api/v1/copilot":   60,
    "/api/v1/analytics": 300,
    "/api/v1/webhooks":  60,
    "default":           300,
}


def _get_limit_and_prefix(path: str):
    for prefix, limit in RATE_LIMITS.items():
        if path.startswith(prefix):
            return limit, prefix
    return RATE_LIMITS["default"], "default"


# ── Startup cache warmup ─────────────────────────────────────────────────────
def _run_warmup():
    """Blocking warmup - runs in thread executor so event loop is not blocked."""
    try:
        from app.api.analytics import (
            get_kpis, get_department_metrics, get_regional_metrics,
            get_health_score, get_financial_kpis,
        )
        db = SessionLocal()
        try:
            get_kpis(db)
            get_department_metrics(db)
            get_regional_metrics(db)
            get_health_score(db)
            get_financial_kpis(db)
        finally:
            db.close()
    except Exception:
        pass


# ── Background: live SLA recalculation every 60 s ────────────────────────────
async def sla_recalculation_loop():
    """
    Recalculates sla_percentage for every active journey stage based on elapsed
    business hours. This makes the platform genuinely live rather than static.
    """
    from app.models.journey_stage import JourneyStage
    from app.services.sla_engine import calc_business_hours_elapsed, SLA_CONFIG

    while True:
        try:
            await asyncio.sleep(60)
            db = SessionLocal()
            try:
                active = db.query(JourneyStage).filter(
                    JourneyStage.completed_at.is_(None)
                ).all()

                updated = 0
                for stage in active:
                    sla_cfg = SLA_CONFIG.get(stage.stage_name, {})
                    sla_hours = sla_cfg.get("hours", 8)
                    elapsed = calc_business_hours_elapsed(stage.started_at)
                    sla_pct = round((elapsed / sla_hours) * 100, 1)
                    stage.sla_percentage = sla_pct

                    prev_status = stage.status
                    if sla_pct >= 150:
                        stage.status = "critical"
                    elif sla_pct >= 100:
                        stage.status = "breached"
                    elif sla_pct >= 75:
                        stage.status = "warning"
                    else:
                        stage.status = "on_track"

                    if stage.status != prev_status:
                        updated += 1

                db.commit()

                if updated > 0:
                    await ws_manager.broadcast({
                        "type": "sla_refresh",
                        "updated_count": updated,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    loop = asyncio.get_event_loop()
                    asyncio.ensure_future(
                        loop.run_in_executor(None, _run_warmup)
                    )

            finally:
                db.close()

        except asyncio.CancelledError:
            return
        except Exception:
            pass


def _auto_seed_if_empty():
    """Seed demo data on first run (cloud deployments start with an empty DB)."""
    try:
        from app.models.service_request import ServiceRequest
        from app.models.department import Department, SLAConfig
        from app.models.customer import Customer
        from app.models.event import Event
        from app.models.journey_stage import JourneyStage
        from app.seed.generate import (
            generate_customers, generate_requests_and_journeys,
            generate_sla_configs, generate_departments,
        )
        from datetime import datetime as _dt

        db = SessionLocal()
        try:
            if db.query(ServiceRequest).count() > 0:
                return  # already seeded
            for d in generate_departments():
                db.add(Department(**d))
            for s in generate_sla_configs():
                db.add(SLAConfig(**s))
            db.commit()

            customers = generate_customers(50)
            for c in customers:
                db.add(Customer(id=c["id"], name=c["name"], email=c["email"],
                                phone=c["phone"], region=c["region"], company=c["company"]))
            db.commit()

            requests, stages, events = generate_requests_and_journeys(customers, 200)
            for r in requests:
                db.add(ServiceRequest(
                    id=r["id"], customer_id=r["customer_id"],
                    product_category=r["product_category"], priority=r["priority"],
                    current_stage=r["current_stage"], assigned_department=r["assigned_department"],
                    status=r["status"], description=r["description"],
                    crm_reference=r["crm_reference"], erp_reference=r["erp_reference"],
                    created_at=_dt.fromisoformat(r["created_at"]),
                    updated_at=_dt.fromisoformat(r["updated_at"]),
                ))
            db.commit()

            for s in stages:
                db.add(JourneyStage(
                    id=s["id"], request_id=s["request_id"], stage_name=s["stage_name"],
                    department=s["department"],
                    started_at=_dt.fromisoformat(s["started_at"]),
                    completed_at=_dt.fromisoformat(s["completed_at"]) if s["completed_at"] else None,
                    sla_deadline=_dt.fromisoformat(s["sla_deadline"]) if s["sla_deadline"] else None,
                    status=s["status"], sla_percentage=s["sla_percentage"],
                    assigned_to=s["assigned_to"],
                ))
            db.commit()

            for e in events:
                db.add(Event(
                    id=e["id"], request_id=e["request_id"], event_type=e["event_type"],
                    stage=e["stage"], source_system=e["source_system"],
                    actor=e["actor"], description=e["description"],
                    timestamp=_dt.fromisoformat(e["timestamp"]),
                    metadata_json=e["metadata_json"],
                ))
            db.commit()
        finally:
            db.close()
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _auto_seed_if_empty)
    await loop.run_in_executor(None, _run_warmup)
    redis_task = asyncio.create_task(ws_manager.redis_subscriber())
    sla_task = asyncio.create_task(sla_recalculation_loop())
    yield
    for task in (redis_task, sla_task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="Dayliff 1000 Eyes API",
    description="Enterprise Operational Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    limit, prefix = _get_limit_and_prefix(path)
    key = f"{client_ip}:{prefix}"
    now = time.time()

    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < 60]

    if len(_rate_limit_store[key]) >= limit:
        origin = request.headers.get("origin", "")
        cors_origins = [o.strip() for o in settings.cors_origins.split(",")]
        acao = origin if origin in cors_origins else (cors_origins[0] if cors_origins else "*")
        return Response(
            content='{"detail":"Rate limit exceeded. Please slow down."}',
            status_code=429,
            media_type="application/json",
            headers={
                "Retry-After": "60",
                "Access-Control-Allow-Origin": acao,
                "Access-Control-Allow-Credentials": "true",
            },
        )

    _rate_limit_store[key].append(now)
    return await call_next(request)


app.include_router(requests.router,   prefix="/api/v1/requests",  tags=["requests"])
app.include_router(events.router,     prefix="/api/v1/events",    tags=["events"])
app.include_router(analytics.router,  prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(copilot.router,    prefix="/api/v1/copilot",   tags=["copilot"])
app.include_router(auth.router,       prefix="/api/v1/auth",      tags=["auth"])
app.include_router(health.router,     prefix="/api/v1",           tags=["health"])
app.include_router(webhooks.router,   prefix="/api/v1/webhooks",  tags=["webhooks"])
app.include_router(ws_manager.router,                              tags=["websocket"])
