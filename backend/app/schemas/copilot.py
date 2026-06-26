from pydantic import BaseModel
from typing import Optional, Any


class CopilotQueryRequest(BaseModel):
    question: str
    role: Optional[str] = "admin"


class CopilotQueryResponse(BaseModel):
    question: str
    sql: Optional[str]
    result_type: str
    data: Optional[Any]
    summary: Optional[str]
    error: Optional[str] = None
