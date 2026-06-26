from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.service_request import ServiceRequest
from app.models.journey_stage import JourneyStage
from app.models.event import Event
from app.services.sla_engine import get_sla_status, add_business_hours, SLA_CONFIG


STAGE_ORDER = ["inquiry", "engineering_review", "quotation", "dispatch", "delivered"]

STAGE_DISPLAY = {
    "inquiry":            "Sales Inquiry",
    "engineering_review": "Engineering Review",
    "quotation":          "Quotation & Approval",
    "dispatch":           "Dispatch & Delivery",
    "delivered":          "Delivered",
}

DEPARTMENT_MAP = {
    "inquiry":            "Sales",
    "engineering_review": "Engineering",
    "quotation":          "Quotations",
    "dispatch":           "Logistics",
    "delivered":          "Logistics",
}


def reconstruct_journey(request: ServiceRequest, db: Session) -> List[dict]:
    """Build a full journey timeline from journey stages + events."""
    stages = (
        db.query(JourneyStage)
        .filter(JourneyStage.request_id == request.id)
        .order_by(JourneyStage.started_at)
        .all()
    )

    timeline = []
    for stage in stages:
        sla_info = get_sla_status(stage.stage_name, stage.started_at, stage.completed_at)

        # Update the stage in DB if SLA has changed
        new_status = sla_info["status"]
        if stage.status != "completed" and stage.status != new_status:
            stage.status = new_status
            stage.sla_percentage = sla_info["percentage"]
            db.add(stage)

        timeline.append({
            "stage_id": str(stage.id),
            "stage_name": stage.stage_name,
            "stage_display": STAGE_DISPLAY.get(stage.stage_name, stage.stage_name),
            "department": stage.department,
            "started_at": stage.started_at.isoformat() if stage.started_at else None,
            "completed_at": stage.completed_at.isoformat() if stage.completed_at else None,
            "sla_deadline": sla_info["deadline"].isoformat() if sla_info["deadline"] else None,
            "status": sla_info["status"],
            "sla_percentage": sla_info["percentage"],
            "elapsed_hours": sla_info.get("elapsed_hours", 0),
            "sla_hours": sla_info.get("sla_hours", 0),
            "assigned_to": stage.assigned_to,
        })

    try:
        db.commit()
    except Exception:
        db.rollback()

    return timeline


def get_current_sla_info(request: ServiceRequest, db: Session) -> dict:
    """Get SLA info for the active stage of a request."""
    current_stage = (
        db.query(JourneyStage)
        .filter(
            JourneyStage.request_id == request.id,
            JourneyStage.stage_name == request.current_stage,
            JourneyStage.completed_at.is_(None),
        )
        .first()
    )

    if not current_stage:
        return {"status": "unknown", "percentage": 0.0}

    return get_sla_status(current_stage.stage_name, current_stage.started_at)


def create_journey_stages_for_request(request: ServiceRequest, db: Session):
    """Create the initial JourneyStage record when a new request arrives."""
    sla_info = get_sla_status("inquiry", request.created_at)
    stage = JourneyStage(
        request_id=request.id,
        stage_name="inquiry",
        department="Sales",
        started_at=request.created_at,
        sla_deadline=sla_info["deadline"],
        status="on_track",
        sla_percentage=0.0,
    )
    db.add(stage)
    db.commit()
