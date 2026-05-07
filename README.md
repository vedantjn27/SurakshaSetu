<div align="center">

<!-- Animated Banner -->
<picture>
  <!-- Main Title -->
  <img 
    src="https://readme-typing-svg.demolab.com?font=Syne&weight=800&size=52&duration=3000&pause=1200&color=0F766E&center=true&vCenter=true&width=800&height=70&lines=SurakshaSetu+%F0%9F%9B%A1%EF%B8%8F" 
    alt="SurakshaSetu" 
  />
  
  <br/>

  <!-- Subtitle -->
  <img 
    src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=28&duration=3000&pause=1200&color=0F766E&center=true&vCenter=true&width=800&height=45&lines=Secure+Business+Identity+at+Scale;Federated+UBID+Platform." 
    alt="Subtitle" 
  />
</picture>

</div>
<br/><br/>

<img src="https://img.shields.io/badge/Version-1.0.0-0f766e?style=for-the-badge&labelColor=0a0f0f&logo=shield&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&labelColor=0a0f0f&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&labelColor=0a0f0f&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB_+_Beanie-47A248?style=for-the-badge&labelColor=0a0f0f&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Mistral_AI-FF7000?style=for-the-badge&labelColor=0a0f0f&logoColor=white" />
<img src="https://img.shields.io/badge/HMAC--SHA256_PII_Scrambling-DC2626?style=for-the-badge&labelColor=0a0f0f&logoColor=white" />
<img src="https://img.shields.io/badge/Karnataka_Commerce_%26_Industries-6D28D9?style=for-the-badge&labelColor=0a0f0f&logoColor=white" />

<br/><br/>

<img src="https://img.shields.io/badge/%F0%9F%94%97_Record_Linkage-Multi--Pass_Blocking-0f766e?style=flat-square&labelColor=134e4a" />
<img src="https://img.shields.io/badge/%F0%9F%A7%A0_XAI-Mistral_Plain--English_Explanations-7c3aed?style=flat-square&labelColor=2e1065" />
<img src="https://img.shields.io/badge/%F0%9F%94%92_Privacy-HMAC_Scrambled_PII-dc2626?style=flat-square&labelColor=450a0a" />
<img src="https://img.shields.io/badge/%F0%9F%8C%90_i18n-English_%7C_Hindi_%7C_Kannada-f59e0b?style=flat-square&labelColor=451a03" />

<br/><br/>

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  CSV Upload  →  Normalise  →  Block  →  Match  →  Score  →  Auto-Link / Review     ║
║  →  UBID Assigned  →  Events Joined  →  Activity Classified  →  Audit Logged ✅    ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

> **One identity. Five departments. Zero ambiguity.**  
> *SurakshaSetu resolves business records across fragmented government registries into a single, authoritative, privacy-preserving Unified Business Identity — powered by AI.*

<br/>

