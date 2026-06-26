# **DAYLIFF 1000 EYES: RESOLVED DESIGN DECISIONS**

**Document Purpose:** This document captures every design decision resolved during the planning interview. It supersedes and extends the original Master Strategy Document for the Hackathon MVP build.

---

## **1. PROJECT SCOPE**

| Decision | Resolution |
|---|---|
| **Build Scope** | Full-stack MVP covering Phases 1–5 (Backend + Frontend + Real-Time + Dashboards) |
| **Data Strategy** | Synthetic data seeded into the database — no real integrations needed |
| **Target** | Hackathon demo — must be visually impressive and functionally complete |

---

## **2. TECHNOLOGY STACK (RESOLVED)**

### **2.1 Backend**
| Component | Technology | Notes |
|---|---|---|
| **API Framework** | FastAPI (Python) | As specified in Master Strategy |
| **ORM** | SQLAlchemy | As specified |
| **Background Jobs** | Celery | As specified |
| **Real-Time PubSub** | Redis | Full WebSocket + Redis Pub/Sub |
| **Containerization** | Docker + Docker Compose | Single `docker-compose up` for full stack |

### **2.2 Frontend**
| Component | Technology | Notes |
|---|---|---|
| **Framework** | Next.js | SSR, API routes, great dashboard support |
| **Charting** | Recharts | React-native, declarative, lightweight |
| **Journey Timeline** | Custom Swimlane Component | Horizontal swimlane with department lanes |
| **Styling** | Vanilla CSS | Custom design system, no Tailwind |

### **2.3 Database**
| Component | Technology | Notes |
|---|---|---|
| **Database** | Azure PostgreSQL (Managed) | Pre-provisioned instance |
| **Server** | `workhubtest.postgres.database.azure.com` | |
| **Database Name** | `athousand_eyes_test` | |
| **User** | `athousand_eyes_user` | |
| **Password** | `stone5flame` | |
| **SSL** | Required (`sslmode=require`) | |

### **2.4 AI Integration**
| Component | Technology | Notes |
|---|---|---|
| **LLM Provider** | Google Gemini | For Text-to-SQL AI Copilot |
| **API Key** | User has key ready | Will be configured via environment variable |
| **Security** | PostgreSQL RLS | AI queries bounded by Row-Level Security |

---

## **3. AUTHENTICATION & AUTHORIZATION**

| Decision | Resolution |
|---|---|
| **Auth System** | **No authentication for MVP** |
| **RBAC Demo** | Role-switcher dropdown in the UI header |
| **Available Roles** | Administrator, Regional Manager, Sales Engineer, Logistics Officer |
| **Behavior** | Switching roles changes visible dashboards and data scope |

---

## **4. UI/UX DESIGN DECISIONS**

### **4.1 Design Theme**
| Decision | Resolution |
|---|---|
| **Theme** | **Dayliff Brand Colors** (not the original Enterprise Minimalist) |
| **Primary Blue** | `#0054A6` — Davis & Shirtliff corporate blue |
| **Accent Orange** | `#F58220` — Dayliff brand orange |
| **Background** | Dark mode — `#0A0F1A` (deep navy-black) |
| **Surface** | `#111827` (dark card surfaces) |
| **Text Primary** | `#F9FAFB` (near-white) |
| **Text Secondary** | `#9CA3AF` (muted gray) |
| **Success** | `#10B981` (emerald green) |
| **Warning** | `#F59E0B` (amber) |
| **Danger** | `#EF4444` (red) |
| **Typography** | Inter (Google Fonts) — clean, modern, enterprise |
| **Design Style** | Glassmorphism cards, subtle micro-animations, premium feel |

### **4.2 Dashboard Views (All 5 Included)**

#### **A. Executive Dashboard**
- KPI summary cards (total requests, SLA compliance %, avg resolution time, active breaches)
- Department performance heatmap
- Bottleneck identification chart
- Trend sparklines

#### **B. Operations Dashboard**
- Live request tracker (filterable table with real-time status updates)
- Active SLA countdown timers
- Journey progress indicators per request
- Department workload distribution

#### **C. Analytics Dashboard**
- Historical trend charts (requests over time, SLA trends)
- Department comparison bar/radar charts
- Average processing time by stage
- Regional performance breakdown

#### **D. AI Copilot Panel**
- Natural language query input
- Gemini-powered Text-to-SQL translation
- Results displayed as auto-formatted tables/charts
- Query history sidebar
- Bounded by PostgreSQL RLS

#### **E. Request Detail View**
- Full horizontal swimlane timeline (departments as lanes, events as nodes)
- Color-coded status: Green (On-track) | Amber (75%+ SLA Warning) | Red (100%+ SLA Breached)
- Complete event log with timestamps
- Metadata panel (customer, priority, assigned staff, region)

