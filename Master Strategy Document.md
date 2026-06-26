# **DAYLIFF 1000 EYES: MASTER STRATEGY & ARCHITECTURE DOCUMENT**

**Enterprise Process Observability, Workflow Intelligence, and Operational Analytics Platform**

## **PART 1: PROJECT BRIEF & EXECUTIVE SUMMARY**

### **1.1 Executive Summary**

Dayliff 1000 Eyes is an enterprise-grade operational intelligence platform designed to provide 360-degree visibility into the lifecycle of customer requests across multiple departments. Acting as a centralized observability layer over existing infrastructure (CRM, ERP, Engineering, Logistics), the platform ingests real-time events to reconstruct customer journeys, monitor Service Level Agreements (SLAs), identify bottlenecks, and leverage AI for proactive delay prediction.

### **1.2 The Business Problem**

Currently, customer requests pass through disconnected systems:

Customer → Sales → Engineering → Quotation → Approval → Logistics → Delivery

Because each department uses independent tools, Dayliff faces process visibility gaps, delayed handoffs, SLA breaches, and an inability for management to find a single source of truth for request status and department performance.

### **1.3 Success Criteria**

* **100% Traceability:** Every tracked customer request is fully visible across all departments.  
* **Proactive Management:** Delays are identified *before* they breach SLAs via preemptive warnings.  
* **Accurate Metrics:** Every SLA is measurable and accurately reflects business working hours.  
* **Single Source of Truth:** Management relies on the platform as the definitive operational dashboard.  
* **AI Evolution:** The system successfully transitions from rules-based risk scoring to predictive Machine Learning models.

## **PART 2: RESOLVED ARCHITECTURAL BLUEPRINT**

Following rigorous technical evaluation, the following core architectural dependencies have been resolved and locked in:

### **2.1 Identity & Correlation Management**

* **Identity Resolution Service:** Legacy systems will not be forced to adopt a universal ID. Instead, the platform will utilize mapping tables to correlate existing disparate primary keys (e.g., matching a CRM Lead ID to an ERP Order ID).

### **2.2 Event Ordering & Time Management**

* **Deferred Processing Buffer:** Unmatched "orphaned" events are placed in a staging queue with a 24-hour exponential backoff retry strategy (5m, 1h, 6h, 12h). After 24 hours, unresolved events move to a Dead-Letter Queue (DLQ) and trigger an Administrator alert.  
* **Strict UTC Normalization:** All incoming webhook/API payloads are converted to UTC at the API Gateway. If no timezone is provided by the legacy system, it defaults to the local business timezone (East Africa Time) before UTC conversion.

### **2.3 Workflow Intelligence & Alerting**

* **Business-Aware SLA Engine:** SLA calculations will utilize department-specific calendars and corporate holiday schedules to pause countdowns during off-hours, eliminating false breaches and alert fatigue.  
* **Preemptive Escalation Matrix:**  
  * *75% SLA Consumption:* Warning Alert to Assigned Owner.  
  * *100% SLA Breach:* Critical Alert to Owner and Department Manager.  
  * *150% Critical Delay:* Escalation to Regional Manager.

### **2.4 Real-Time State Resiliency**

* **WebSocket Fallback:** To combat network instability in remote branches, if a client's WebSocket connection drops, the frontend will execute a **Full REST API State Refresh** upon reconnection to guarantee zero data drift.

### **2.5 Security & Artificial Intelligence**

* **PostgreSQL Row-Level Security (RLS):** The Level 2 AI Copilot (Text-to-SQL) is strictly bound by database-level RLS. The PostgreSQL engine dictates data access, ensuring the AI cannot bypass Role-Based Access Controls (RBAC), regardless of the queries it generates.  
* **The AI "Cold Start" Strategy:** The platform will launch using **Static Rule-Based Risk Scoring** for the first 6 months to provide immediate value while natively collecting organic event data. Synthetic data will be generated to populate dashboards for initial stakeholder demos.

## **PART 3: PRODUCT REQUIREMENTS (PRD)**

### **3.1 Core Domain Entities**

* **Customer:** Represents a client (ID, Name, Contact, Region).  
* **Service Request:** The core tracking unit (Request ID, Priority, Current Stage, Assigned Dept).  
* **Event:** Immutable record of activity (Type, Timestamp, Source System, Metadata).  
* **Journey Stage:** Lifecycle steps (Inquiry, Engineering, Quotation, Dispatch).

### **3.2 Role-Based Access Control (RBAC)**

* **Administrators:** Full system configuration, SLA mapping, and mapping table resolution.  
* **Regional Managers:** High-level analytics, escalation alerts, branch performance.  
* **Sales Engineers & Tech Staff:** Active request tracking, individual metrics.  
* **Logistics Officers:** Dispatch and delivery monitoring.

### **3.3 UI/UX Design Principles**

* **Theme:** Enterprise Minimalist (Black, White, Cyan).  
* **Progressive Disclosure:** High-level overviews surface first; detailed tabular data on demand.  
* **Accessibility:** High contrast, strict keyboard navigability, clear system status visibility.

## **PART 4: TECHNOLOGY STACK & ROADMAP**

### **4.1 Technology Stack**

* **Backend:** FastAPI (Python), SQLAlchemy ORM, Celery (Background Jobs).  
* **Database:** PostgreSQL (with RLS configured).  
* **Caching/PubSub:** Redis.  
* **Authentication:** JWT.  
* **Infrastructure:** Docker, Docker Compose.

### **4.2 Development Database Environment**

A managed Azure PostgreSQL instance has been provisioned for development and testing.

* **Server Name:** workhubtest.postgres.database.azure.com  
* **Database:** athousand\_eyes\_test  
* **User:** athousand\_eyes\_user  
* **Password:** stone5flame  
* **Sample Connection String:**  
  postgresql://athousand\_eyes\_user:stone5flame@workhubtest.postgres.database.azure.com:5432/athousand\_eyes\_test?sslmode=require

### **4.3 Development Phases**

* **Phase 1: Project Setup & Foundation**  
  * Initialize Git, Docker, and CI/CD pipelines. Setup PostgreSQL schema with RLS.  
* **Phase 2: Core Domain & Event Pipeline**  
  * Build Core Domain Models and Event Processing APIs.  
  * Implement Identity Resolution Service and Deferred Processing Buffer.  
* **Phase 3: Workflow Intelligence & Timelines**  
  * Develop Journey Reconstruction algorithm and Business-Aware SLA Engine.  
  * Implement Preemptive Escalation Matrix.  
* **Phase 4: Frontend APIs & Real-Time Layer**  
  * Build REST APIs and WebSocket layers (Redis Pub/Sub) with state refresh logic.  
* **Phase 5: Analytics & Dashboards**  
  * Develop Analytics Engine and UI components (Executive, Operations, Analytics).  
* **Phase 6: AI Integration & Demo Prep**  
  * Generate synthetic timeline data for stakeholder demonstrations.  
  * Implement Phase 1 Static Rule-Based Risk Scoring and Level 2 AI Copilot.  
* **Phase 7: Testing & Deployment**  
  * Execute unit, integration, and load testing. Go-Live.  
* **Phase 8: Post-Launch Incubation**  
  * Collect operational events natively. Transition to Level 1 Machine Learning models.