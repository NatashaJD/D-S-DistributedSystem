import uuid
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    requests = relationship("ServiceRequest", back_populates="customer", lazy="dynamic")
