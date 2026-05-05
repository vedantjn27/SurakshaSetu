# SurakshaSetu Frontend Blueprint

This document details how every feature currently powered by the SurakshaSetu backend should be visualized and utilized in the frontend UI. Building the frontend according to this blueprint will result in a highly functional, visually impressive, and government-ready application.

---

## 1. Global Application Shell
**Backend Features:** Authentication (`/auth/login`), Multilingual Support (`Accept-Language` headers)

* **How it looks:** A modern, clean layout with a persistent sidebar for navigation (Dashboard, UBID Registry, Data Uploads, Review Center, Audit). The top right corner contains a user profile dropdown and a **Language Toggle (English | हिन्दी | ಕನ್ನಡ)**. 
* **How it is used:** The user logs in via a secure screen. Once inside, they can switch the application language at any time. The frontend simply intercepts this toggle and attaches the corresponding `Accept-Language` header to all API requests.
* **Result:** The UI text and the API responses (like errors, statuses, and AI explanations) instantly switch to the chosen language, providing a completely localized experience.

---

## 2. Admin Dashboard & Analytics Hub
**Backend Features:** Admin Stats (`/admin/stats`), AI Analytics Querying (`/query/ask`)

* **How it looks:** 
  * **Top Metrics:** KPI cards showing "Total Businesses", "Active UBIDs", "Pending Reviews", and "Fraud Risks Detected" in real-time.
  * **Search/Query Bar:** A prominent, Google-like search bar at the top of the dashboard specifically labeled *"Ask SurakshaSetu"*.
  * **Data Table:** A results table below the search bar that populates dynamically.
