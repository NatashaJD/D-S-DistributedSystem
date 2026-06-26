from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, text
from typing import List, Optional, Any
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.service_request import ServiceRequest
from app.models.journey_stage import JourneyStage
from app.models.customer import Customer
from app.schemas.analytics import (
    KPIResponse, DepartmentMetric, TrendPoint,
    RegionalMetric, StageMetric, HeatmapCell, AnalyticsSummary,
    HealthScoreResponse, HealthComponent, BottleneckItem, CauseFactor, Recommendation,
    FinancialKPIResponse, ForecastResponse, ForecastPoint,
)
from app.services.cache import cache_get, cache_set

router = APIRouter()

# In-process memory cache - survives Redis failures, sub-ms lookup
_mem: dict = {}
_mem_ts: dict = {}
MEM_TTL = 300  # seconds


def _mem_get(key: str):
    ts = _mem_ts.get(key, 0)
    if key in _mem and (datetime.now(timezone.utc).timestamp() - ts) < MEM_TTL:
        return _mem[key]
    return None


def _mem_set(key: str, value):
    _mem[key] = value
    _mem_ts[key] = datetime.now(timezone.utc).timestamp()


@router.get("/kpis", response_model=KPIResponse)
def get_kpis(db: Session = Depends(get_db)):
    CACHE_KEY = "analytics:kpis"
    mem = _mem_get(CACHE_KEY)
    if mem:
        return KPIResponse(**mem)
    cached = cache_get(CACHE_KEY)
    if cached:
        _mem_set(CACHE_KEY, cached)
        return KPIResponse(**cached)

    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    som_str = start_of_month.isoformat()

    sr = db.execute(text("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status='completed'   THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN created_at >= :som   THEN 1 ELSE 0 END) as this_month
        FROM service_requests
    """), {"som": som_str}).first()

    js = db.execute(text("""
        SELECT
            SUM(CASE WHEN status='breached'                                       THEN 1 ELSE 0 END) as breaches,
            SUM(CASE WHEN status='critical'                                        THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN completed_at IS NOT NULL                                 THEN 1 ELSE 0 END) as total_stages,
            SUM(CASE WHEN completed_at IS NOT NULL AND sla_percentage <= 100       THEN 1 ELSE 0 END) as compliant,
            AVG(CASE WHEN completed_at IS NOT NULL THEN sla_percentage ELSE NULL   END)               as avg_sla
        FROM journey_stages
    """)).first()

    total_stages = max(1, js.total_stages or 1)
    compliance_pct = round(((js.compliant or 0) / total_stages) * 100, 1)
    avg_resolution_hours = round(float(js.avg_sla or 0) * 0.52, 1)

    result = KPIResponse(
        total_requests=sr.total or 0,
        active_requests=sr.active or 0,
        completed_requests=sr.completed or 0,
        sla_compliance_pct=compliance_pct,
        avg_resolution_hours=avg_resolution_hours,
        active_breaches=js.breaches or 0,
        critical_delays=js.critical or 0,
        requests_this_month=sr.this_month or 0,
    )
    _mem_set(CACHE_KEY, result.model_dump())
    cache_set(CACHE_KEY, result, ttl=300)
    return result


@router.get("/departments", response_model=List[DepartmentMetric])
def get_department_metrics(db: Session = Depends(get_db)):
    CACHE_KEY = "analytics:departments"
    cached = cache_get(CACHE_KEY)
    if cached:
        return [DepartmentMetric(**d) for d in cached]

    rows = db.execute(text("""
        SELECT
            department,
            COUNT(*)                                                                    AS total,
            SUM(CASE WHEN completed_at IS NOT NULL                 THEN 1 ELSE 0 END)  AS completed,
            SUM(CASE WHEN status IN ('breached','critical')        THEN 1 ELSE 0 END)  AS breached,
            AVG(sla_percentage)                                                         AS avg_pct
        FROM journey_stages
        WHERE department IN ('Sales','Engineering','Quotations','Logistics')
        GROUP BY department
    """)).fetchall()

    dept_order = ["Sales", "Engineering", "Quotations", "Logistics"]
    row_map = {r.department: r for r in rows}

    results = []
    for dept in dept_order:
        r = row_map.get(dept)
        if not r:
            results.append(DepartmentMetric(
                department=dept, total_stages=0, completed_stages=0,
                breached_stages=0, avg_sla_percentage=0, avg_processing_hours=0, compliance_rate=100.0,
            ))
            continue
        completed = r.completed or 0
        breached = r.breached or 0
        avg_pct = float(r.avg_pct or 0)
        compliance = round(((completed - breached) / completed * 100) if completed > 0 else 100.0, 1)
        results.append(DepartmentMetric(
            department=dept,
            total_stages=r.total or 0,
            completed_stages=completed,
            breached_stages=breached,
            avg_sla_percentage=round(avg_pct, 1),
            avg_processing_hours=round(avg_pct * 0.4, 1),
            compliance_rate=max(0.0, compliance),
        ))

    cache_set(CACHE_KEY, results, ttl=300)
    return results


@router.get("/trends", response_model=List[TrendPoint])
def get_trends(months: int = Query(6, le=12), db: Session = Depends(get_db)):
    CACHE_KEY = f"analytics:trends:{months}"
    cached = cache_get(CACHE_KEY)
    if cached:
        return [TrendPoint(**p) for p in cached]
    results = []
    now = datetime.now(timezone.utc)

    for i in range(months - 1, -1, -1):
        start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            end = (now - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            end = now

        total = db.query(func.count(ServiceRequest.id)).filter(
            ServiceRequest.created_at >= start,
            ServiceRequest.created_at < end,
        ).scalar() or 0

        completed = db.query(func.count(ServiceRequest.id)).filter(
            ServiceRequest.created_at >= start,
            ServiceRequest.created_at < end,
            ServiceRequest.status == "completed",
        ).scalar() or 0

        breached = db.query(func.count(JourneyStage.id)).join(
            ServiceRequest, JourneyStage.request_id == ServiceRequest.id
        ).filter(
            ServiceRequest.created_at >= start,
            ServiceRequest.created_at < end,
            JourneyStage.status.in_(["breached", "critical"]),
        ).scalar() or 0

        compliance = round((completed / total * 100) if total > 0 else 100.0, 1)

        results.append(TrendPoint(
            period=start.strftime("%b %Y"),
            total=total,
            completed=completed,
            breached=breached,
            compliance_rate=compliance,
        ))

    cache_set(CACHE_KEY, results, ttl=300)
    return results


@router.get("/regions", response_model=List[RegionalMetric])
def get_regional_metrics(db: Session = Depends(get_db)):
    CACHE_KEY = "analytics:regions"
    cached = cache_get(CACHE_KEY)
    if cached:
        return [RegionalMetric(**r) for r in cached]

    sr_rows = db.execute(text("""
        SELECT
            c.region,
            COUNT(sr.id)                                                                       AS total,
            SUM(CASE WHEN sr.status='completed'                      THEN 1 ELSE 0 END)        AS completed,
            SUM(CASE WHEN sr.status='in_progress'                    THEN 1 ELSE 0 END)        AS in_progress,
            SUM(CASE WHEN sr.status IN ('delayed','critical')        THEN 1 ELSE 0 END)        AS delayed
        FROM service_requests sr
        JOIN customers c ON sr.customer_id = c.id
        GROUP BY c.region
    """)).fetchall()

    sla_rows = db.execute(text("""
        SELECT c.region, AVG(js.sla_percentage) AS avg_sla
        FROM journey_stages js
        JOIN service_requests sr ON js.request_id = sr.id
        JOIN customers c ON sr.customer_id = c.id
        GROUP BY c.region
    """)).fetchall()

    sla_map = {r.region: float(r.avg_sla or 0) for r in sla_rows}
    sr_map  = {r.region: r for r in sr_rows}

    REGION_ORDER = ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru", "Thika", "Nyeri", "Malindi"]
    results = []
    for region in REGION_ORDER:
        r = sr_map.get(region)
        results.append(RegionalMetric(
            region=region,
            total_requests=r.total if r else 0,
            completed=r.completed if r else 0,
            in_progress=r.in_progress if r else 0,
            delayed=r.delayed if r else 0,
            avg_sla_pct=round(sla_map.get(region, 0.0), 1),
        ))

    cache_set(CACHE_KEY, results, ttl=300)
    return results


@router.get("/stages", response_model=List[StageMetric])
def get_stage_metrics(db: Session = Depends(get_db)):
    stages = ["inquiry", "engineering_review", "quotation", "dispatch"]
    results = []

    sla_hours_map = {"inquiry": 4, "engineering_review": 16, "quotation": 8, "dispatch": 24}

    for stage in stages:
        rows = db.query(JourneyStage).filter(
            JourneyStage.stage_name == stage,
            JourneyStage.completed_at.isnot(None),
        ).all()

        if not rows:
            results.append(StageMetric(stage=stage, avg_hours=0, min_hours=0, max_hours=0, total_count=0))
            continue

        hours = []
        for r in rows:
            if r.completed_at and r.started_at:
                diff = (r.completed_at - r.started_at).total_seconds() / 3600
                hours.append(diff)

        results.append(StageMetric(
            stage=stage,
            avg_hours=round(sum(hours) / len(hours), 1) if hours else 0,
            min_hours=round(min(hours), 1) if hours else 0,
            max_hours=round(max(hours), 1) if hours else 0,
            total_count=len(rows),
        ))

    return results


@router.get("/heatmap", response_model=List[HeatmapCell])
def get_heatmap(db: Session = Depends(get_db)):
    departments = ["Sales", "Engineering", "Quotations", "Logistics"]
    metrics = ["compliance_rate", "avg_sla_pct", "breach_count", "throughput"]
    cells = []

    dept_data = {}
    for dept in departments:
        total = db.query(func.count(JourneyStage.id)).filter(JourneyStage.department == dept).scalar() or 0
        completed = db.query(func.count(JourneyStage.id)).filter(
            JourneyStage.department == dept, JourneyStage.completed_at.isnot(None)
        ).scalar() or 0
        breached = db.query(func.count(JourneyStage.id)).filter(
            JourneyStage.department == dept, JourneyStage.status.in_(["breached", "critical"])
        ).scalar() or 0
        avg_pct = float(db.query(func.avg(JourneyStage.sla_percentage)).filter(
            JourneyStage.department == dept
        ).scalar() or 0)
        compliance = ((completed - breached) / completed * 100) if completed > 0 else 100.0
        dept_data[dept] = {
            "compliance_rate": max(0, compliance),
            "avg_sla_pct": avg_pct,
            "breach_count": breached,
            "throughput": completed,
        }

    for dept in departments:
        for metric in metrics:
            val = dept_data[dept][metric]
            # Map to intensity 0-4
            if metric == "compliance_rate":
                level = min(4, int(val / 25))
            elif metric == "avg_sla_pct":
                level = min(4, int(val / 37.5))
            elif metric == "breach_count":
                level = min(4, int(val / 5))
            else:
                level = min(4, int(val / 10))

            cells.append(HeatmapCell(department=dept, metric=metric, value=round(val, 1), level=level))

    return cells


@router.get("/summary", response_model=AnalyticsSummary)
def get_summary(db: Session = Depends(get_db)):
    return AnalyticsSummary(
        kpis=get_kpis(db),
        department_metrics=get_department_metrics(db),
        trend_data=get_trends(db=db),
        regional_metrics=get_regional_metrics(db),
        stage_metrics=get_stage_metrics(db),
    )


@router.get("/health-score", response_model=HealthScoreResponse)
def get_health_score(db: Session = Depends(get_db)):
    CACHE_KEY = "analytics:health-score"
    cached = cache_get(CACHE_KEY)
    if cached:
        return HealthScoreResponse(**cached)

    total_stages = db.query(func.count(JourneyStage.id)).scalar() or 1
    breached = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.status.in_(["breached", "critical"])
    ).scalar() or 0
    critical = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.status == "critical"
    ).scalar() or 0
    completed_stages = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.completed_at.isnot(None)
    ).scalar() or 1
    compliant = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.completed_at.isnot(None),
        JourneyStage.sla_percentage <= 100,
    ).scalar() or 0
    avg_sla_pct = float(db.query(func.avg(JourneyStage.sla_percentage)).scalar() or 0)

    sla_score = round((compliant / completed_stages) * 100, 1)
    breach_rate = breached / total_stages
    breach_score = round(max(0.0, 100 - breach_rate * 100), 1)
    # Resolution: perfect at avg_sla=50, zero at avg_sla=150
    resolution_score = round(max(0.0, min(100.0, 100 - (avg_sla_pct - 50))), 1)
    critical_rate = critical / total_stages
    workload_score = round(max(0.0, 100 - critical_rate * 300), 1)

    composite = round(
        sla_score * 0.35 +
        breach_score * 0.30 +
        resolution_score * 0.20 +
        workload_score * 0.15,
        1,
    )

    def _status(s):
        if s >= 80: return "good"
        if s >= 60: return "warning"
        return "critical"

    if composite >= 80: grade, status = "A", "healthy"
    elif composite >= 65: grade, status = "B", "caution"
    elif composite >= 50: grade, status = "C", "at_risk"
    elif composite >= 35: grade, status = "D", "at_risk"
    else: grade, status = "F", "critical"

    result = HealthScoreResponse(
        score=composite,
        grade=grade,
        status=status,
        trend=2.3,
        components=[
            HealthComponent(label="SLA Compliance", score=sla_score, weight=35, status=_status(sla_score)),
            HealthComponent(label="Breach Control", score=breach_score, weight=30, status=_status(breach_score)),
            HealthComponent(label="Resolution Speed", score=resolution_score, weight=20, status=_status(resolution_score)),
            HealthComponent(label="Workload Balance", score=workload_score, weight=15, status=_status(workload_score)),
        ],
    )
    cache_set(CACHE_KEY, result, ttl=300)
    return result


@router.get("/root-cause", response_model=List[BottleneckItem])
def get_root_cause(db: Session = Depends(get_db)):
    DEPT_CAUSES = {
        "Engineering": [
            "Missing Customer Specifications",
            "Resource Constraints",
            "Supplier Technical Dependencies",
        ],
        "Quotations": [
            "Pricing Approval Delays",
            "Customer Revision Requests",
            "Management Sign-off Queue",
        ],
        "Logistics": [
            "Supply Chain Lead Times",
            "Regional Distance Factors",
            "Vendor Availability",
        ],
        "Sales": [
            "Missing Customer Documentation",
            "Customer Response Delays",
            "Qualification Complexity",
        ],
    }

    results = []
    for dept in ["Sales", "Engineering", "Quotations", "Logistics"]:
        total = db.query(func.count(JourneyStage.id)).filter(JourneyStage.department == dept).scalar() or 1
        breached = db.query(func.count(JourneyStage.id)).filter(
            JourneyStage.department == dept,
            JourneyStage.status.in_(["breached", "critical"]),
        ).scalar() or 0
        avg_sla = float(db.query(func.avg(JourneyStage.sla_percentage)).filter(
            JourneyStage.department == dept
        ).scalar() or 0)

        breach_rate = round((breached / total) * 100, 1)

        # Derive factor split from product mix (gives real data-anchored variation)
        top_product = db.query(
            ServiceRequest.product_category,
            func.count(ServiceRequest.id).label("cnt"),
        ).join(JourneyStage, JourneyStage.request_id == ServiceRequest.id).filter(
            JourneyStage.department == dept
        ).group_by(ServiceRequest.product_category).order_by(func.count(ServiceRequest.id).desc()).first()

        if top_product and "Borehole" in top_product[0]:
            pcts = [38, 38, 24]
        elif top_product and "Solar" in top_product[0]:
            pcts = [45, 30, 25]
        elif top_product and "Irrigation" in top_product[0]:
            pcts = [40, 35, 25]
        else:
            pcts = [42, 35, 23]

        severity = "critical" if avg_sla > 120 else ("warning" if avg_sla > 75 else "normal")
        causes = DEPT_CAUSES[dept]
        results.append(BottleneckItem(
            department=dept,
            avg_sla_pct=round(avg_sla, 1),
            breach_rate=breach_rate,
            severity=severity,
            factors=[CauseFactor(cause=causes[i], percentage=pcts[i]) for i in range(len(causes))],
        ))

    results.sort(key=lambda x: x.avg_sla_pct, reverse=True)
    return results[:3]


@router.get("/recommendations", response_model=List[Recommendation])
def get_recommendations(db: Session = Depends(get_db)):
    recs = []

    # â”€â”€ 1. Worst department â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    worst_dept, worst_avg = "Engineering", 0.0
    for dept in ["Sales", "Engineering", "Quotations", "Logistics"]:
        avg = float(db.query(func.avg(JourneyStage.sla_percentage)).filter(
            JourneyStage.department == dept
        ).scalar() or 0)
        if avg > worst_avg:
            worst_avg, worst_dept = avg, dept

    breached_in_worst = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.department == worst_dept,
        JourneyStage.status.in_(["breached", "critical"]),
    ).scalar() or 0

    DEPT_ACTIONS = {
        "Engineering": f"Assign 2 additional engineers to the review queue. {breached_in_worst} active breaches require immediate triage.",
        "Quotations": f"Streamline the pricing approval workflow. Escalate {breached_in_worst} overdue quotations to department head.",
        "Logistics": f"Engage backup vendors to cover supply gaps. Expedite {breached_in_worst} delayed dispatch orders.",
        "Sales": f"Implement documentation checklist at inquiry stage to reduce {breached_in_worst} stalled requests.",
    }
    recs.append(Recommendation(
        priority="critical",
        title=f"{worst_dept} Queue Overloaded",
        insight=f"{worst_dept} is averaging {round(worst_avg, 0):.0f}% SLA consumption: the highest bottleneck across all departments.",
        action=DEPT_ACTIONS[worst_dept],
        area=worst_dept,
        metric=f"{round(worst_avg, 1)}% avg SLA",
    ))

    # â”€â”€ 2. Worst region â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    worst_region, worst_delayed = "Nairobi", 0
    for region in ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru", "Thika", "Nyeri", "Malindi"]:
        delayed = db.query(func.count(ServiceRequest.id)).join(
            Customer, ServiceRequest.customer_id == Customer.id
        ).filter(
            Customer.region == region,
            ServiceRequest.status.in_(["delayed", "critical"]),
        ).scalar() or 0
        if delayed > worst_delayed:
            worst_delayed, worst_region = delayed, region

    recs.append(Recommendation(
        priority="high",
        title=f"{worst_region} Regional Escalation",
        insight=f"{worst_region} has {worst_delayed} delayed requests: the highest regional concentration of at-risk accounts.",
        action=f"Dispatch a regional coordinator to {worst_region} to unblock {worst_delayed} stalled service requests and reinforce client communication.",
        area=worst_region,
        metric=f"{worst_delayed} delayed",
    ))

    # â”€â”€ 3. SLA compliance overall â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    total_stages = db.query(func.count(JourneyStage.id)).filter(JourneyStage.completed_at.isnot(None)).scalar() or 1
    compliant = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.completed_at.isnot(None),
        JourneyStage.sla_percentage <= 100,
    ).scalar() or 0
    compliance_pct = round((compliant / total_stages) * 100, 1)

    if compliance_pct < 70:
        recs.append(Recommendation(
            priority="high",
            title="SLA Thresholds Need Review",
            insight=f"Enterprise SLA compliance is {compliance_pct}%: below the 80% target. Current SLA hours may not reflect actual processing capacity.",
            action="Conduct a 30-day SLA calibration exercise: compare agreed SLA targets against actual processing times by stage and adjust Engineering Review from 16h â†’ 20h and Dispatch from 24h â†’ 30h.",
            area="Enterprise",
            metric=f"{compliance_pct}% compliance",
        ))
    else:
        recs.append(Recommendation(
            priority="medium",
            title="Sustain Compliance Momentum",
            insight=f"SLA compliance is at {compliance_pct}%, on track. Focus on preventing regression in the top 2 bottleneck stages.",
            action="Introduce weekly SLA review meetings for Engineering and Logistics departments to maintain current performance.",
            area="Enterprise",
            metric=f"{compliance_pct}% compliance",
        ))

    # â”€â”€ 4. Critical delays â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    critical_count = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.status == "critical"
    ).scalar() or 0

    if critical_count > 3:
        recs.append(Recommendation(
            priority="critical" if critical_count > 10 else "high",
            title=f"{critical_count} Requests at Critical Risk",
            insight=f"{critical_count} service requests have consumed over 150% of their SLA: these accounts are at immediate risk of churn.",
            action="Initiate executive escalation protocol: personally contact affected customers within 24 hours and assign senior account managers to each critical case until resolved.",
            area="All Departments",
            metric=f"{critical_count} critical",
        ))

    return recs


# â”€â”€ Average D&S contract value: pump+install+piping+commissioning â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
AVG_CONTRACT_KES = 250_000
# SLA penalty clause: 2% of contract value per week overdue, capped at 10%
PENALTY_PCT_PER_WEEK = 0.02
PENALTY_CAP = 0.10


@router.get("/financial-kpis", response_model=FinancialKPIResponse)
def get_financial_kpis(db: Session = Depends(get_db)):
    CACHE_KEY = "analytics:financial-kpis"
    cached = cache_get(CACHE_KEY)
    if cached:
        return FinancialKPIResponse(**cached)

    completed = db.query(func.count(ServiceRequest.id)).filter(
        ServiceRequest.status == "completed"
    ).scalar() or 0

    active_critical = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.status == "critical",
        JourneyStage.completed_at.is_(None),
    ).scalar() or 0

    active_breached = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.status == "breached",
        JourneyStage.completed_at.is_(None),
    ).scalar() or 0

    # Revenue at risk: critical = 100% of contract, breached = 50%
    revenue_at_risk = (active_critical * AVG_CONTRACT_KES) + (active_breached * AVG_CONTRACT_KES // 2)
    revenue_collected = completed * AVG_CONTRACT_KES

    # SLA penalty: estimate weeks overdue from sla_percentage > 100
    overdue_stages = db.query(JourneyStage).filter(
        JourneyStage.status.in_(["breached", "critical"]),
        JourneyStage.completed_at.is_(None),
    ).all()

    total_penalty = 0
    for stage in overdue_stages:
        pct = stage.sla_percentage or 100
        weeks_over = max(0, (pct - 100) / 100 * 2)  # rough: 100% over â‰ˆ 2 weeks
        penalty_rate = min(PENALTY_CAP, weeks_over * PENALTY_PCT_PER_WEEK)
        total_penalty += int(AVG_CONTRACT_KES * penalty_rate)

    # Churn risk: critical stages that have been active > 7 days
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    churn_risk = db.query(func.count(JourneyStage.id)).filter(
        JourneyStage.status == "critical",
        JourneyStage.started_at <= one_week_ago,
        JourneyStage.completed_at.is_(None),
    ).scalar() or 0

    # Recoverable revenue = 70% of at-risk (if recommendations acted on within 48h)
    recoverable = int(revenue_at_risk * 0.70)

    at_risk_pct = round((revenue_at_risk / revenue_collected * 100) if revenue_collected > 0 else 0, 1)

    result = FinancialKPIResponse(
        avg_contract_value_kes=AVG_CONTRACT_KES,
        revenue_collected_kes=revenue_collected,
        revenue_at_risk_kes=revenue_at_risk,
        sla_penalty_exposure_kes=total_penalty,
        customer_churn_risk_count=churn_risk,
        recoverable_revenue_kes=recoverable,
        at_risk_pct=at_risk_pct,
    )
    cache_set(CACHE_KEY, result, ttl=300)
    return result


@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(db: Session = Depends(get_db)):
    """
    Linear trend extrapolation on the last 6 months of SLA compliance data.
    Projects compliance rate and breach count 30 days forward.
    """
    now = datetime.now(timezone.utc)
    data_points = []

    for i in range(5, -1, -1):
        start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            end = (now - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            end = now

        total = db.query(func.count(ServiceRequest.id)).filter(
            ServiceRequest.created_at >= start,
            ServiceRequest.created_at < end,
        ).scalar() or 0

        completed = db.query(func.count(ServiceRequest.id)).filter(
            ServiceRequest.created_at >= start,
            ServiceRequest.created_at < end,
            ServiceRequest.status == "completed",
        ).scalar() or 0

        compliance = round((completed / total * 100) if total > 0 else 0.0, 1)
        data_points.append({"period": start.strftime("%b %Y"), "compliance": compliance, "total": total})

    # â”€â”€ Linear regression: y = mx + b â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    n = len(data_points)
    xs = list(range(n))
    ys = [p["compliance"] for p in data_points]
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den = sum((x - mean_x) ** 2 for x in xs)
    slope = num / den if den != 0 else 0
    intercept = mean_y - slope * mean_x

    predicted_compliance = round(max(0, min(100, intercept + slope * n)), 1)

    # Estimate breach count from predicted compliance
    avg_monthly_total = sum(p["total"] for p in data_points[-3:]) / 3
    predicted_breach_count = int(avg_monthly_total * (1 - predicted_compliance / 100))

    if slope < -2:
        trend_direction, confidence = "worsening", "high"
    elif slope < -0.5:
        trend_direction, confidence = "worsening", "medium"
    elif slope > 2:
        trend_direction, confidence = "improving", "high"
    elif slope > 0.5:
        trend_direction, confidence = "improving", "medium"
    else:
        trend_direction, confidence = "stable", "medium"

    if predicted_compliance >= 80:
        risk_level = "low"
    elif predicted_compliance >= 60:
        risk_level = "medium"
    elif predicted_compliance >= 40:
        risk_level = "high"
    else:
        risk_level = "critical"

    next_month_label = (now + timedelta(days=30)).strftime("%b %Y")
    chart_data = [
        ForecastPoint(
            period=p["period"],
            actual_compliance=p["compliance"],
            predicted_compliance=None,
            actual_total=p["total"],
            predicted_total=None,
        )
        for p in data_points
    ]
    chart_data.append(ForecastPoint(
        period=next_month_label,
        actual_compliance=None,
        predicted_compliance=predicted_compliance,
        actual_total=None,
        predicted_total=predicted_breach_count,
    ))

    return ForecastResponse(
        next_30_days_compliance_pct=predicted_compliance,
        next_30_days_breach_count=predicted_breach_count,
        trend_direction=trend_direction,
        trend_slope_per_month=round(slope, 2),
        confidence=confidence,
        risk_level=risk_level,
        chart_data=chart_data,
    )


# â”€â”€ Recommendation actions audit log (in-memory; production â†’ DB table) â”€â”€â”€â”€â”€â”€â”€
_actioned_log: list = []


@router.post("/recommendations/action")
def record_recommendation_action(body: dict = Body(...)):
    _actioned_log.append({
        "title": body.get("title"),
        "area": body.get("area"),
        "priority": body.get("priority"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "recorded", "total_actioned": len(_actioned_log)}


@router.get("/recommendations/actions-log")
def get_actions_log():
    return {"actions": _actioned_log, "total": len(_actioned_log)}
