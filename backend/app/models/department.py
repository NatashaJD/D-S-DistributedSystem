import uuid
from sqlalchemy import String, Integer, Float, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    head: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SLAConfig(Base):
    __tablename__ = "sla_configs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=uuid.uuid4)
    stage_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    department: Mapped[str] = mapped_column(String(50), nullable=False)
    sla_hours: Mapped[float] = mapped_column(Float, nullable=False)  # total business hours allowed
    business_start_hour: Mapped[int] = mapped_column(Integer, default=8)   # 08:00
    business_end_hour: Mapped[int] = mapped_column(Integer, default=17)    # 17:00
    business_days: Mapped[str] = mapped_column(String(50), default="0,1,2,3,4")  # Mon-Fri as comma-separated ints
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
