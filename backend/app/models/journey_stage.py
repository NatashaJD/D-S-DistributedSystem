import uuid
from sqlalchemy import String, DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
from app.database import Base


class JourneyStage(Base):
    __tablename__ = "journey_stages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), ForeignKey("service_requests.id"), nullable=False)
    stage_name: Mapped[str] = mapped_column(String(50), nullable=False)
    department: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_deadline: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="in_progress")  # on_track, warning, breached, critical, completed
    sla_percentage: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    assigned_to: Mapped[str] = mapped_column(String(255), nullable=True)

    service_request = relationship("ServiceRequest", back_populates="journey_stages")
