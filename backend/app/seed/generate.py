"""
Intentional demo data generator for Dayliff 1000 Eyes.
Designed to showcase every system capability for executive demos.

Scenarios encoded:
  - Nairobi regional dominance (40% of requests) → triggers regional recommendations
  - Engineering clear bottleneck (avg SLA ~135%) → triggers root cause + recommendation
  - Active crisis cluster (20 critical requests) → triggers executive escalation
  - Healthy baseline (35% on-time) → shows normal ops alongside crisis
  - 6-month trend: improvement → plateau → degradation (tells a story)
  - All product categories, priorities, and stages represented
  - All 8 regions present
  - All 4 journey stages visible (inquiry, engineering_review, quotation, dispatch)
"""
import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import List

import pytz

EAT = pytz.timezone("Africa/Nairobi")

# ── Reference Data ────────────────────────────────────────────────────────────

REGIONS = ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru", "Thika", "Nyeri", "Malindi"]
# Nairobi dominant — clearly overloaded vs others
REGION_WEIGHTS = [40, 18, 13, 9, 8, 5, 4, 3]

PRODUCT_CATEGORIES = [
    "Water Pumps", "Solar Panels", "Water Tanks",
    "Irrigation Systems", "Borehole Solutions",
]
PRODUCT_WEIGHTS = [28, 25, 20, 15, 12]

PRIORITIES = ["low", "medium", "high", "critical"]
# More high/critical to show urgency in demos
PRIORITY_WEIGHTS = [8, 38, 37, 17]

FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Wanjiru", "Kamau",
    "Otieno", "Akinyi", "Mwangi", "Njeri", "Kipchoge", "Chebet", "Odhiambo", "Adhiambo",
    "Kariuki", "Wambui", "Mutua", "Mwende", "Ochieng", "Awino", "Gitau", "Wanjiku",
]
LAST_NAMES = [
    "Wanjiru", "Kamau", "Otieno", "Mwangi", "Kariuki", "Mutua", "Ochieng", "Gitau",
    "Njoroge", "Kimani", "Omondi", "Achieng", "Korir", "Bett", "Cheruiyot", "Sang",
    "Munene", "Gatheru", "Muriuki", "Ndegwa", "Nyambura", "Wairimu", "Gacheru", "Njenga",
]
COMPANIES = [
    "Safaricom PLC", "KCB Bank", "Equity Bank", "Kenya Power", "East African Breweries",
    "Bamburi Cement", "Nation Media Group", "Centum Investment", "Stanbic Bank",
    "Co-operative Bank", "ABSA Bank", "Standard Chartered", "TotalEnergies Kenya",
    "Vivo Energy Kenya", "Bidco Africa", "Chandaria Industries", "Nairobi Hospital",
    "Aga Khan Hospital", "Kenya Red Cross", "Kenya Airways", "Mombasa Cement",
    "Africa Eco Tours", "Kwale International Sugar", "Bamburi Beach Hotel",
    None, None, None,  # individual customers
]

SALES_STAFF = [
    "Alice Wanjiku", "Brian Kamau", "Caroline Otieno", "Dennis Mwangi",
    "Esther Kariuki", "Felix Odhiambo", "Grace Njeri", "Henry Mutua",
]
ENGINEERING_STAFF = [
    "Ian Githinji", "Joyce Akinyi", "Kevin Njoroge", "Lilian Chebet",
    "Michael Omondi", "Nancy Korir", "Oscar Bett", "Priscilla Sang",
]
QUOTATION_STAFF = [
    "Quentin Muriuki", "Rose Ndegwa", "Samuel Nyambura", "Teresa Wairimu",
    "Uriel Gacheru", "Violet Njenga", "Walter Mugo", "Xenia Waweru",
]
LOGISTICS_STAFF = [
    "Yasmin Muthoni", "Zachary Kimani", "Abby Atieno", "Bernard Mbugua",
    "Caroline Nyokabi", "Daniel Maina", "Eva Chelangat", "Francis Ouma",
]

STAGE_CONFIG = {
    "inquiry":            {"sla_hours": 4,  "department": "Sales",       "staff": SALES_STAFF},
    "engineering_review": {"sla_hours": 16, "department": "Engineering", "staff": ENGINEERING_STAFF},
    "quotation":          {"sla_hours": 8,  "department": "Quotations",  "staff": QUOTATION_STAFF},
    "dispatch":           {"sla_hours": 24, "department": "Logistics",   "staff": LOGISTICS_STAFF},
}

