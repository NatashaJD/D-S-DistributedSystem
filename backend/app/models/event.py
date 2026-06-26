import uuid
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid, JSON
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), ForeignKey("service_requests.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    stage: Mapped[str] = mapped_column(String(50), nullable=True)
    source_system: Mapped[str] = mapped_column(String(50), nullable=True)  # CRM, ERP, ENGINEERING, LOGISTICS, SYSTEM
    actor: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, nullable=True, default={})
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    service_request = relationship("ServiceRequest", back_populates="events")