[🚀 Features](#-features) · [🧰 Tech Stack](#-technology-stack) · [🔄 Workflow](#-system-workflow) · [📂 Repo Guide](#-repository-navigation-guide) · [⚡ Quick Start](#-quick-start) · [📈 Impact](#-impact--benefits)

</div>

---

## 🌐 What is SurakshaSetu?

**SurakshaSetu** (Sanskrit: *Suraksha* = Security, *Setu* = Bridge) is an AI-powered, federated **Unified Business Identity (UBID)** platform built for Karnataka's Commerce & Industries department. It solves one of the most difficult data governance challenges in government administration: **the same business is registered across five different departments under five different names, formats, and IDs — with no shared key.**

SurakshaSetu bridges these siloed registries — Shop & Establishment, Factories, Labour, KSPCB (Pollution Control), and BESCOM (Electricity) — into a single, deduplicated, privacy-preserving master identity per business entity, with a full AI-powered matching pipeline, explainable decisions, HMAC-SHA256 PII scrambling, and a human reviewer workflow for ambiguous cases.

Every decision is logged. Every identity is traceable. Every PII field is scrambled before it touches an AI model.

---

## ❗ Problem Statement

> *A factory in Peenya Industrial Area, Bengaluru, registers with five different government departments. Each registry has a different ID, a different spelling of the business name, a different address format, and no shared key. Nobody knows they are the same entity.*

### The Five Core Failures of Fragmented Business Registries

| # | The Problem | Consequence |
|---|---|---|
| 🗂️ | **Siloed departmental registries** with no common identifier | Same business appears as 5+ separate entities across systems |
| 📝 | **Name variations** — abbreviations, typos, legal suffix differences | `Peenya Engg Pvt Ltd` ≠ `Peenya Engineering Private Limited` |
| 🏠 | **Address inconsistency** — free-text, non-standardized formats | `Plot 12, Peenya Ph-2` ≠ `#12 Peenya Industrial Area Phase 2` |
| 🔐 | **PAN/GSTIN missing or inconsistently provided** | No reliable cross-department anchor key |
| 👤 | **Privacy exposure** — matching requires sharing raw PII across systems | DPDPA 2023 compliance risk when sending real identifiers to AI models |

### Who Suffers

- **Inspectors** conducting compliance checks against multiple incomplete registries
- **Policy analysts** trying to measure sector-level activity with duplicated records
- **Businesses** receiving redundant inspections because departments don't share identity data
- **Citizens** who cannot trust government statistics built on fragmented, inconsistent data

---

## 💡 Solution Overview

SurakshaSetu introduces the **UBID (Unified Business Identity Document)** — a single, authoritative identity cluster that links all departmental records belonging to the same real-world business entity:

```
                        ┌──────────────────────────────────────────────────────┐
                        │              SurakshaSetu Platform                   │
                        └──────────────────────────────────────────────────────┘
                                                 │
     ┌──────────────┬──────────────┬─────────────┼─────────────┬───────────────┐
     ▼              ▼              ▼             ▼             ▼               ▼
┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐
│  Data   │  │  PII     │  │  Record   │  │  UBID   │  │ Activity │  │  Review &  │
│ Ingest  │  │Scrambler │  │ Linkage   │  │ Manager │  │Classifier│  │  Audit     │
│Pipeline │  │ HMAC-256 │  │ Engine    │  │         │  │ + XAI    │  │  Workflow  │
└─────────┘  └──────────┘  └───────────┘  └─────────┘  └──────────┘  └────────────┘
     │              │              │             │             │               │
 Normalise     Scramble       6-signal       Merge /      Time-decay      Human /
 PAN/GSTIN     all PII        feature        Split /      YAML rules      AI-assisted
 Address       before AI      vector +       Singleton    Active /        merge-reject
 Phonetics                    Blocking       create       Dormant /       escalate
                                                          Closed
```

---

## 🚀 Features

### 🔄 1 — Full Ingestion Pipeline (CSV → UBID in One Pass)

A single `POST /api/v1/ingest/csv` call triggers the entire pipeline for one department's data batch — idempotently, with background processing and real-time job status tracking.

**Stages executed per row:**
1. **SHA-256 content hash** for idempotency — exact duplicate rows silently skipped
2. **Name normalisation** — ASCII-fold, punctuation strip, abbreviation expansion (`engg` → `engineering`, `pvt ltd` → `private limited`), legal suffix extraction, Metaphone phonetic encoding
3. **Address parsing** — plot number extraction, locality parsing, city identification, PIN code validation against Karnataka valid codes
4. **PAN/GSTIN validation** — format regex, cross-check (embedded PAN in GSTIN must match PAN field), effective PAN derivation from GSTIN if PAN field missing
5. **Master record storage** in MongoDB
6. **Scrambled record generation** — HMAC-SHA256 copy of every PII field stored in parallel
7. **Multi-pass blocking** — candidate pair generation (6 blocking key strategies)
8. **Feature vector computation** — 8-signal matcher
9. **Confidence scoring** — trained logistic regression model (falls back to YAML-weighted sum)
10. **Three-way resolution** — `auto_link` | `review` | `keep_separate`
11. **UBID assignment** — create singleton or merge into existing cluster
12. **Activity classification** — time-decay scoring against joined events

---

### 🔑 2 — Multi-Pass Blocking Engine

Reduces O(n²) record comparisons to a manageable candidate set using six independent blocking strategies applied in a single pass:

| Blocking Key | Strategy | Catches |
|---|---|---|
| `PIN:{pin}` | Exact PIN code | All businesses in same postal area |
| `PIN_TOK:{pin}:{first_token}` | PIN + first name token | Businesses with similar names in same area |
| `PHON:{metaphone}` | Phonetic encoding of name | Phonetically similar names (typos, transliterations) |
| `PAN:{pan}` | Exact PAN | Same legal entity across departments |
| `GSTIN:{gstin}` | Exact GSTIN | Same taxpayer registration |
| `PIN_PRE:{pin}:{name[:3]}` | PIN + 3-char name prefix | Common abbreviation-based clusters |

A pair qualifies if it shares **any** blocking key (union of passes). Pairs from the same department and source ID are excluded. Results are deduplicated by sorted ID tuple before matching.

---

### 📊 3 — 8-Signal Feature Vector Matcher

Every candidate pair is evaluated across eight signals, with weights defined entirely in `config/rules.yaml` — no hardcoded values in Python:

| Signal | Method | Weight |
|---|---|---|
| `name_jaro_winkler` | RapidFuzz WRatio | 0.18 |
| `name_token_sort` | RapidFuzz token sort ratio | 0.14 |
| `pin_code_exact` | Exact string match | 0.15 |
| `locality_similarity` | RapidFuzz partial ratio | 0.10 |
| `plot_similarity` | RapidFuzz ratio | 0.05 |
| `pan_exact` | Exact match (near-deterministic) | 0.30 |
| `gstin_exact` | Exact match (near-deterministic) | 0.28 |
| `phone_exact` | Last-10-digit normalized match | 0.08 |

**PAN/GSTIN hard floor:** If either identifier matches exactly, the confidence score is floored at **0.88** regardless of other signals — identifier match is treated as near-deterministic evidence.

---

### 🤖 4 — Hybrid Confidence Scorer

A two-mode scoring system with automatic fallback:

- **Mode 1 (primary):** Trained **logistic regression classifier** (`models/matcher_lr.joblib`) — trained on human-labelled pairs from the reviewer workflow, producing calibrated probability estimates
- **Mode 2 (fallback):** YAML-weighted sum — activated automatically if the model file is absent or fails to load
- **Hard floor override:** Applied on PAN/GSTIN match regardless of scoring mode

Scoring method is logged with every decision (`model` | `weighted_sum` | `weighted_sum_with_floor`) for full auditability.

---

### ↔️ 5 — Three-Way Resolution Engine

Every scored pair is routed through a configurable decision gate:

| Decision | Condition | Action |
|---|---|---|
| **`auto_link`** | score ≥ 0.85 | Records merged into shared UBID; `link_type` = `auto` or `pan_anchor` |
| **`review`** | 0.40 ≤ score < 0.85 | Sent to human reviewer queue; singleton UBID created temporarily |
| **`keep_separate`** | score < 0.40 | Records remain independent; separate UBIDs assigned |

All thresholds are YAML-configurable. Every decision is written to the **audit log** with full feature breakdown, threshold values at decision time, and the scoring method used.

---

### 🔐 6 — HMAC-SHA256 PII Scrambler

**No raw PII ever reaches an AI model.** Before any record is sent to Mistral for explanation generation, every sensitive field is scrambled using deterministic **HMAC-SHA256** with a secret seed:

- **Deterministic:** the same real value always maps to the same hash — so matching still works on scrambled data
- **Irreversible:** hash cannot be reversed without the secret seed
- **Fields scrambled:** business name, owner name, address, phone, email, PAN, GSTIN, source ID
- Scrambled records are stored as a parallel `ScrambledRecord` collection — the AI explainer operates exclusively on this collection
- The scrambler seed is stored in `.env` and must never change after data is scrambled (changing the seed breaks the determinism invariant)

---

### 🧠 7 — Mistral AI Explainer (XAI)

**Explainable AI for every match decision.** Powered by **Mistral AI**, the explainer generates plain-English reasoning for government analysts — not just a score, but *why* the system made the decision.

**Two explanation types:**

**Match explanation** — called for every `auto_link` and `review` decision:
> *"These records share an exact PAN identifier (near-deterministic anchor). Their business names are highly similar (82% Jaro-Winkler similarity) and their PIN codes match exactly. The combination of identifier confirmation and address overlap drives the high confidence score of 0.91."*

**Activity classification explanation** — generated after each `classify_ubid` run:
> *"Classified as Active with an activity score of 0.68. The BESCOM utility reading from 23 days ago contributes the strongest signal (0.41 after decay). A recent licence renewal (89 days ago) adds further confirmation. No closure signals detected across any linked department."*

**Privacy guarantee:** The explainer prompt is built exclusively from **scrambled** field values. Raw PII never appears in any Mistral API call. Falls back to template explanations if Mistral API is unavailable.

---

### 🔗 8 — UBID Lifecycle Manager

Full create/merge/split operations on the UBID cluster, with append-only merge history:

- **`create_ubid_for_record`** — generates a new `UBID-KA-{pin_code}-{uuid[:8]}` identifier for a singleton record
- **`merge_into_ubid`** — appends a new linked record to an existing UBID cluster; updates PAN/GSTIN anchors if new record provides them
- **`get_or_create_ubid_for_records`** — smart merge logic: if both records already have UBIDs, merges the smaller cluster into the larger; if neither does, creates new
- **`split_ubid`** — removes a record from a cluster and creates a new independent UBID; the original cluster is not deleted; split is recorded in `merge_history`
- All operations are **reversible** — merge history is append-only and stores every action, record ID, confidence, and performer

---

### ⚡ 9 — Time-Decay Activity Classifier

A **YAML-defined, rule-based** (no ML) activity classifier that produces `Active` | `Dormant` | `Closed` classifications for every UBID based on joined event signals.

**Decay formula:** `weight × 0.5^(days_since / half_life_days)`

| Event Type | Base Weight | Half-Life | Meaning |
|---|---|---|---|
| `utility_reading` | +0.45 | 90 days | Electricity/water consumption → strong activity signal |
| `licence_renewal` | +0.30 | 365 days | Annual renewal → long-lived positive signal |
| `inspection_pass` | +0.20 | 180 days | Passed inspection → medium activity indicator |
| `compliance_filing` | +0.18 | 120 days | Filing submitted → compliance activity |
| `inspection_fail` | +0.08 | 90 days | Still shows up for inspections — weak positive |
| `licence_lapsed` | -0.25 | 180 days | Licence expired → closure signal |
| `no_consumption` | -0.20 | 90 days | Zero utility use → strong dormancy signal |

**Thresholds:** `Active` if score ≥ 0.35 · `Closed` if score ≤ 0.05 · `Dormant` if between

**Reviewer override:** Any admin or reviewer can override the computed classification with a reason and optional expiry date. The override is stored on the UBID document and respected by the classifier until it expires.

---

### 👁️ 10 — Human Review Center

A full reviewer workflow for ambiguous match cases (0.40–0.85 confidence range):

**Match review queue:**
- `GET /review/queue` — paginated list of pending items with feature breakdowns and Mistral explanations
- `POST /review/queue/{id}/merge` — reviewer approves merge; records get shared UBID; decision stored as **labelled training example** for model retraining
- `POST /review/queue/{id}/reject` — reviewer rejects; records stay separate; negative label stored
- `POST /review/queue/{id}/escalate` — reviewer escalates to supervisor

**Orphan event queue:**
- Events from departments that cannot be joined to any UBID (source ID doesn't match any master record) are stored as `OrphanEvent` documents
- `GET /review/orphans` — list of unresolvable events pending human assignment
- `POST /review/orphans/{id}/assign` — manually link an orphan event to a UBID
- `POST /review/orphans/{id}/ai-suggest` — **Mistral AI-assisted resolution**: fetches candidate UBIDs, sends orphan + candidates to Mistral, returns `suggested_ubid`, `confidence`, and `reason` for reviewer to act on

Every reviewer decision is stored as a `LabelledPair` with the full feature vector — enabling periodic **model retraining** via `scripts/train_matcher.py` to improve the logistic regression classifier with accumulated human labels.

---

### 📜 11 — Full Audit Log

Every system action — ingestion job, match decision, UBID creation, merge, split, activity classification, reviewer action — is written to an immutable `AuditLog` collection with:

- `decision_type` — category of action
- `entity_ids` — all record/UBID IDs involved
- `confidence_score` — numeric confidence at time of decision
- `feature_breakdown` — full 8-signal vector
- `threshold_at_decision` — the YAML threshold values that were active
- `outcome` — final decision string
- `performed_by` — `system` or reviewer username
- `timestamp` — UTC

The frontend **Audit Log** page provides a paginated, searchable view of all system decisions.

---

### 🔒 12 — JWT Authentication & Role-Based Access

Secure, stateless authentication with RBAC:

- **JWT tokens** (HS256) with configurable expiry (default 480 minutes)
- **bcrypt** password hashing
- **Roles:** `admin` | `reviewer` | `viewer`
- Route-level protection via `require_role()` FastAPI dependency
- Seeded default users via `scripts/seed_users.py`

---

### 🌍 13 — Multilingual Interface (i18n)

Full internationalization across **English**, **Hindi (हिंदी)**, and **Kannada (ಕನ್ನಡ)**:

- **Backend:** `I18nMiddleware` intercepts responses and translates status strings, decision labels, and error messages based on `Accept-Language` header
- **Frontend:** `react-i18next` with `locales/en.json`, `locales/hi.json`, `locales/kn.json`
- `LanguageSwitcher` component in navbar for runtime switching
- Designed for Karnataka government users — Kannada is the primary operational language

---

### 🔍 14 — UBID Lookup, Query & Analytics

**Lookup endpoints:**
- `GET /lookup/ubid/{ubid}` — full UBID document with all linked records, activity status, merge history
- `GET /lookup/by-pan/{pan}` — find UBID anchored to a PAN
- `GET /lookup/by-gstin/{gstin}` — find UBID anchored to a GSTIN
- `GET /lookup/by-source/{dept}/{source_id}` — find UBID by departmental source ID

**Query & analytics:**
- `GET /query/stats` — platform-wide statistics (total UBIDs, linked records, activity distribution)
- `GET /query/department/{dept}` — department-level ingestion and match statistics
- `GET /query/activity-summary` — breakdown of Active/Dormant/Closed counts across all UBIDs

---

### 🔒 15 — Privacy Playground

A frontend page (`/privacy-playground`) that demonstrates the HMAC scrambling in action — showing users exactly what the AI model sees vs. what the raw data contains, building transparency and trust in the privacy architecture.

---

## 🧰 Technology Stack

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                          │
│  Next.js 15 · React 19 · TypeScript · Tailwind CSS · Framer Motion                 │
│  TanStack React Query · Zustand · Axios · Recharts · i18next · Lucide React        │
└───────────────────────────────────────┬──────────────────────────────────────────────┘
                                        │  REST API (JSON) + JWT Bearer
┌───────────────────────────────────────▼──────────────────────────────────────────────┐
│                              BACKEND LAYER                                           │
│  Python 3.11+ · FastAPI · Uvicorn · Pydantic v2 · Loguru                           │
│  7 Routers: auth · ingest · lookup · query · review · ubid · admin                  │
│  I18n Middleware · JWT Auth · Role-Based Access Control                              │
└──────┬─────────────────┬──────────────────┬─────────────────┬────────────────────────┘
       │                 │                  │                 │
┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐  ┌──────▼────────────────────────┐
│  AI & NLP   │  │  Record      │  │  Database    │  │  Security & Privacy           │
│             │  │  Linkage     │  │              │  │                               │
│ Mistral AI  │  │  RapidFuzz   │  │  MongoDB     │  │  HMAC-SHA256 PII Scrambler   │
│ (XAI +      │  │  (8-signal   │  │  + Beanie    │  │  JWT (python-jose)           │
│  orphan     │  │   matching)  │  │  ODM         │  │  bcrypt password hashing     │
│  suggest)   │  │  Jellyfish   │  │  Motor       │  │  Role-Based Access Control   │
│             │  │  (Metaphone) │  │  (async)     │  │                               │
│             │  │  scikit-learn│  │  GridFS      │  │                               │
│             │  │  (LR model)  │  │  (optional)  │  │                               │
└─────────────┘  └──────────────┘  └──────────────┘  └───────────────────────────────┘
```

### Backend
| Technology | Role |
|---|---|
| **Python 3.11+** | Core language |
| **FastAPI** | Async REST API framework (7 routers, 30+ endpoints) |
| **Uvicorn** | ASGI production server |
| **Pydantic v2** | Schema validation, settings management |
| **Beanie + Motor** | Async MongoDB ODM with document models |
| **PyMongo** | Synchronous MongoDB operations |
| **Loguru** | Structured async-safe logging |

### AI & Record Linkage
| Technology | Role |
|---|---|
| **Mistral AI** | Match explanations (XAI) and orphan event AI-suggest (operates on scrambled data only) |
| **RapidFuzz** | Jaro-Winkler, token sort ratio, partial ratio for name/address similarity |
| **Jellyfish** | Metaphone phonetic encoding for blocking key generation |
| **scikit-learn** | Logistic regression classifier for confidence scoring |
| **joblib** | Model serialization/loading |
| **NumPy** | Feature vector construction |

### NLP & Data Processing
| Technology | Role |
|---|---|
| **Unidecode** | Unicode/Kannada transliteration to ASCII for consistent normalisation |
| **PyYAML** | Rules engine — all business rules loaded from `config/rules.yaml` |
| **regex** | Advanced pattern matching for PAN, GSTIN, address parsing |
| **Faker** | Synthetic test data generation |
| **Pandas** | CSV ingestion and row-level processing |

### Security & Privacy
| Technology | Role |
|---|---|
| **HMAC-SHA256** | Deterministic PII scrambling (built-in `hmac` + `hashlib`) |
| **python-jose** | JWT token creation and verification |
| **passlib + bcrypt** | Password hashing |

### Frontend
| Technology | Role |
|---|---|
| **Next.js 15** | App Router, SSR, routing |
| **React 19** | Component architecture |
| **TypeScript** | Full type safety |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Page transitions and UI animations |
| **TanStack React Query** | Server state management and caching |
| **Zustand** | Client-side global state |
| **Axios** | HTTP client with JWT interceptor |
| **Recharts** | Analytics and dashboard charts |
| **i18next + react-i18next** | Multilingual support (EN/HI/KN) |
| **Lucide React** | Icon system |

---

## 🔄 System Workflow

```
PHASE 1 — DATA INGESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/ingest/csv?department=factories
  → Background task: run_ingestion_pipeline()
  → Per row: SHA-256 hash → idempotency check
  → normalise_name() → phonetic key (Metaphone)
  → parse_address() → locality + pin + plot
  → process_identifiers() → PAN/GSTIN validate + cross-check
  → MasterRecord.insert() into MongoDB
  → ScrambledRecord.insert() — HMAC-SHA256 all PII fields

PHASE 2 — RECORD LINKAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
generate_candidate_pairs()
  → 6 blocking strategies → inverted index → deduplicated pairs
compute_features(r1, r2)
  → 8-signal feature vector [0.0–1.0 per signal]
compute_score(features)
  → Logistic regression model (if available)
  → Weighted sum fallback (YAML weights)
  → PAN/GSTIN hard floor at 0.88

PHASE 3 — THREE-WAY RESOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
resolve_pair(score)
  → score ≥ 0.85:  auto_link → get_or_create_ubid_for_records()
  → 0.40–0.85:     review   → ReviewItem.insert() + singleton UBID
  → score < 0.40:  keep_separate
  → AuditLog.insert() for every decision

PHASE 4 — UBID ASSIGNMENT & ACTIVITY CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create_ubid_for_record() → UBID-KA-{pin}-{uuid}
  OR merge_into_ubid() → append linked_records, update anchors
classify_ubid() → time-decay scoring over joined events
  → Active | Dormant | Closed + evidence lines
  → Mistral explain_classification() on scrambled data

PHASE 5 — AI EXPLANATION (XAI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
explain_match(scr_name_a, scr_name_b, features, score, decision)
  → Mistral API called with ONLY scrambled field values
  → 2–3 sentence plain-English explanation for analyst
  → Template fallback if Mistral unavailable

PHASE 6 — HUMAN REVIEW WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /review/queue → reviewer sees pending items + AI explanations
POST /review/queue/{id}/merge → LabelledPair(label=1) + UBID merge
POST /review/queue/{id}/reject → LabelledPair(label=0) + keep separate
POST /review/queue/{id}/escalate → supervisor review

PHASE 7 — MODEL IMPROVEMENT LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
scripts/train_matcher.py
  → Load all LabelledPair documents
  → Train logistic regression on accumulated human labels
  → Save updated model to models/matcher_lr.joblib
  → Next ingestion run uses improved model automatically
```

---

## 📂 Repository Navigation Guide

```
SurakshaSetu/
│
├── README.md                                    ← You are here — full project overview
├── SETUP_GUIDE.md                               ← Installation, env setup, Docker, seeding
├── FOLDER_STRUCTURE.md                          ← Annotated map of every file
├── FEATURES_AND_IMPACT.md                       ← Deep-dive on every feature
├── requirements.txt                             ← Consolidated Python dependencies
├── .gitignore                                   ← Git exclusions
│
├── SurakshaSetu.docx                            ← Original project specification document
│
├── backend/
│   ├── .env.example                             ← Environment variable template
│   ├── Dockerfile                               ← Container definition for backend
│   ├── docker-compose.yml                       ← Full stack orchestration
│   ├── requirements.txt                         ← Backend Python packages
│   │
│   ├── app/
│   │   ├── main.py                              ← FastAPI app init, CORS, middleware, routers
│   │   ├── config.py                            ← Settings (env vars + YAML rules loader)
│   │   ├── database.py                          ← MongoDB/Beanie connection lifecycle
│   │   │
│   │   ├── core/
│   │   │   ├── auth.py                          ← JWT + bcrypt + RBAC (require_role)
│   │   │   ├── exceptions.py                    ← Validation + generic exception handlers
│   │   │   ├── i18n.py                          ← I18n middleware (EN/HI/KN translation)
│   │   │   └── logger.py                        ← Loguru structured logger config
│   │   │
│   │   ├── models/
│   │   │   ├── ubid.py                          ← ★ UBIDDocument — core identity cluster
│   │   │   ├── master_record.py                 ← Raw + normalised business record
│   │   │   ├── scrambled_record.py              ← HMAC-scrambled PII parallel record
│   │   │   ├── audit_log.py                     ← Immutable audit trail entries
│   │   │   ├── review_item.py                   ← Ambiguous match review queue item
│   │   │   ├── orphan_event.py                  ← Unresolvable event pending manual assign
│   │   │   ├── event.py                         ← Joined activity event (linked to UBID)
│   │   │   ├── labelled_pair.py                 ← Human-labelled training example
│   │   │   └── user.py                          ← User account with role
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py                          ← Login, register, me endpoints
│   │   │   ├── ingest.py                        ← CSV upload + event stream ingestion
│   │   │   ├── lookup.py                        ← UBID lookup (by UBID, PAN, GSTIN, source)
│   │   │   ├── query.py                         ← Analytics: stats, dept breakdown, activity
│   │   │   ├── review.py                        ← Match queue + orphan queue workflows
│   │   │   ├── ubid.py                          ← UBID CRUD + split + activity override
│   │   │   └── admin.py                         ← Admin: audit log, user management
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py                          ← Login/register request/response schemas
│   │   │   └── event.py                         ← Event ingestion request schema
│   │   │
│   │   └── services/
│   │       ├── ingest_pipeline.py               ← ★ Full ingestion orchestrator
│   │       ├── normaliser.py                    ← Name normalisation + Metaphone encoding
│   │       ├── address_parser.py                ← Address → plot/locality/city/pin
│   │       ├── pan_gstin.py                     ← PAN/GSTIN format validation + cross-check
│   │       ├── scrambler.py                     ← HMAC-SHA256 deterministic PII scrambling
│   │       ├── blocking.py                      ← 6-strategy multi-pass blocking
│   │       ├── matcher.py                       ← 8-signal feature vector computation
│   │       ├── scorer.py                        ← LR model + weighted sum confidence scoring
│   │       ├── resolver.py                      ← Three-way decision router + audit log
│   │       ├── ubid_manager.py                  ← Create/merge/split UBID operations
│   │       ├── classifier.py                    ← Time-decay activity classifier
│   │       ├── explainer.py                     ← Mistral XAI (operates on scrambled data)
│   │       └── event_joiner.py                  ← Join activity events to UBIDs
│   │
│   ├── config/
│   │   └── rules.yaml                           ← ★ ALL business rules (thresholds, weights)
│   │
│   ├── data/
│   │   └── sample/                              ← Sample CSVs per department
│   │       ├── factories.csv
│   │       ├── shop_establishment.csv
│   │       ├── kspcb.csv
│   │       ├── labour.csv
│   │       └── events_stream.csv
│   │
│   └── scripts/
│       ├── seed_users.py                        ← Create default admin/reviewer/viewer users
│       ├── generate_synthetic_data.py           ← Generate test CSVs with Faker
│       ├── train_matcher.py                     ← Train LR model on LabelledPair data
│       ├── full_test.py                         ← End-to-end pipeline test
│       ├── update_scrambled.py                  ← Rebuild scrambled records after seed change
│       └── clear_data.py                        ← Reset all MongoDB collections
│
├── frontend/
│   ├── SETUP.md                                 ← Frontend-specific setup notes
│   ├── middleware.ts                             ← Next.js auth middleware (JWT guard)
│   ├── next.config.js                           ← Next.js configuration
│   ├── package.json                             ← Node.js dependencies
│   │
│   ├── app/
│   │   ├── layout.tsx                           ← Root layout + providers
│   │   ├── globals.css                          ← Global styles + Tailwind
│   │   ├── page.tsx                             ← Public landing page
│   │   ├── login/page.tsx                       ← Login form
│   │   ├── register/page.tsx                    ← User registration
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                       ← Dashboard shell (sidebar + navbar)
│   │   │   └── page.tsx                         ← Main dashboard metrics + charts
│   │   ├── ubid-registry/
│   │   │   ├── page.tsx                         ← UBID search and listing
│   │   │   └── [id]/page.tsx                    ← UBID detail — linked records, history
│   │   ├── review-center/page.tsx               ← Match review + orphan event queues
│   │   ├── data-upload/page.tsx                 ← Department CSV upload interface
│   │   ├── audit-logs/page.tsx                  ← Paginated audit trail viewer
│   │   ├── user-management/page.tsx             ← Admin user management
│   │   ├── privacy-playground/page.tsx          ← HMAC scrambling demo/transparency page
│   │   └── branding/page.tsx                    ← Platform branding settings
│   │
│   ├── components/
│   │   ├── Navbar.tsx                           ← Top navigation bar
│   │   ├── Sidebar.tsx                          ← Left navigation sidebar
│   │   ├── LanguageSwitcher.tsx                 ← EN/HI/KN language toggle
│   │   └── ThemeToggle.tsx                      ← Dark/light mode toggle
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx                      ← JWT auth state + login/logout
│   │
│   ├── lib/
│   │   ├── api.ts                               ← Axios client + all typed API calls
│   │   ├── i18n.ts                              ← i18next configuration
│   │   └── utils.ts                             ← Helper utilities
│   │
│   └── locales/
│       ├── en.json                              ← English translations
│       ├── hi.json                              ← Hindi translations
│       └── kn.json                              ← Kannada translations
│
└── test_data/
    ├── sample_events.csv                        ← Activity event test data
    ├── sample_factories_master.csv              ← Factories dept test records
    ├── sample_shop_master.csv                   ← Shop & Establishment test records
    ├── test_1_new_ubids.csv                     ← Test: clean records → new UBIDs
    ├── test_2_auto_merge.csv                    ← Test: high-confidence → auto_link
    ├── test_3_ambiguous_review.csv              ← Test: mid-confidence → review queue
    ├── test_4_orphan_events.csv                 ← Test: events → orphan queue
    └── test_5_successful_events.csv             ← Test: events successfully joined
```

### Find Anything Fast

| I want to... | File |
|---|---|
| Understand the full project | `README.md` (this file) |
| Install and run locally | `SETUP_GUIDE.md` |
| Navigate every file in the codebase | `FOLDER_STRUCTURE.md` |
| Understand each feature in depth | `FEATURES_AND_IMPACT.md` |
| Change matching thresholds or weights | `backend/config/rules.yaml` |
| Modify the full ingestion pipeline | `backend/app/services/ingest_pipeline.py` |
| Change how PII is scrambled | `backend/app/services/scrambler.py` |
| Change blocking strategies | `backend/app/services/blocking.py` |
| Change scoring logic | `backend/app/services/scorer.py` |
| Change activity classification rules | `backend/app/services/classifier.py` + `rules.yaml` |
| Modify Mistral prompts | `backend/app/services/explainer.py` |
| Add a new department | `backend/config/rules.yaml` → `departments` section |
| Seed default users | `backend/scripts/seed_users.py` |
| Retrain the matcher model | `backend/scripts/train_matcher.py` |
| Configure API keys | `.env.example` → copy to `backend/.env` |

---

## ⚡ Quick Start

### Prerequisites
| Tool | Min Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18.0+ |
| MongoDB Atlas | Free tier |
| Mistral AI API key | Free at console.mistral.ai |

### 1. Clone
```bash
git clone https://github.com/your-org/surakshasetu.git
cd surakshasetu
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Fill in MongoDB URI, Mistral key, JWT secret
uvicorn app.main:app --reload --port 8000
```

### 3. Seed default users
```bash
python scripts/seed_users.py
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Access
- **App:** http://localhost:3000
- **API docs:** http://localhost:8000/docs
- **Health:** http://localhost:8000/health

> 📘 Full setup including Docker, synthetic data generation, model training: **[`SETUP_GUIDE.md`](SETUP_GUIDE.md)**

---

## 📈 Impact & Benefits

### For Karnataka Commerce & Industries

| Metric | Without SurakshaSetu | With SurakshaSetu |
|---|---|---|
| Business identity across departments | 5 separate records, no link | Single authoritative UBID |
| Duplicate inspection rate | High (same business, multiple dept visits) | Eliminated via cross-dept identity |
| PII exposure to AI systems | Raw PII sent directly | HMAC-scrambled data only — DPDPA 2023 compliant |
| Compliance decision transparency | Black-box scores | Mistral plain-English XAI for every decision |
| Review workflow | Manual email/spreadsheet coordination | Structured queue with AI-suggested resolutions |
| Matcher improvement over time | Static rules | Self-improving: reviewer labels → model retraining |
| Activity monitoring | Per-department, manually aggregated | Real-time, cross-department, decay-weighted |

### For Businesses

- **Fewer redundant inspections** — departments share identity, reducing compliance burden
- **Consistent identity** — a single UBID serves as the government-recognized identifier across all regulatory interactions
- **Faster processing** — UBID enables pre-populated forms, status visibility, and streamlined renewals

### For Analysts & Policy Teams

- **Clean, deduplicated data** for sectoral analysis
- **Activity status** (Active/Dormant/Closed) computed from real event signals — not stale registry data
- **Full audit trail** for every identity decision — defensible, reproducible, explainable

---

## 🗺️ Roadmap

- [ ] **Vector embedding search** for orphan event candidate retrieval (replace top-5 random sampling)
- [ ] **Multi-state expansion** — configurable state codes beyond Karnataka
- [ ] **Real-time event streaming** — Kafka/Redis Streams for live department event ingestion
- [ ] **DPDPA 2023 audit report** generation — automated compliance documentation
- [ ] **API gateway integration** — direct feed from department registration APIs
- [ ] **Celery + Redis** — async task queue for large-batch ingestion jobs

---

## 📄 License

Apache License 2.0 — Copyright (c) 2026 Vedant Jain and Vibha Kashyap

---

<div align="center">

<br/>

### 🛡️ One identity. Five departments. Zero ambiguity.

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=17&duration=4000&pause=1000&color=0F766E&center=true&vCenter=true&width=700&height=40&lines=Normalise.+Block.+Match.+Score.+Resolve.+Classify.;AI-powered+identity+resolution+for+public+governance." alt="Tagline" />

<br/><br/>

<img src="https://img.shields.io/badge/Built_for-Karnataka_Commerce_%26_Industries-0f766e?style=for-the-badge&labelColor=0a0f0f" />

</div>
