# SurakshaSetu Backend — Feature Report

> **Test Run:** 2026-05-05 | All core and "Upper Hand" features verified via `full_test.py`

---

## Test Results Summary

| # | Feature | Endpoint Tested | Result |
|---|---------|-----------------|--------|
| 1 | Health Check | `GET /health` | ✅ PASS |
| 2 | Authentication (Login + /me) | `POST /api/v1/auth/login`, `GET /api/v1/auth/me` | ✅ PASS |
| 3 | Data Ingestion Pipeline | `POST /api/v1/ingest/csv`, `GET /api/v1/ingest/status/{id}` | ✅ PASS |
| 4 | UBID Lookup & Federated Identity | `GET /api/v1/ubid/list`, `GET /api/v1/ubid/{ubid}` | ✅ PASS |
| 5 | AI Analytics / NL2API Querying | `POST /api/v1/query/ask` | ✅ PASS |
| 6 | PII Scrambler (scramble + unscramble) | `POST /api/v1/admin/scramble`, `/admin/unscramble` | ✅ PASS |
| 7 | Review Workflow Queue | `GET /api/v1/review/queue` | ✅ PASS |
| 7B| AI-Assisted Orphan Event Resolution | `POST /api/v1/review/orphans/{id}/ai-suggest` | ✅ PASS |
| 7C| Shared PAN/GSTIN Fraud Network | `GET /api/v1/query/network/fraud-risks` | ✅ PASS |
| 7D| UBID Hidden Network Linkage | `GET /api/v1/ubid/{id}/network` | ✅ PASS |
| 8 | Audit Trail | `GET /api/v1/admin/audit` | ✅ PASS |
| 9 | Admin Dashboard Stats | `GET /api/v1/admin/stats` | ✅ PASS |

> **Note:** The backend test suite runs perfectly with Exit Code: 0, confirming all mandatory and advanced features are highly functional and robust.

---

## Live Data Snapshot (from test run)

| Metric | Value |
|--------|-------|
| Total business records in DB | 250 |
| Total active UBIDs | 69 |
| PAN-anchored UBIDs | 37 |
| Pending review items | 10 |
| Total audit log entries | 8,294 |

---

## Feature Details

### 1. 🏥 Health Check
**Endpoint:** `GET /health`  
Returns `{"status": "ok", "service": "SurakshaSetu"}`. Used for uptime monitoring and load-balancer probes.

---

### 2. 🔐 JWT Authentication
**Endpoints:** `POST /api/v1/auth/login`, `GET /api/v1/auth/me`

- **Login:** Accepts `username` + `password` (form data), returns a signed JWT Bearer token.
- **Token validity:** Configurable via `JWT_EXPIRE_MINUTES` (default: 480 min / 8 hours).
- **Algorithm:** HS256 signed with `JWT_SECRET_KEY`.
- **`/me`:** Returns the currently authenticated user's username, role, and metadata.
- **Roles:** `admin`, `reviewer`, `analyst` — enforced via `require_role()` dependency on sensitive routes.

---

### 3. 📥 Data Ingestion Pipeline
**Endpoints:** `POST /api/v1/ingest/csv?department=<dept>`, `GET /api/v1/ingest/status/{job_id}`

**How it works (multi-stage async pipeline):**
1. **Upload** → A CSV file is accepted, a `job_id` is returned immediately (non-blocking).
2. **Normalisation** → Name, address, PAN, GSTIN, phone are cleaned and standardised.
3. **Blocking** → Records are grouped into candidate pairs using a Soundex/PIN-code blocking key to limit comparison space.
4. **Matching** → Each candidate pair is scored using weighted feature vectors (name similarity, address overlap, PAN/GSTIN exact match, phone match).
5. **Resolution:**
   - Score ≥ high threshold → **auto-linked** (same UBID assigned automatically).
   - Score in middle band → **sent to review queue** (human-in-the-loop).
   - Score < threshold → **kept separate** (different UBIDs).
6. **UBID Assignment** → Each resolved entity gets a `UBID-KA-{pincode}-{hash}` identifier.
7. **Deduplication** → Already-seen source IDs are `skipped_duplicates` without re-processing.

**Departments supported:** `shop_establishment`, `factories`, `labour`, `kspcb`

---

### 4. 🆔 UBID (Unique Business Identifier) Management
**Endpoints:** `GET /api/v1/ubid/list`, `GET /api/v1/ubid/{ubid}`

**Format:** `UBID-KA-{6-digit-pincode}-{8-char-hex}` (e.g., `UBID-KA-560058-B164A4E9`)

**UBID Profile includes:**
- **`status`** — `active_ubid` / `merged` / `superseded`
- **`activity_status`** — `Active`, `Dormant`, `Closed`, `Unknown`
- **`activity_score`** — 0.0–1.0 float computed from event recency and frequency
- **`pan_anchor`** / **`gstin_anchor`** — Verified PAN/GSTIN when available (highest-confidence link)
- **`linked_records`** — All source records from different departments that resolved to this UBID
- **`event_timeline`** — Chronological list of compliance events (inspections, renewals, violations, etc.)
- **`activity_evidence`** — Human-readable evidence strings explaining the activity score