### **4.3 Alert System**
| Decision | Resolution |
|---|---|
| **Alert Delivery** | Visual indicators only (no notification center) |
| **Color Coding** | Green (on-track), Amber (75% SLA consumed), Red (breached) |
| **Applied To** | Request cards, table rows, timeline nodes, KPI cards |

---

## **5. SLA CONFIGURATION**

| Journey Stage | SLA Duration | Business Hours |
|---|---|---|
| **Sales Response** (Inquiry → Engineering) | 4 business hours | Mon–Fri, 8:00–17:00 EAT |
| **Engineering Review** (Engineering → Quotation) | 2 business days | Mon–Fri, 8:00–17:00 EAT |
| **Quotation Approval** (Quotation → Dispatch) | 1 business day | Mon–Fri, 8:00–17:00 EAT |
| **Dispatch & Delivery** (Dispatch → Delivered) | 3 business days | Mon–Fri, 8:00–17:00 EAT |

**Escalation Thresholds (Visual Only):**
- `75%` SLA consumed → Amber/Warning indicator
- `100%` SLA breached → Red/Critical indicator
- `150%` Critical delay → Deep red / pulsing indicator

---

## **6. SYNTHETIC DATA SPECIFICATION**

| Parameter | Value |
|---|---|
| **Volume** | ~200 customer service requests |
| **Product Categories** | Water Pumps, Solar Panels, Water Tanks, Irrigation Equipment, Borehole Solutions |
| **Regions** | Nairobi, Mombasa, Kisumu, Eldoret, Nakuru, Thika, Nyeri, Malindi |
| **Departments** | Sales, Engineering, Quotations, Logistics |
| **Time Span** | Past 6 months of synthetic activity |
| **Data Mix** | ~60% completed, ~25% in-progress, ~10% delayed/breached, ~5% critical |

---

## **7. REAL-TIME ARCHITECTURE**

| Component | Implementation |
|---|---|
| **Protocol** | WebSocket (FastAPI native) |
| **Message Broker** | Redis Pub/Sub |
| **Channels** | Per-department channels + global broadcast |
| **Fallback** | Full REST API state refresh on WebSocket reconnection |
| **Frontend** | Auto-reconnect with exponential backoff |

---

## **8. DEPLOYMENT**

| Component | Configuration |
|---|---|
| **Orchestration** | Docker Compose |
| **Services** | FastAPI backend, Next.js frontend, Redis, Celery worker |
| **Database** | External Azure PostgreSQL (not containerized) |
| **Single Command** | `docker-compose up --build` |
| **Ports** | Frontend: 3000, Backend API: 8000, Redis: 6379 |

---

## **9. PROJECT STRUCTURE**

```
Dayliff Omni/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Settings & env vars
│   │   ├── database.py             # SQLAlchemy engine & session
│   │   ├── models/                 # SQLAlchemy domain models
│   │   │   ├── customer.py
│   │   │   ├── service_request.py
│   │   │   ├── event.py
│   │   │   └── journey_stage.py
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── api/                    # REST API route modules
│   │   │   ├── requests.py
│   │   │   ├── events.py
│   │   │   ├── analytics.py
│   │   │   └── copilot.py
│   │   ├── services/               # Business logic
│   │   │   ├── sla_engine.py
│   │   │   ├── journey.py
│   │   │   ├── identity_resolver.py
│   │   │   └── ai_copilot.py
│   │   ├── websocket/              # WebSocket handlers
│   │   │   └── manager.py
│   │   ├── tasks/                  # Celery background tasks
│   │   │   └── sla_monitor.py
│   │   └── seed/                   # Synthetic data generation
│   │       └── generate.py
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js
│   │   │   ├── page.js             # Executive Dashboard (default)
│   │   │   ├── operations/
│   │   │   ├── analytics/
│   │   │   ├── copilot/
│   │   │   └── request/[id]/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.js
│   │   │   │   ├── Header.js
│   │   │   │   └── RoleSwitcher.js
│   │   │   ├── charts/
│   │   │   │   ├── KPICard.js
│   │   │   │   ├── SLAGauge.js
│   │   │   │   └── DeptHeatmap.js
│   │   │   ├── timeline/
│   │   │   │   └── SwimlanTimeline.js
│   │   │   └── copilot/
│   │   │       └── QueryInterface.js
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js
│   │   │   └── useAPI.js
│   │   └── styles/
│   │       ├── globals.css
│   │       ├── variables.css
│   │       └── components/
│   └── tests/
└── docs/
    ├── Master Strategy Document.md
    └── Resolved Design Decisions.md
```

---

*Document generated from design interview on 2026-06-23. All decisions are locked for the Hackathon MVP build.*
