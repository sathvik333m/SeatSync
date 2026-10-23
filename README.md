# SeatSync — Campus Resource Reservation & Peer Learning Platform
> **DBMS College Project · PostgreSQL 16 · Node.js/Express · React + TypeScript**  
> *Tagline: Reserve a space. Share a skill. Learn together.*

---

## 📌 Executive Summary & Architecture Overview

**SeatSync** solves the twin challenges of campus facility management and peer-to-peer technical knowledge sharing. The core engineering challenge addressed is **strict transaction consistency and concurrency control**: ensuring that simultaneous room reservations, group workshop capacity enrollments, and cascading session cancellations remain strictly consistent even under high-load parallel execution.

```
       ┌─────────────────────────────────────────────────────────────┐
       │                   SeatSync Web Frontend                     │
       │           React 18 + TypeScript + Vite (Port 3000)          │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ REST API / JWT
       ┌──────────────────────────────▼──────────────────────────────┐
       │                  Node.js / Express Backend                  │
       │                   Layered Architecture                      │
       │   [Routes] ──► [Controllers] ──► [Services] ──► [pg Pool]   │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Connection Pool & Transactions
       ┌──────────────────────────────▼──────────────────────────────┐
       │              Docker PostgreSQL 16 Database Engine           │
       │                                                             │
       │  • btree_gist Extension & Exclusion Constraints             │
       │  • Row-Level Locking (SELECT ... FOR UPDATE)                │
       │  • Multi-Table Foreign Key Consistency                      │
       │  • Polymorphic Immutable Audit Trails (JSONB)               │
       └─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Step 1: Start PostgreSQL via Docker
Ensure Docker Desktop is open and running on your system, then run:
```bash
docker compose up -d
```
*Note: This automatically initializes PostgreSQL 16 on port `5432`, enables the `btree_gist` extension, applies `database/schema.sql`, and populates realistic demo seed data from `database/seed.sql`.*

### Step 2: Backend Setup & Migration
```bash
cd backend
npm install
npm run migrate    # Re-applies schema and seed data at any time
npm run dev        # Starts backend server on http://localhost:5000
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts Vite frontend on http://localhost:3000
```

---

## 🔑 Demo Personas & Pre-seeded Accounts
The platform features an instant **Demo Persona Switcher** in the navigation header so evaluating professors can switch roles with 1 click:

| Name | Role | Email | Password | Primary Activity |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Chen** | Student / Teacher | `alex.chen@campus.edu` | `password123` | Teaches React 19 & Docker |
| **Priya Sharma** | Student / Teacher | `priya.sharma@campus.edu` | `password123` | Teaches PostgreSQL Optimization |
| **Marcus Johnson** | Student / Teacher | `marcus.johnson@campus.edu` | `password123` | Teaches 1-on-1 Python |
| **Elena Rostova** | Student / Learner | `elena.rostova@campus.edu` | `password123` | Enrolled learner |
| **Campus Admin** | Administrator | `admin@campus.edu` | `admin123` | Room management & Maintenance |

---

## 🛡️ Core DBMS Transactions & Concurrency Implementation

### Transaction 1: Safe Resource Reservation (Overlapping Conflict Prevention)
- **Goal:** Prevent two students from booking the same study room/lab for overlapping time slots.
- **Engine-Level Mechanism:**
  1. `SELECT ... FOR UPDATE` locks the resource row to serialize concurrent booking and maintenance operations.
  2. Cross-table check against `resource_maintenance` interval.
  3. `INSERT INTO reservations` is guarded by the **GiST exclusion constraint**:
     ```sql
     CONSTRAINT no_overlapping_reservations EXCLUDE USING gist (
         resource_id WITH =,
         tstzrange(start_time, end_time, '[)') WITH &&
     ) WHERE (status IN ('pending', 'confirmed'));
     ```
  4. Any concurrent race condition that evades application checks is immediately rejected with error `23P01`.

### Transaction 2: Accept Learner into Workshop (Capacity Serialization)
- **Goal:** Prevent over-subscription when only 1 seat remains in a group workshop.
- **Engine-Level Mechanism:**
  1. `SELECT ... FROM learning_sessions WHERE session_id = :id FOR UPDATE;`
  2. `SELECT ... FROM learning_listings WHERE listing_id = :id FOR UPDATE;`
  3. Verifies listing teacher authorization.
  4. Counts registered learners: `SELECT COUNT(*) FROM session_participants WHERE session_id = :id AND attendance_status = 'registered';`
  5. If `count >= max_participants`, transaction issues `ROLLBACK`.
  6. Otherwise updates request to `accepted` and inserts into `session_participants`.

### Transaction 3: Atomic Session Scheduling with Physical Room Integration
- **Goal:** Organize a workshop and reserve a physical room simultaneously.
- **Engine-Level Mechanism:**
  Executes room lock, maintenance verification, room reservation creation, and session creation inside a **single ACID transaction**. If room booking fails, no orphaned session is left behind.

### Transaction 4: Cascading Session Cancellation
- **Goal:** When a session is cancelled by a teacher or admin, the linked room reservation must be released atomically.
- **Engine-Level Mechanism:**
  ```sql
  BEGIN;
  UPDATE learning_sessions SET status = 'cancelled' WHERE session_id = :id;
  UPDATE reservations SET status = 'cancelled' WHERE reservation_id = :res_id;
  UPDATE session_participants SET attendance_status = 'cancelled' WHERE session_id = :id;
  COMMIT;
  ```

---

## 📊 Evaluation Reports (Section 7 Implementation)

Access all queries live via the **DBMS Evaluation Lab** tab in the web interface:

1. **Report A — Most Popular Skills:**
   ```sql
   SELECT s.name AS skill, s.category,
          COUNT(DISTINCT l.listing_id) AS listings, 
          COUNT(DISTINCT q.request_id) AS requests 
   FROM skills s 
   LEFT JOIN learning_listings l ON l.skill_id = s.skill_id AND l.status = 'published'
   LEFT JOIN learning_requests q ON q.listing_id = l.listing_id 
   GROUP BY s.skill_id, s.name, s.category 
   ORDER BY requests DESC, listings DESC;
   ```
2. **Report B — Upcoming Sessions with Teachers and Rooms:**
   Multi-table joins across `learning_sessions`, `learning_listings`, `users`, `reservations`, and `resources`.
3. **Report C — Top Teachers & Learners Leaderboard:**
   Ranks students by completed teaching workshops and attended learning sessions.
4. **Report D — Resource Booking Demand & Total Hours:**
   Calculates total utilization hours using `SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)`.
5. **Report E — Teacher Pending Requests Queue:**
   Parameterized query for teacher incoming applicant review.
6. **Report F & G — EXPLAIN ANALYZE & Audit Explorer:**
   Live execution plan comparisons and polymorphic JSONB audit inspection.

---

## 🧪 Concurrency Automated Tests

Run automated test scripts to demonstrate concurrency guarantees during college evaluation:
```bash
# Test Scenario 1: Two parallel users booking Room 1 for identical slot
npm run test:concurrency --prefix backend

# Test Scenario 3: Multiple learners racing for the final seat in a workshop
npm run test:capacity --prefix backend
```

---

## 📐 Normalization & Integrity Analysis
- **1NF:** All attributes contain atomic values. No multivalued attributes (e.g. session participants are stored as independent rows, not comma-separated IDs).
- **2NF:** In `session_participants`, non-key attributes depend on the entire composite primary key `(session_id, learner_id)`.
- **3NF / BCNF:** Skill categories belong in `skills`, resource metadata belongs in `resources`, and user details belong in `users`. No transitive dependencies exist in `learning_listings` or `reservations`.