**Federated Identity Resolution:** One UBID can link records from multiple departments. Example: a factory registered under Factories Act, with a Labour Dept record and a KSPCB pollution consent, all merged into one UBID profile.

---

### 5. 🤖 Privacy-Preserving NL2API Analytics (Upper Hand Feature)
**Endpoint:** `POST /api/v1/query/ask`

**How it works:** 
Accepts a natural language question (e.g., *"Show me active factories in Bangalore with no recent inspections"*). It securely utilizes Mistral AI to map this sentence to strict database query parameters. **No PII is sent to the LLM**—only the schema and the question. The result is pure cross-departmental analytics without needing SQL.

---

### 6. 🔒 PII Scrambler (Deterministic & Reversible)
**Endpoints:** `POST /api/v1/admin/scramble`, `POST /api/v1/admin/unscramble`

**How it works:**
- Uses a **secret seed** (`SCRAMBLER_SECRET_SEED`) as a HMAC key.
- Detects PII tokens via regex: **PAN** (`[A-Z]{5}[0-9]{4}[A-Z]`), **Aadhaar** (`\d{4}-\d{4}-\d{4}`), **Phone** (`[6-9]\d{9}`).
- For each matched token, computes `HMAC-SHA256(seed, token)` → derives a format-preserving substitute.
- The substitution is **deterministic**: same input always produces the same scrambled output.
- A token map is stored, allowing **reversible unscrambling** by looking up the reverse mapping.
- **Names are not scrambled** (only structured identifiers).

---

### 7. 👥 Human-in-the-Loop Review Workflow
**Endpoints:** `GET /api/v1/review/queue`, `POST /api/v1/review/queue/{id}/merge`, `POST /api/v1/review/queue/{id}/reject`, `POST /api/v1/review/queue/{id}/escalate`  
**Orphan Events:** `GET /api/v1/review/orphans`, `POST /api/v1/review/orphans/{id}/assign`

**How it works:**
- During ingestion, ambiguous matches (mid-confidence scores) are placed in a **review queue** as `ReviewItem` documents.
- A reviewer (role: `admin` or `reviewer`) can merge or reject matches, turning human decisions into labeled ML training data.

---

### 8. ✨ AI-Assisted Orphan Event Resolution (Upper Hand Feature)
**Endpoint:** `POST /api/v1/review/orphans/{id}/ai-suggest`

**How it works:**
Instead of a human manually digging to find where an orphaned event (e.g., a random inspection) belongs, they click a button and the AI scans candidate UBIDs, returning the best match alongside a confidence score and a plain-English reason. Transforms manual hunting into one-click approvals.

---

### 9. 🕸️ Network & Fraud Linkage Discovery (Upper Hand Feature)
**Endpoints:** `GET /api/v1/ubid/{id}/network`, `GET /api/v1/query/network/fraud-risks`

**How it works:**
Uncovers hidden identity graphs. Takes a UBID, extracts all its raw phones, emails, and owner names, and queries the database for *other distinct UBIDs* sharing these attributes. Crucial for detecting shell companies and "phoenixing" (closing a business and reopening under a new name with the same phone number).

---

### 10. 🌐 Native Multilingual Support (English, Hindi, Kannada)
**Global Feature:** App-wide `I18nMiddleware` and dynamic LLM prompting.

**How it works:**
The entire backend dynamically adapts to the user's preferred language. By passing an `Accept-Language` header (e.g., `kn`), all API errors, statuses, and explanations are instantly translated. Furthermore, the NL2API feature will natively detect and explain queries in Kannada or Hindi if the user types their prompt in that language.

---

### 11. 📋 Audit Trail
**Endpoint:** `GET /api/v1/admin/audit?limit=N`

- Every action (ingestion, UBID merge, review decision, login, scramble, etc.) is appended to an immutable audit log.
- Used for compliance traceability and forensic investigation.

---

### 12. 🛠️ Admin Dashboard Stats
**Endpoint:** `GET /api/v1/admin/stats`

Returns a real-time dashboard snapshot of total records, active UBIDs, PAN-anchored statuses, and queue depths.

---

## Architecture Overview

```
CSV Upload → Normaliser → Blocker → Matcher → Resolver
                                                   ↓
                                    ┌──────────────┴──────────────┐
                                    ↓                             ↓
                               Auto-Link                    Review Queue
                               (UBID assigned)              (Human reviews)
                                    ↓                             ↓
                               UBID Profile ←─────── Merge/Reject Decision
                               (MongoDB Atlas)               ↓
                                    ↓                   Labelled Pair
                               Event Timeline             (ML training data)
                               Activity Score
                               PII-Scrambled Audit Log
```

**Stack:** FastAPI + Beanie ODM (async MongoDB) + MongoDB Atlas + JWT Auth + Mistral AI + HMAC-based PII Scrambler + Custom I18n Middleware
