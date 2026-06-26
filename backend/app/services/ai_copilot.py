import json
import re
import asyncio
from typing import Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings

try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Module-level client — created once, reused across all requests
_client: "genai.Client | None" = None


def _get_client():
    global _client
    if not GEMINI_AVAILABLE or not settings.gemini_api_key:
        return None
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


SCHEMA_CONTEXT = (
    "Database: SQLite. Use ONLY SQLite-compatible SQL syntax.\n\n"
    "Tables:\n"
    "- customers(id,name,email,phone,region,company,created_at)\n"
    "- service_requests(id,customer_id FK→customers.id,product_category,priority,"
    "current_stage,assigned_department,status,description,crm_reference,erp_reference,"
    "created_at,updated_at)\n"
    "- events(id,request_id FK→service_requests.id,event_type,stage,source_system,"
    "actor,description,timestamp,metadata_json)\n"
    "- journey_stages(id,request_id FK→service_requests.id,stage_name,department,"
    "started_at,completed_at,sla_deadline,status,sla_percentage,assigned_to)\n"
    "- departments(id,name,display_name)\n"
    "- sla_configs(id,stage_name,department,sla_hours)\n\n"
    "Values:\n"
    "- sr.status: in_progress|completed|delayed|critical\n"
    "- sr.priority: low|medium|high|critical\n"
    "- sr.current_stage: inquiry|engineering_review|quotation|dispatch|delivered\n"
    "- js.status: on_track|warning|breached|critical|completed\n"
    "- c.region: Nairobi|Mombasa|Kisumu|Eldoret|Nakuru|Thika|Nyeri|Malindi|Kisii|Meru|Kitale|Nanyuki\n"
    "- sr.product_category: Water Pumps|Solar Panels|Water Tanks|Irrigation Systems|Borehole Solutions\n\n"
    "SQLite dates: date('now'), date('now','start of month'), date('now','start of month','-1 month'), "
    "strftime('%Y-%m',col). Never use NOW(), date_trunc, interval, EXTRACT, ::date."
)

ROLE_FILTERS = {
    "admin":                 "",
    "executive":             "",
    "ops_manager":           "",
    "regional_manager":      "",
    "sales_engineer":        "AND sr.assigned_department = 'Sales'",
    "engineering_officer":   "AND sr.assigned_department = 'Engineering'",
    "logistics_officer":     "AND sr.assigned_department = 'Logistics'",
    "aftersales_officer":    "AND sr.assigned_department = 'After Sales'",
    "finance_officer":       "AND sr.assigned_department = 'Finance'",
}

_GEN_CONFIG = None


def _gen_config():
    global _GEN_CONFIG
    if _GEN_CONFIG is None and GEMINI_AVAILABLE:
        try:
            _GEN_CONFIG = genai_types.GenerateContentConfig(
                temperature=0,
                max_output_tokens=512,
                thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
            )
        except Exception:
            _GEN_CONFIG = genai_types.GenerateContentConfig(
                temperature=0,
                max_output_tokens=512,
            )
    return _GEN_CONFIG


async def run_copilot_query(question: str, role: str, db: Session) -> Dict[str, Any]:
    client = _get_client()
    if not client:
        return _fallback_response(question, db)

    role_filter = ROLE_FILTERS.get(role, "")
    prompt = (
        f"{SCHEMA_CONTEXT}\n\n"
        f"Role: {role}. Restriction: {role_filter or 'none'}.\n"
        f"Question: {question}\n\n"
        "Return ONLY valid JSON (no markdown):\n"
        '{"sql":"SELECT ...","result_type":"table|chart|text","summary":"one sentence"}\n'
        "result_type: chart=aggregations/trends, table=lists, text=single values. "
        "SQL must be safe read-only SQLite SELECT."
    )

    try:
        response = None
        last_err = None
        for attempt in range(3):
            try:
                response = await client.aio.models.generate_content(
                    model=settings.gemini_model_name,
                    contents=prompt,
                    config=_gen_config(),
                )
                break
            except Exception as e:
                last_err = e
                if "503" in str(e) and attempt < 2:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
        if response is None:
            raise last_err
        raw = response.text.strip()
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
        parsed = json.loads(raw)
        sql = parsed.get("sql", "")
        result_type = parsed.get("result_type", "table")
        summary = parsed.get("summary", "")

        if not _is_safe_sql(sql):
            return {"question": question, "sql": sql, "result_type": "text", "data": None,
                    "summary": "Query blocked for safety.", "error": "Unsafe SQL detected"}

        rows, columns = await asyncio.get_event_loop().run_in_executor(
            None, _execute_sql, sql, db
        )
        return {
            "question": question, "sql": sql, "result_type": result_type,
            "data": {"columns": columns, "rows": rows}, "summary": summary,
        }

    except Exception as e:
        return {"question": question, "sql": None, "result_type": "text",
                "data": None, "summary": None, "error": str(e)}


def _is_safe_sql(sql: str) -> bool:
    forbidden = ["delete", "update", "insert", "drop", "truncate", "alter",
                 "create", "grant", "revoke"]
    lower = sql.lower()
    return not any(re.search(r'\b' + kw + r'\b', lower) for kw in forbidden)


def _execute_sql(sql: str, db: Session):
    result = db.execute(text(sql))
    columns = list(result.keys())
    rows = [list(row) for row in result.fetchall()]
    return rows, columns


def _fallback_response(question: str, db: Session) -> Dict[str, Any]:
    q = question.lower()
    if "breach" in q or "sla" in q:
        sql = ("SELECT sr.id, c.name, sr.current_stage, sr.status, js.sla_percentage "
               "FROM service_requests sr JOIN customers c ON sr.customer_id = c.id "
               "JOIN journey_stages js ON js.request_id = sr.id "
               "WHERE js.status IN ('breached','critical') ORDER BY js.sla_percentage DESC LIMIT 20")
    elif "region" in q:
        sql = ("SELECT c.region, COUNT(sr.id) as total, "
               "SUM(CASE WHEN sr.status='completed' THEN 1 ELSE 0 END) as completed "
               "FROM service_requests sr JOIN customers c ON sr.customer_id = c.id "
               "GROUP BY c.region ORDER BY total DESC")
    elif "product" in q or "categor" in q:
        sql = ("SELECT product_category, COUNT(*) as total FROM service_requests "
               "GROUP BY product_category ORDER BY total DESC")
    else:
        sql = ("SELECT sr.id, c.name, sr.product_category, sr.status, sr.current_stage, sr.priority "
               "FROM service_requests sr JOIN customers c ON sr.customer_id = c.id "
               "ORDER BY sr.updated_at DESC LIMIT 20")

    try:
        rows, columns = _execute_sql(sql, db)
        return {
            "question": question, "sql": sql, "result_type": "table",
            "data": {"columns": columns, "rows": rows},
            "summary": "Results from the database (AI unavailable).",
        }
    except Exception as e:
        return {"question": question, "sql": sql, "result_type": "text",
                "data": None, "summary": None, "error": str(e)}
