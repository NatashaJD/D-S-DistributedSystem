from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any


class EventCreate(BaseModel):
    request_id: UUID
    event_type: str
    stage: Optional[str] = None
    source_system: Optional[str] = None
    actor: Optional[str] = None
    description: Optional[str] = None
    timestamp: datetime
    metadata_json: Optional[Dict[str, Any]] = {}


class EventResponse(BaseModel):
    id: UUID
    request_id: UUID
    event_type: str
    stage: Optional[str]
    source_system: Optional[str]
    actor: Optional[str]
    description: Optional[str]
    timestamp: datetime
    metadata_json: Optional[Dict[str, Any]]

    model_config = {"from_attributes": True}
