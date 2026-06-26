"""
External event ingestion webhook.
Accepts events from CRM, ERP, field systems, and mobile apps.
Validates API key, persists events, triggers live SLA recalculation.

Usage:
  POST /api/webhooks/events
  X-API-Key: dayliff-webhook-2024
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.models.service_request import ServiceRequest
from app.models.customer import Customer
from app.models.journey_stage import JourneyStage
from app.services.sla_engine import calc_business_hours_elapsed, SLA_CONFIG

router = APIRouter()

# In production: store in DB / secrets manager
VALID_API_KEYS = {
    "dayliff-webhook-2024":       "CRM System",
    "erp-integration-key-9182":   "ERP System",
    "field-mobile-key-3741":      "Field Mobile App",
    "engineering-portal-key-5512": "Engineering Portal",
}


class WebhookEventPayload(BaseModel):
    event_type: str
    stage: str
    source_system: str
    actor: str
    description: str
    crm_reference: str                         # used to look up / create request
    customer_name: Optional[str] = None
    customer_region: Optional[str] = "Nairobi"
    product_category: Optional[str] = "Water Pumps"
    priority: Optional[str] = "medium"
    metadata: Optional[dict] = {}


def _validate_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    if x_api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key header")
    return VALID_API_KEYS[x_api_key]


@router.post("/events")
async def ingest_event(
    payload: WebhookEventPayload,
    source: str = Depends(_validate_api_key),
    db: Session = Depends(get_db),
):
    # ── Find or create service request by CRM reference ──────────────────────
    request = db.query(ServiceRequest).filter(
        ServiceRequest.crm_reference == payload.crm_reference
    ).first()

    if not request:
        # Auto-create a customer + request for new CRM references
        customer = Customer(
            id=str(uuid.uuid4()),
            name=payload.customer_name or "Unknown Customer",
            region=payload.customer_region or "Nairobi",
        )
        db.add(customer)
        db.flush()

        request = ServiceRequest(
            id=str(uuid.uuid4()),
            customer_id=customer.id,
            product_category=payload.product_category,
            priority=payload.priority,
            current_stage=payload.stage,
            assigned_department=_stage_to_dept(payload.stage),
            status="in_progress",
            crm_reference=payload.crm_reference,
        )
        db.add(request)
        db.flush()

        # Create initial journey stage
        sla_cfg = SLA_CONFIG.get(payload.stage, {})
        from app.services.sla_engine import add_business_hours
        now = datetime.now(timezone.utc)
        stage_record = JourneyStage(
            id=str(uuid.uuid4()),
            request_id=request.id,
            stage_name=payload.stage,
            department=_stage_to_dept(payload.stage),
            started_at=now,
            sla_deadline=add_business_hours(now, sla_cfg.get("hours", 8)),
            status="on_track",
            sla_percentage=0.0,
        )
        db.add(stage_record)

    # ── Persist the event ─────────────────────────────────────────────────────
    event = Event(
        id=str(uuid.uuid4()),
        request_id=request.id,
        event_type=payload.event_type,
        stage=payload.stage,
        source_system=payload.source_system,
        actor=payload.actor,
        description=payload.description,
        timestamp=datetime.now(timezone.utc),
        metadata_json={**payload.metadata, "ingested_from": source},
    )
    db.add(event)

    # ── Recalculate SLA for active stage ──────────────────────────────────────
    active_stage = db.query(JourneyStage).filter(
        JourneyStage.request_id == request.id,
        JourneyStage.completed_at.is_(None),
    ).first()

    if active_stage:
        sla_cfg = SLA_CONFIG.get(active_stage.stage_name, {})
        sla_hours = sla_cfg.get("hours", 8)
        elapsed = calc_business_hours_elapsed(active_stage.started_at)
        sla_pct = round((elapsed / sla_hours) * 100, 1)
        active_stage.sla_percentage = sla_pct
        if sla_pct >= 150:
            active_stage.status = "critical"
        elif sla_pct >= 100:
            active_stage.status = "breached"
        elif sla_pct >= 75:
            active_stage.status = "warning"
        else:
            active_stage.status = "on_track"

    # ── Advance stage if stage-completion event ───────────────────────────────
    COMPLETION_EVENTS = {
        "site_assessment", "design_approved", "quotation_approved",
        "lpo_received", "delivered", "installation_done", "customer_signoff",
    }
    if payload.event_type in COMPLETION_EVENTS and active_stage:
        active_stage.completed_at = datetime.now(timezone.utc)
        active_stage.status = "completed" if (active_stage.sla_percentage or 0) <= 100 else "breached"

    db.commit()

    # ── Broadcast via WebSocket ───────────────────────────────────────────────
    try:
        from app.websocket import manager as ws_manager
        await ws_manager.broadcast({
            "type": "webhook_event",
            "crm_reference": payload.crm_reference,
            "event_type": payload.event_type,
            "stage": payload.stage,
            "source": source,
        })
    except Exception:
        pass

    return {
        "status": "accepted",
        "request_id": request.id,
        "event_id": event.id,
        "crm_reference": payload.crm_reference,
        "source": source,
    }


def _stage_to_dept(stage: str) -> str:
    return {
        "inquiry": "Sales",
        "engineering_review": "Engineering",
        "quotation": "Quotations",
        "dispatch": "Logistics",
    }.get(stage, "Sales")
