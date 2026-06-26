from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from app.schemas.customer import CustomerResponse
from app.schemas.event import EventResponse
from app.schemas.journey_stage import JourneyStageResponse


class ServiceRequestCreate(BaseModel):
    customer_id: UUID
    product_category: str
    priority: str = "medium"
    description: Optional[str] = None
    crm_reference: Optional[str] = None
    erp_reference: Optional[str] = None


class ServiceRequestResponse(BaseModel):
    id: UUID
    customer_id: UUID
    product_category: str
    priority: str
    current_stage: str
    assigned_department: Optional[str]
    status: str
    description: Optional[str]
    crm_reference: Optional[str]
    erp_reference: Optional[str]
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerResponse] = None
    sla_percentage: Optional[float] = None
    sla_status: Optional[str] = None

    model_config = {"from_attributes": True}


class ServiceRequestDetail(ServiceRequestResponse):
    events: List[EventResponse] = []
    journey_stages: List[JourneyStageResponse] = []
