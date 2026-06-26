from datetime import datetime, timedelta, timezone
from typing import Optional
import pytz

EAT = pytz.timezone("Africa/Nairobi")

# SLA definitions: stage -> total business hours allowed
SLA_CONFIG = {
    "inquiry":             {"hours": 4,   "department": "Sales"},
    "engineering_review":  {"hours": 16,  "department": "Engineering"},   # 2 business days = 16h (2×8h)
    "quotation":           {"hours": 8,   "department": "Quotations"},    # 1 business day = 8h
    "dispatch":            {"hours": 24,  "department": "Logistics"},     # 3 business days = 24h (3×8h)
}

BUSINESS_START = 8   # 08:00 EAT
BUSINESS_END = 17    # 17:00 EAT
WORK_HOURS_PER_DAY = BUSINESS_END - BUSINESS_START  # 9 hours


def _to_eat(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(EAT)


def _is_business_hour(dt_eat: datetime) -> bool:
    return dt_eat.weekday() < 5 and BUSINESS_START <= dt_eat.hour < BUSINESS_END


def _next_business_open(dt_eat: datetime) -> datetime:
    """Return the next moment business hours are open."""
    dt = dt_eat.replace(second=0, microsecond=0)
    # If inside business hours, return as-is
    if _is_business_hour(dt):
        return dt
    # After hours or weekend → advance to next business day start
    if dt.weekday() >= 5:
        days_until_monday = 7 - dt.weekday()
        dt = (dt + timedelta(days=days_until_monday)).replace(hour=BUSINESS_START, minute=0)
    elif dt.hour >= BUSINESS_END:
        dt = (dt + timedelta(days=1)).replace(hour=BUSINESS_START, minute=0)
        while dt.weekday() >= 5:
            dt += timedelta(days=1)
    elif dt.hour < BUSINESS_START:
        dt = dt.replace(hour=BUSINESS_START, minute=0)
    return dt


def add_business_hours(start: datetime, hours: float) -> datetime:
    """Add `hours` business hours to `start`, respecting Mon-Fri 08-17 EAT."""
    current = _to_eat(start)
    current = _next_business_open(current)
    remaining = hours

    while remaining > 0:
        # Minutes until end of business today
        end_of_day = current.replace(hour=BUSINESS_END, minute=0, second=0, microsecond=0)
        available_today = (end_of_day - current).total_seconds() / 3600.0

        if remaining <= available_today:
            current += timedelta(hours=remaining)
            remaining = 0
        else:
            remaining -= available_today
            # Jump to next business day start
            current = (current + timedelta(days=1)).replace(hour=BUSINESS_START, minute=0, second=0, microsecond=0)
            while current.weekday() >= 5:
                current += timedelta(days=1)

    return current.astimezone(pytz.utc)


def calc_business_hours_elapsed(start: datetime, end: Optional[datetime] = None) -> float:
    """Count business hours between start and end (or now)."""
    if end is None:
        end = datetime.now(timezone.utc)

    start_eat = _to_eat(start)
    end_eat = _to_eat(end)

    if end_eat <= start_eat:
        return 0.0

    current = _next_business_open(start_eat)
    elapsed = 0.0

    while current < end_eat:
        if _is_business_hour(current):
            next_end = current.replace(hour=BUSINESS_END, minute=0, second=0, microsecond=0)
            chunk_end = min(next_end, end_eat)
            elapsed += (chunk_end - current).total_seconds() / 3600.0
            # Jump to next business day
            current = (next_end + timedelta(days=1)).replace(hour=BUSINESS_START, minute=0, second=0, microsecond=0)
            while current.weekday() >= 5:
                current += timedelta(days=1)
        else:
            current = _next_business_open(current)

    return round(elapsed, 2)


def get_sla_status(stage: str, started_at: datetime, completed_at: Optional[datetime] = None) -> dict:
    """Return SLA status dict for a journey stage."""
    config = SLA_CONFIG.get(stage)
    if not config:
        return {"status": "unknown", "percentage": 0.0, "deadline": None}

    sla_hours = config["hours"]
    deadline = add_business_hours(started_at, sla_hours)
    elapsed = calc_business_hours_elapsed(started_at, completed_at)
    percentage = round((elapsed / sla_hours) * 100, 1) if sla_hours > 0 else 0.0

    if completed_at:
        status = "completed"
    elif percentage >= 150:
        status = "critical"
    elif percentage >= 100:
        status = "breached"
    elif percentage >= 75:
        status = "warning"
    else:
        status = "on_track"

    return {
        "status": status,
        "percentage": percentage,
        "deadline": deadline,
        "elapsed_hours": elapsed,
        "sla_hours": sla_hours,
        "department": config["department"],
    }
