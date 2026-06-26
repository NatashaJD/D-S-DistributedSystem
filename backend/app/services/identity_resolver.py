from typing import Optional
from sqlalchemy.orm import Session
from app.models.service_request import ServiceRequest


def resolve_by_crm_id(crm_id: str, db: Session) -> Optional[ServiceRequest]:
    return db.query(ServiceRequest).filter(ServiceRequest.crm_reference == crm_id).first()


def resolve_by_erp_id(erp_id: str, db: Session) -> Optional[ServiceRequest]:
    return db.query(ServiceRequest).filter(ServiceRequest.erp_reference == erp_id).first()


def resolve_request(identifier: str, source_system: str, db: Session) -> Optional[ServiceRequest]:
    """Resolve a request ID from any source system."""
    if source_system.upper() == "CRM":
        return resolve_by_crm_id(identifier, db)
    if source_system.upper() == "ERP":
        return resolve_by_erp_id(identifier, db)
    # Fallback: try native UUID
    try:
        from uuid import UUID
        uid = UUID(identifier)
        return db.query(ServiceRequest).filter(ServiceRequest.id == uid).first()
    except ValueError:
        return None