* **How it is used:** A government official types a natural language question into the search bar, e.g., *"Show me active factories in 560058 with no inspections in 18 months"*.
* **Result:** The backend Mistral AI translates this securely, returns an explanation (in the user's language), and populates the table with the exact businesses matching the criteria. The user gets complex cross-department data without writing a single SQL query.

---

## 3. UBID Registry & 360° Profile 
**Backend Features:** UBID List (`/ubid/list`), UBID Detail (`/ubid/{ubid_id}`), Network Linkage (`/ubid/{ubid_id}/network`)

* **How it looks:** 
  * **Registry List:** A searchable, paginated table of all businesses with their UBID, status, and health scores.
  * **360° Detail View:** Clicking a UBID opens a rich profile page containing:
    1. **Identity Card:** PAN, GSTIN, overall Activity Status (Active/Dormant/Closed).
    2. **Event Timeline:** A vertical, chronological timeline of all department interactions (e.g., KSPCB renewal, Factory Inspection).
    3. **Network Graph (Fraud Linkage):** A visual node-link diagram or a dedicated "Connected Identities" tab showing other distinct businesses sharing the exact same Phone, Email, or Owner Name.
* **How it is used:** Officials use this to investigate a specific business. They can review the timeline to understand compliance history or click the "Network" tab to hunt for shell companies.
* **Result:** Complete visibility into a business's cross-departmental footprint. If an official sees hidden network linkages, they can immediately flag the business for tax evasion or phoenixing.

---

## 4. Data Ingestion Module
**Backend Features:** CSV Uploads (`/ingest/csv`), Job Status Polling (`/ingest/status/{job_id}`)

* **How it looks:** A dedicated page with a drag-and-drop zone. Below it, a list of active and completed "Ingestion Jobs" with smooth progress bars.
* **How it is used:** A data clerk drops a CSV file (e.g., KSPCB records), selects the department from a dropdown, and clicks "Upload".
* **Result:** A progress bar appears and fills up as the frontend polls the backend status. Once complete, a beautiful summary card appears showing: *Records Ingested*, *Duplicates Skipped*, *Auto-Linked*, and *Sent to Human Review*.

---

## 5. The Review Center (Human-in-the-Loop)
**Backend Features:** Ambiguous Matches (`/review/queue`), Orphan Events (`/review/orphans`), AI Suggestion (`/review/orphans/{id}/ai-suggest`)

* **How it looks:** A split-screen layout. 
  * **Tab 1: Ambiguous Identity Matches:** Shows two side-by-side business records highlighting differences (e.g., spelling errors in address) with a "Confidence Score". Buttons: **[Merge]**, **[Reject]**, **[Escalate]**.
  * **Tab 2: Orphan Events:** A list of standalone events (e.g., a random factory inspection). Beside each event is a shimmering **[✨ AI Suggest Match]** button.
* **How it is used:** 
  * For identities: Reviewers manually verify if two slightly different records belong to the same business and click Merge/Reject.
  * For orphans: Reviewers click the AI button. A popup instantly suggests the best UBID candidate alongside an AI explanation of *why* it matches. The reviewer clicks "Approve".
* **Result:** Ensures 100% data integrity without slowing down human reviewers. The system learns from their decisions, and orphaned data is cleanly integrated into timelines.

---

## 6. Audit & Security Control Room
**Backend Features:** Audit Trail (`/admin/audit`), PII Scrambler (`/admin/scramble`), Unscrambler (`/admin/unscramble`)

* **How it looks:** 
  * **Audit Log:** An immutable, scrollable terminal-like console or dense data table showing every system and user action.
  * **Privacy Playground (Demo):** A split text area showing "Original Text" and "Scrambled Data".
* **How it is used:** 
  * Auditors can filter the audit log to see exactly who overrode an identity classification or who merged records.
  * To demonstrate system security to judges, you type PII (Aadhaar, Phone) into the Privacy Playground. Clicking "Scramble" instantly obfuscates it. Clicking "Unscramble" brings it back deterministically.
* **Result:** Demonstrates absolute transparency, accountability, and cutting-edge privacy preservation to the hackathon judges.

---

## 7. Role-Based Access Control (RBAC) UI Implementation

### 1. 🛡️ Admin (`admin`)
The admin role has full superuser access to the entire system. In addition to all the features available to Reviewers and Analysts, Admins have **exclusive access** to highly sensitive operations:
* **Unscramble PII (`POST /api/v1/admin/unscramble`)**: The ability to reverse the deterministic scrambling and reveal the original raw PII (PAN, Aadhaar, Phone numbers) via the secure key vault lookup.
* **Trigger Model Retraining (`POST /api/v1/admin/retrain`)**: The ability to retrain the Logistic Regression matcher on the accumulated human-in-the-loop labelled pairs.

### 2. 👥 Reviewer (`reviewer`)
The reviewer role is tasked with operational day-to-day data management and human-in-the-loop review. Reviewers (along with Admins) have access to:

**Data Ingestion Pipeline:**
* Upload department master data CSVs (`POST /api/v1/ingest/csv`).
* Upload activity events CSVs (`POST /api/v1/ingest/events`).

**Match Review Workflow:**
* Merge, reject, or escalate ambiguous candidate pairs from the review queue (`POST /api/v1/review/queue/{id}/*`).

**Orphan Event Resolution:**
* Manually assign orphan events to UBIDs or utilize the AI-Assisted suggestion feature (`POST /api/v1/review/orphans/{id}/*`).

**UBID Management:**
* Trigger manual re-classification of activity status (`POST /api/v1/ubid/{id}/reclassify`).
* Manually override an activity status (e.g., forcing a business to "Dormant") (`POST /api/v1/ubid/{id}/override`).
* Split an incorrectly merged master record out into its own UBID (`POST /api/v1/ubid/{id}/split`).

**Audit Logging:**
* View the paginated, system-wide audit trail for compliance and investigations (`GET /api/v1/admin/audit`).

### 3. 📊 Analyst (`analyst`)
The analyst role is strictly designed for querying, reporting, and dashboarding without risking accidental data modifications or unauthorized PII viewing. Analysts (along with Admins and Reviewers) have access to:

* **Admin Dashboard Stats:** View real-time system-wide metrics (`GET /api/v1/admin/stats`).
* **PII Scrambler:** Deterministically scramble PII tokens in free text to safely share or report data (`POST /api/v1/admin/scramble`).

*(Note: The core querying capabilities—such as cross-system analytics, the AI-powered Natural Language query endpoint `/api/v1/query/ask`, the shared PAN/GSTIN fraud network, and viewing UBID profiles—are accessible to all authenticated users, making them fully available to Analysts for their primary duties.)*

