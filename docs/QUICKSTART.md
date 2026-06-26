# Dayliff 1000 Eyes — Quick Start Guide

## Prerequisites
- Docker Desktop (with Compose v2)
- Node.js 20+ (for local frontend dev only)
- Python 3.11+ (for local backend dev only)

## 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your **GEMINI_API_KEY** (for AI Copilot):
```
GEMINI_API_KEY=your_actual_key_here
```

The Azure PostgreSQL database is pre-configured. Redis runs in Docker.

## 2. Launch Everything (Docker)

**Windows PowerShell:**
```powershell
.\start.ps1
```

**Linux/macOS:**
```bash
chmod +x start.sh && ./start.sh
```

**Manual:**
```bash
docker-compose up --build -d
# Wait ~30 seconds, then:
docker exec dayliff_backend python -m app.seed.cli --count 200 --clear
```

## 3. Access the Platform

| Service | URL |
|---|---|
| **Frontend Dashboard** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Swagger API Docs** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |

## 4. Navigating the UI

| Dashboard | Description |
|---|---|
| **Executive** (home) | KPI cards, SLA gauge, heatmap, trend charts |
| **Operations** | Live filterable request table, SLA badges |
| **Analytics** | Historical trends, radar chart, regional breakdown |
| **Request Detail** | Click any request → swimlane timeline + event log |
| **AI Copilot** | Ask natural language questions about your data |

## 5. Role Switcher

Use the **role dropdown** in the header to switch between:
- **Administrator** — Full access
- **Regional Manager** — Cross-branch analytics
- **Sales Engineer** — Sales & CRM focused view
- **Logistics Officer** — Dispatch & delivery focused

## 6. Local Development (No Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt

# Set DATABASE_URL in your shell, then:
uvicorn app.main:app --reload --port 8000

# Seed the database:
python -m app.seed.cli --count 200 --clear
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## 7. Re-seeding Data

```bash
docker exec dayliff_backend python -m app.seed.cli --count 200 --clear
```

## Architecture

```
Browser → Next.js (3000)
             ↓ REST + WebSocket
         FastAPI (8000)
             ↓                 ↓
        Azure PostgreSQL    Redis (6379)
                               ↑
                         Celery Worker
                         (SLA Monitor)
```
