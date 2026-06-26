from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class KPIResponse(BaseModel):
    total_requests: int
    active_requests: int
    completed_requests: int
    sla_compliance_pct: float
    avg_resolution_hours: float
    active_breaches: int
    critical_delays: int
    requests_this_month: int


class DepartmentMetric(BaseModel):
    department: str
    total_stages: int
    completed_stages: int
    breached_stages: int
    avg_sla_percentage: float
    avg_processing_hours: float
    compliance_rate: float


class TrendPoint(BaseModel):
    period: str
    total: int
    completed: int
    breached: int
    compliance_rate: float


class RegionalMetric(BaseModel):
    region: str
    total_requests: int
    completed: int
    in_progress: int
    delayed: int
    avg_sla_pct: float


class StageMetric(BaseModel):
    stage: str
    avg_hours: float
    min_hours: float
    max_hours: float
    total_count: int


class HeatmapCell(BaseModel):
    department: str
    metric: str
    value: float
    level: int  # 0-4 intensity


class AnalyticsSummary(BaseModel):
    kpis: KPIResponse
    department_metrics: List[DepartmentMetric]
    trend_data: List[TrendPoint]
    regional_metrics: List[RegionalMetric]
    stage_metrics: List[StageMetric]


class HealthComponent(BaseModel):
    label: str
    score: float
    weight: float
    status: str  # good | warning | critical


class HealthScoreResponse(BaseModel):
    score: float
    grade: str       # A B C D F
    status: str      # healthy | caution | at_risk | critical
    trend: float     # delta vs last period estimate
    components: List[HealthComponent]


class CauseFactor(BaseModel):
    cause: str
    percentage: int


class BottleneckItem(BaseModel):
    department: str
    avg_sla_pct: float
    breach_rate: float
    severity: str    # critical | warning | normal
    factors: List[CauseFactor]


class Recommendation(BaseModel):
    priority: str      # critical | high | medium
    title: str
    insight: str
    action: str
    area: str
    metric: str


class FinancialKPIResponse(BaseModel):
    avg_contract_value_kes: int
    revenue_collected_kes: int          # completed requests × avg contract value
    revenue_at_risk_kes: int            # critical × full + breached × 50%
    sla_penalty_exposure_kes: int       # estimated penalties for all active breaches
    customer_churn_risk_count: int      # critical requests > 7 days old
    recoverable_revenue_kes: int        # at-risk that could be saved if recommendations acted on
    at_risk_pct: float                  # at_risk / collected %


class ForecastPoint(BaseModel):
    period: str
    actual_compliance: Optional[float] = None
    predicted_compliance: Optional[float] = None
    actual_total: Optional[int] = None
    predicted_total: Optional[int] = None


class ForecastResponse(BaseModel):
    next_30_days_compliance_pct: float
    next_30_days_breach_count: int
    trend_direction: str           # worsening | improving | stable
    trend_slope_per_month: float   # percentage points per month
    confidence: str                # low | medium | high
    risk_level: str                # low | medium | high | critical
    chart_data: List[ForecastPoint]
