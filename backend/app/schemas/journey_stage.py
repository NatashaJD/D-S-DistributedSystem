from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class JourneyStageResponse(BaseModel):
    id: UUID
    request_id: UUID
    stage_name: str
    department: str
    started_at: datetime
    completed_at: Optional[datetime]
    sla_deadline: Optional[datetime]
    status: str
    sla_percentage: Optional[float]
    assigned_to: Optional[str]

    model_config = {"from_attributes": True}
