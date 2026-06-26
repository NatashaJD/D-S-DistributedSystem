import uuid
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
from app.database import Base


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), ForeignKey("customers.id"), nullable=False)
    product_category: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")  # low, medium, high, critical
    current_stage: Mapped[str] = mapped_column(String(50), nullable=False, default="inquiry")
    assigned_department: Mapped[str] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="in_progress")  # in_progress, completed, delayed, critical
    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    crm_reference: Mapped[str] = mapped_column(String(100), nullable=True)
    erp_reference: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="requests")
    events = relationship("Event", back_populates="service_request", order_by="Event.timestamp")
    journey_stages = relationship("JourneyStage", back_populates="service_request", order_by="JourneyStage.started_at")
