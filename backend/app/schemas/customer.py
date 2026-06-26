from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    region: str
    company: Optional[str] = None


class CustomerResponse(BaseModel):
    id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    region: str
    company: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