STAGES_SEQUENCE = ["inquiry", "engineering_review", "quotation", "dispatch", "delivered"]

# SLA multiplier ranges by department — Engineering deliberately worst
DEPT_SLA_RANGES = {
    "Sales":       (0.35, 0.95),   # Fastest: 35-95% SLA consumption
    "Engineering": (0.80, 2.20),   # Bottleneck: 80-220% (many breaches)
    "Quotations":  (0.55, 1.45),   # Moderate: some breaches
    "Logistics":   (0.65, 1.60),   # Some delays, mostly manageable
}

EVENT_TEMPLATES = {
    "inquiry": [
        ("inquiry_received",  "Customer inquiry received via CRM portal",         "CRM"),
        ("assigned_to_sales", "Request assigned to sales engineer",               "CRM"),
        ("site_assessment",   "Initial site assessment scheduled",                "ENGINEERING"),
        ("customer_followup", "Customer follow-up call completed",                "CRM"),
    ],
    "engineering_review": [
        ("engineering_started",   "Engineering review commenced",                       "ENGINEERING"),
        ("site_visit_completed",  "Site visit completed and report submitted",           "ENGINEERING"),
        ("design_in_progress",    "Technical design drawings in progress",              "ENGINEERING"),
        ("design_approved",       "Technical design approved by lead engineer",         "ENGINEERING"),
        ("specs_sent_to_supplier","Equipment specifications sent to supplier",          "ERP"),
        ("supplier_delay_noted",  "Supplier lead time delay flagged — awaiting ETA",   "ENGINEERING"),
    ],
    "quotation": [
        ("quotation_prepared",   "Quotation document prepared",                    "ERP"),
        ("quotation_sent",       "Quotation sent to customer for review",          "CRM"),
        ("customer_queried",     "Customer requested pricing clarification",       "CRM"),
        ("revised_quotation",    "Revised quotation submitted after negotiations", "ERP"),
        ("quotation_approved",   "Customer approved the quotation",               "CRM"),
        ("lpo_received",         "Local Purchase Order received from customer",   "ERP"),
    ],
    "dispatch": [
        ("order_placed",         "Equipment order placed with warehouse",          "ERP"),
        ("goods_inspected",      "Quality inspection completed at warehouse",      "LOGISTICS"),
        ("goods_dispatched",     "Goods dispatched from Nairobi warehouse",        "LOGISTICS"),
        ("in_transit",           "Delivery in transit to customer site",           "LOGISTICS"),
        ("customs_clearance",    "Customs clearance completed for imported items", "LOGISTICS"),
        ("delivered",            "Goods delivered and signed for",                 "LOGISTICS"),
        ("installation_done",    "Installation completed by certified technician", "ENGINEERING"),
        ("customer_signoff",     "Customer signed commissioning acceptance form",  "CRM"),
    ],
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def random_eat_datetime(start: datetime, end: datetime) -> datetime:
    delta = end - start
    total_secs = max(0, int(delta.total_seconds()))
    offset = timedelta(seconds=random.randint(0, total_secs))
    dt = start + offset
    dt_eat = dt.astimezone(EAT)
    if dt_eat.weekday() >= 5:
        dt_eat += timedelta(days=(7 - dt_eat.weekday()))
    dt_eat = dt_eat.replace(hour=random.randint(8, 16), minute=random.randint(0, 59))
    return dt_eat.astimezone(pytz.utc)


def add_biz_hours(start: datetime, hours: float) -> datetime:
    from app.services.sla_engine import add_business_hours
    return add_business_hours(start, hours)


def sla_pct_for_dept(dept: str, scenario: str) -> float:
    """Return realistic SLA percentage biased by department and scenario."""
    lo, hi = DEPT_SLA_RANGES[dept]
    if scenario == "critical":
        lo = max(lo, 1.5)
        hi = max(hi, 2.2)
    elif scenario == "delayed":
        lo = max(lo, 1.05)
        hi = max(hi, 1.6)
    elif scenario == "on_track":
        hi = min(hi, 0.90)
    elif scenario == "warning":
        lo = max(lo, 0.72)
        hi = min(hi, 1.05)
    return round(random.uniform(lo, hi) * 100, 1)


# ── Department & SLA Config Generators ───────────────────────────────────────

def generate_departments() -> List[dict]:
    return [
        {"id": str(uuid.uuid4()), "name": "Sales",       "display_name": "Sales & CRM",              "head": "Alice Wanjiku"},
        {"id": str(uuid.uuid4()), "name": "Engineering", "display_name": "Engineering & Design",      "head": "Ian Githinji"},
        {"id": str(uuid.uuid4()), "name": "Quotations",  "display_name": "Quotations & Approval",     "head": "Quentin Muriuki"},
        {"id": str(uuid.uuid4()), "name": "Logistics",   "display_name": "Dispatch & Logistics",      "head": "Yasmin Muthoni"},
    ]


def generate_sla_configs() -> List[dict]:
    return [
        {"id": str(uuid.uuid4()), "stage_name": "inquiry",            "department": "Sales",       "sla_hours": 4,  "business_start_hour": 8, "business_end_hour": 17, "business_days": "0,1,2,3,4", "is_active": True},
        {"id": str(uuid.uuid4()), "stage_name": "engineering_review",  "department": "Engineering", "sla_hours": 16, "business_start_hour": 8, "business_end_hour": 17, "business_days": "0,1,2,3,4", "is_active": True},
        {"id": str(uuid.uuid4()), "stage_name": "quotation",           "department": "Quotations",  "sla_hours": 8,  "business_start_hour": 8, "business_end_hour": 17, "business_days": "0,1,2,3,4", "is_active": True},
        {"id": str(uuid.uuid4()), "stage_name": "dispatch",            "department": "Logistics",   "sla_hours": 24, "business_start_hour": 8, "business_end_hour": 17, "business_days": "0,1,2,3,4", "is_active": True},
    ]


# ── Customer Generator ────────────────────────────────────────────────────────

def generate_customers(n: int = 75) -> List[dict]:
    """Ensure every region has at least some customers."""
    customers = []
    # Guarantee every region has customers
    for region in REGIONS:
        for _ in range(3):
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            company = random.choice(COMPANIES)
            customers.append({
                "id": str(uuid.uuid4()),
                "name": f"{fn} {ln}",
                "email": f"{fn.lower()}.{ln.lower()}@{'gmail.com' if not company else company.replace(' ','').lower()[:10]+'.co.ke'}",
                "phone": f"+2547{random.randint(10000000, 99999999)}",
                "region": region,
                "company": company,
            })
    # Remaining — region-weighted (heavy on Nairobi)
    remaining = n - len(customers)
    for _ in range(remaining):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        region = random.choices(REGIONS, weights=REGION_WEIGHTS)[0]
        company = random.choice(COMPANIES)
        customers.append({
            "id": str(uuid.uuid4()),
            "name": f"{fn} {ln}",
            "email": f"{fn.lower()}.{ln.lower()}@{'gmail.com' if not company else company.replace(' ','').lower()[:10]+'.co.ke'}",
            "phone": f"+2547{random.randint(10000000, 99999999)}",
            "region": region,
            "company": company,
        })
    return customers


# ── Request Generator ─────────────────────────────────────────────────────────

def _build_trend_timestamps(total: int, now: datetime) -> List[datetime]:
    """
    Spread requests across 6 months with intentional trend shape:
    months -6 to -4: low volume, improving
    months -3 to -2: growing, compliance starting to slip
    months -1 to now: high volume crisis
    """
    six_months_ago = now - timedelta(days=182)
    timestamps = []

    # Month volume weights (older → newer)
    month_weights = [8, 10, 13, 18, 22, 29]  # accelerating
    total_weight = sum(month_weights)

    for m_idx, w in enumerate(month_weights):
        n = int(total * w / total_weight)
        start = six_months_ago + timedelta(days=30 * m_idx)
        end = start + timedelta(days=30)
        end = min(end, now - timedelta(days=1))
        for _ in range(n):
            timestamps.append(random_eat_datetime(start, end))

    # Fill any remainder into last month
    while len(timestamps) < total:
        start = now - timedelta(days=30)
        timestamps.append(random_eat_datetime(start, now - timedelta(days=1)))

    random.shuffle(timestamps)
    return timestamps[:total]


def generate_requests_and_journeys(customers: List[dict], total: int = 300):
    """
    Returns (requests, journey_stages, events).

    Scenario distribution:
      25% completed on-time (healthy baseline)
      10% completed but breached (historical failures)
      20% in_progress on-track (normal pipeline)
      15% in_progress warning zone (approaching breach)
      15% breached (active breach, needs attention)
      15% critical (150%+ SLA — executive escalation needed)
    """
    now = datetime.now(timezone.utc)

    requests = []
    journey_stages = []
    events = []

    # Build scenario pool
    scenario_pool = (
        [("completed",   "on_time")]   * int(total * 0.25) +
        [("completed",   "breached")]  * int(total * 0.10) +
        [("in_progress", "on_track")]  * int(total * 0.20) +
        [("in_progress", "warning")]   * int(total * 0.15) +
        [("delayed",     "breached")]  * int(total * 0.15) +
        [("critical",    "critical")]  * int(total * 0.15)
    )
    # Pad to exact total
    while len(scenario_pool) < total:
        scenario_pool.append(("in_progress", "on_track"))
    scenario_pool = scenario_pool[:total]
    random.shuffle(scenario_pool)

    timestamps = _build_trend_timestamps(total, now)

    # Build customer lookup grouped by region for region-weighted selection
    nairobi_customers = [c for c in customers if c["region"] == "Nairobi"]
    other_customers = [c for c in customers if c["region"] != "Nairobi"]

    for idx in range(total):
        # Weight Nairobi customers more heavily
        if random.random() < 0.40:
            customer = random.choice(nairobi_customers) if nairobi_customers else random.choice(customers)
        else:
            customer = random.choices(customers, weights=None)[0]

        req_status, scenario = scenario_pool[idx]
        priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
        # Critical scenarios get high/critical priority
        if scenario == "critical":
            priority = random.choices(["high", "critical"], weights=[40, 60])[0]
        elif scenario == "breached":
            priority = random.choices(["medium", "high", "critical"], weights=[20, 50, 30])[0]

        product = random.choices(PRODUCT_CATEGORIES, weights=PRODUCT_WEIGHTS)[0]
        created_at = timestamps[idx]

        req_id = str(uuid.uuid4())
        crm_ref = f"CRM-{2024000 + idx + 1}"
        erp_ref = f"ERP-{5000 + idx + 1}"

        # Determine journey depth
        if req_status == "completed":
            stages_to_traverse = STAGES_SEQUENCE[:4]   # all 4 active stages
            terminal_stage = "delivered"
        elif scenario in ("critical", "breached"):
            # Stuck deep in journey — mostly at Engineering or later
            stuck_idx = random.choices([1, 2, 3], weights=[50, 30, 20])[0]
            terminal_stage = STAGES_SEQUENCE[stuck_idx]
            stages_to_traverse = STAGES_SEQUENCE[:stuck_idx + 1]
        else:
            # In progress — anywhere in journey
            progress_idx = random.randint(0, 3)
            terminal_stage = STAGES_SEQUENCE[progress_idx]
            stages_to_traverse = STAGES_SEQUENCE[:progress_idx + 1]

        current_time = created_at
        current_stage = "inquiry"
        assigned_dept = "Sales"

        stage_records = []
        event_records = []

        for stage_idx, stage_name in enumerate(STAGES_SEQUENCE):
            if stage_name == "delivered":
                break

            cfg = STAGE_CONFIG[stage_name]
            sla_hours = cfg["sla_hours"]
            dept = cfg["department"]
            staff = random.choice(cfg["staff"])

            stage_start = current_time
            is_terminal = (stage_name == terminal_stage)
            is_complete = (req_status == "completed") or (stage_name in stages_to_traverse and not is_terminal)
            # For completed requests the last traversal is terminal but still completes
            if req_status == "completed":
                is_complete = True

            if is_complete:
                # Completed stage — pick elapsed time based on dept + scenario
                if is_terminal and req_status == "completed" and scenario == "breached":
                    stage_scenario = "breached"
                elif req_status == "completed" and scenario == "on_time":
                    stage_scenario = "on_track"
                else:
                    stage_scenario = scenario

                elapsed_pct = sla_pct_for_dept(dept, stage_scenario) / 100.0
                elapsed_hours = sla_hours * elapsed_pct
                stage_end = add_biz_hours(stage_start, elapsed_hours)
                sla_deadline = add_biz_hours(stage_start, sla_hours)
                sla_pct = round(elapsed_pct * 100, 1)

                if sla_pct >= 150:
                    stage_status = "critical"
                elif sla_pct >= 100:
                    stage_status = "breached"
                elif sla_pct >= 75:
                    stage_status = "warning"
                else:
                    stage_status = "completed"

                stage_records.append({
                    "id": str(uuid.uuid4()),
                    "request_id": req_id,
                    "stage_name": stage_name,
                    "department": dept,
                    "started_at": stage_start.isoformat(),
                    "completed_at": stage_end.isoformat(),
                    "sla_deadline": sla_deadline.isoformat(),
                    "status": stage_status,
                    "sla_percentage": sla_pct,
                    "assigned_to": staff,
                })

                # Generate events
                templates = EVENT_TEMPLATES.get(stage_name, [])
                n_events = min(len(templates), random.randint(2, max(2, len(templates))))
                selected = random.sample(templates, n_events)
                event_time = stage_start
                for (etype, desc, src) in selected:
                    event_time = random_eat_datetime(event_time, stage_end)
                    event_records.append({
                        "id": str(uuid.uuid4()),
                        "request_id": req_id,
                        "event_type": etype,
                        "stage": stage_name,
                        "source_system": src,
                        "actor": staff,
                        "description": desc,
                        "timestamp": event_time.isoformat(),
                        "metadata_json": {"priority": priority, "region": customer["region"], "product": product},
                    })

                current_time = stage_end
                current_stage = stage_name
                assigned_dept = dept

                if req_status == "completed" and stage_name == "dispatch":
                    break

            else:
                # Active / stuck stage
                elapsed_pct = sla_pct_for_dept(dept, scenario) / 100.0
                # Clamp: on_track < 1.0, warning 0.75-1.05, breached > 1.0, critical > 1.5
                if scenario == "on_track":
                    elapsed_pct = min(elapsed_pct, 0.92)
                elif scenario == "warning":
                    elapsed_pct = max(0.72, min(elapsed_pct, 1.05))
                elif scenario == "breached":
                    elapsed_pct = max(1.01, elapsed_pct)
                elif scenario == "critical":
                    elapsed_pct = max(1.50, elapsed_pct)

                elapsed_hours = sla_hours * elapsed_pct
                sla_deadline = add_biz_hours(stage_start, sla_hours)
                sla_pct = round(elapsed_pct * 100, 1)

                if sla_pct >= 150:
                    active_status = "critical"
                elif sla_pct >= 100:
                    active_status = "breached"
                elif sla_pct >= 75:
                    active_status = "warning"
                else:
                    active_status = "on_track"

                stage_records.append({
                    "id": str(uuid.uuid4()),
                    "request_id": req_id,
                    "stage_name": stage_name,
                    "department": dept,
                    "started_at": stage_start.isoformat(),
                    "completed_at": None,
                    "sla_deadline": sla_deadline.isoformat(),
                    "status": active_status,
                    "sla_percentage": sla_pct,
                    "assigned_to": staff,
                })

                # Partial events
                fake_end = add_biz_hours(stage_start, elapsed_hours)
                templates = EVENT_TEMPLATES.get(stage_name, [])
                n_events = max(1, int(len(templates) * min(elapsed_pct, 1.0) * 0.7))
                selected = templates[:n_events]
                event_time = stage_start
                for (etype, desc, src) in selected:
                    event_time = random_eat_datetime(event_time, fake_end)
                    event_records.append({
                        "id": str(uuid.uuid4()),
                        "request_id": req_id,
                        "event_type": etype,
                        "stage": stage_name,
                        "source_system": src,
                        "actor": staff,
                        "description": desc,
                        "timestamp": event_time.isoformat(),
                        "metadata_json": {"priority": priority, "region": customer["region"], "product": product},
                    })

                current_stage = stage_name
                assigned_dept = dept
                break

        # Determine final request status from scenario
        if req_status == "completed":
            final_status = "completed"
            current_stage = "delivered"
            assigned_dept = "Logistics"
        elif scenario == "critical":
            final_status = "critical"
        elif scenario == "breached":
            final_status = "delayed"
        else:
            final_status = "in_progress"

        requests.append({
            "id": req_id,
            "customer_id": customer["id"],
            "product_category": product,
            "priority": priority,
            "current_stage": current_stage,
            "assigned_department": assigned_dept,
            "status": final_status,
            "description": f"{product} service request — {customer['region']} site. Ref: {crm_ref}.",
            "crm_reference": crm_ref,
            "erp_reference": erp_ref,
            "created_at": created_at.isoformat(),
            "updated_at": current_time.isoformat(),
        })

        journey_stages.extend(stage_records)
        events.extend(event_records)

    return requests, journey_stages, events
