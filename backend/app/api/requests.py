from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.service_request import ServiceRequest
from app.models.customer import Customer
from app.schemas.service_request import ServiceRequestResponse, ServiceRequestDetail, ServiceRequestCreate
from app.services.journey import reconstruct_journey, get_current_sla_info

router = APIRouter()


@router.get("", response_model=List[ServiceRequestResponse])
def list_requests(
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(ServiceRequest).options(joinedload(ServiceRequest.customer))

    if status:
        query = query.filter(ServiceRequest.status == status)
    if department:
        query = query.filter(ServiceRequest.assigned_department == department)
    if priority:
        query = query.filter(ServiceRequest.priority == priority)
    if stage:
        query = query.filter(ServiceRequest.current_stage == stage)
    if region:
        query = query.join(Customer).filter(Customer.region == region)
    if search:
        query = query.join(Customer).filter(
            Customer.name.ilike(f"%{search}%") |
            Customer.company.ilike(f"%{search}%") |
            ServiceRequest.crm_reference.ilike(f"%{search}%")
        )

    requests = query.order_by(ServiceRequest.updated_at.desc()).offset(offset).limit(limit).all()

    results = []
    for req in requests:
        sla_info = get_current_sla_info(req, db)
        req_data = ServiceRequestResponse.model_validate(req)
        req_data.sla_percentage = sla_info.get("percentage")
        req_data.sla_status = sla_info.get("status")
        results.append(req_data)

    return results


@router.get("/{request_id}", response_model=ServiceRequestDetail)
def get_request(request_id: UUID, db: Session = Depends(get_db)):
    req = (
        db.query(ServiceRequest)
        .options(
            joinedload(ServiceRequest.customer),
            joinedload(ServiceRequest.events),
            joinedload(ServiceRequest.journey_stages),
        )
        .filter(ServiceRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    journey = reconstruct_journey(req, db)
    sla_info = get_current_sla_info(req, db)

    result = ServiceRequestDetail.model_validate(req)
    result.sla_percentage = sla_info.get("percentage")
    result.sla_status = sla_info.get("status")
    return result


@router.post("", response_model=ServiceRequestResponse, status_code=201)
def create_request(payload: ServiceRequestCreate, db: Session = Depends(get_db)):
    req = ServiceRequest(**payload.model_dump())
    req.current_stage = "inquiry"
    req.assigned_department = "Sales"
    req.status = "in_progress"
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/{request_id}/journey")
def get_journey(request_id: UUID, db: Session = Depends(get_db)):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return reconstruct_journey(req, db)
