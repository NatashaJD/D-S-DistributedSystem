from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json

from app.database import get_db
from app.services.ai_copilot import run_copilot_query

router = APIRouter()


class CopilotQuery(BaseModel):
    question: str
    role: Optional[str] = "admin"


class CopilotResponse(BaseModel):
    question: str
    sql: Optional[str]
    result_type: str  # table | chart | text
    data: Optional[Any]
    summary: Optional[str]
    error: Optional[str] = None


@router.post("/query", response_model=CopilotResponse)
async def copilot_query(payload: CopilotQuery, db: Session = Depends(get_db)):
    try:
        result = await run_copilot_query(payload.question, payload.role, db)
        return CopilotResponse(**result)
    except Exception as e:
        return CopilotResponse(
            question=payload.question,
            sql=None,
            result_type="text",
            data=None,
            summary=None,
            error=str(e),
        )
