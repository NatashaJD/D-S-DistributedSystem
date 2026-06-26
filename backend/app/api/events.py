from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import json
import redis as redis_client

from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse
from app.config import settings

router = APIRouter()


def get_redis():
    try:
        r = redis_client.from_url(settings.redis_url)
        return r
    except Exception:
        return None


@router.get("", response_model=List[EventResponse])
def list_events(
    request_id: Optional[UUID] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Event)
    if request_id:
        query = query.filter(Event.request_id == request_id)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    return query.order_by(Event.timestamp.desc()).limit(limit).all()


@router.post("", response_model=EventResponse, status_code=201)
def ingest_event(payload: EventCreate, db: Session = Depends(get_db)):
    event = Event(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)

    r = get_redis()
    if r:
        payload = {
            "type": "new_event",
            "request_id": str(event.request_id),
            "event_type": event.event_type,
            "stage": event.stage or "",
            "timestamp": event.timestamp.isoformat(),
        }
        try:
            # Redis Stream: durable, replayable event log (distributed pattern)
            r.xadd(
                "dayliff:event-stream",
                {k: v for k, v in payload.items()},
                maxlen=10_000,
                approximate=True,
            )
        except Exception:
            pass
        try:
            # Pub/Sub: ephemeral real-time fan-out for connected WebSocket clients
            r.publish("events:global", json.dumps(payload))
        except Exception:
            pass

    return event
