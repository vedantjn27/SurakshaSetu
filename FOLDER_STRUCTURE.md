# SurakshaSetu — Folder Structure

> Complete annotated directory layout for the SurakshaSetu platform

---

## Top-Level Layout

```
SurakshaSetu/
├── backend/                  # Python / FastAPI backend
├── frontend/                 # Next.js 15 frontend
└── README.md
```

---

## Backend

```
backend/
├── requirements.txt          # All Python dependencies (pinned versions)
├── .env.example              # Template for environment variables
│
├── config/
│   └── rules.yaml            # ALL business rules — weights, thresholds, departments
│                             #   No hardcoded values exist in Python; domain analysts
│                             #   tune this file without touching code
│
├── models/                   # (Optional) Trained ML artefacts
│   └── matcher_lr.joblib     # Logistic regression matcher (auto-loaded if present)
│
└── app/
    ├── main.py               # FastAPI app factory — registers routers, middleware, lifespan
    ├── config.py             # Pydantic Settings — reads .env, exposes rules.yaml
    ├── database.py           # Beanie / Motor MongoDB connection setup
    ├── __init__.py
    │
    ├── core/                 # Cross-cutting infrastructure
    │   ├── auth.py           # JWT creation, verification, role-based Depends()
    │   ├── exceptions.py     # Global exception handlers
    │   ├── i18n.py           # Accept-Language middleware (EN / HI / KN)
    │   └── logger.py         # Loguru logger configuration
    │
    ├── models/               # Beanie ODM documents (MongoDB collections)
    │   ├── master_record.py  # Raw + normalised business record from any department
    │   ├── ubid.py           # UBID cluster document with linked_records & merge_history
    │   ├── audit_log.py      # Immutable audit entry for every system decision
    │   ├── review_item.py    # Human review queue item (ambiguous matches)
    │   ├── orphan_event.py   # Activity event awaiting UBID assignment
    │   ├── labelled_pair.py  # Labelled match pair for future model training
    │   ├── event.py          # Activity event linked to a UBID
    │   └── __init__.py
    │
    ├── schemas/              # Pydantic request/response schemas (API contract)
    │   ├── auth.py           # TokenResponse, UserResponse, RegisterRequest
    │   ├── event.py          # Event ingestion and query schemas
    │   └── __init__.py
    │
    ├── routers/              # FastAPI route handlers (one file per domain)
    │   ├── auth.py           # POST /auth/login, GET /auth/me, POST /auth/register
    │   ├── ingest.py         # POST /ingest/csv, POST /ingest/events, GET /ingest/status/{job_id}
    │   ├── ubid.py           # GET /ubid/list, GET /ubid/{id}, GET /ubid/{id}/network
    │   ├── lookup.py         # GET /lookup — cross-department UBID lookup
    │   ├── query.py          # POST /query/ask — AI natural language queries
    │   ├── review.py         # GET /review/queue, POST /review/decide, GET /review/orphans
    │   ├── admin.py          # GET /admin/stats, GET /admin/audit, POST /admin/scramble
    │   └── __init__.py
    │
    └── services/             # Business logic layer (pure functions + async services)
        ├── ingest_pipeline.py  # Orchestrates full CSV ingestion: normalise → block → match → resolve
        ├── normaliser.py       # Business name normalisation, abbreviation expansion, Metaphone keys
        ├── address_parser.py   # Structured address parsing (plot, locality, city, PIN)
        ├── pan_gstin.py        # PAN / GSTIN format validation and cross-check
        ├── blocking.py         # Candidate pair blocking (PIN code + phonetic key buckets)
        ├── matcher.py          # Feature extraction: Jaro-Winkler, token-sort, exact-match signals
        ├── scorer.py           # Confidence scoring — logistic regression model or weighted sum
        ├── resolver.py         # Auto-link / review-queue / keep-separate routing by score
        ├── ubid_manager.py     # Create, merge, split, and anchor UBID clusters
        ├── event_joiner.py     # Join incoming activity events to existing UBIDs
        ├── classifier.py       # Business activity classification (Active / Dormant / Closed)
        ├── explainer.py        # Mistral AI explanations for match decisions (PII-safe)
        ├── scrambler.py        # Deterministic HMAC-SHA256 PII scrambling / unscrambling
        └── __init__.py
```

---

## Frontend

```
frontend/
├── package.json              # Dependencies and npm scripts
├── package-lock.json
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS + custom design tokens
├── tsconfig.json             # TypeScript configuration
├── postcss.config.js
├── middleware.ts             # Route protection — redirects unauthenticated users to /login
├── .env.example              # NEXT_PUBLIC_API_URL template
├── .gitignore
│
├── app/                      # Next.js 15 App Router
│   ├── layout.tsx            # Root layout — wraps app in AuthProvider + i18next
│   ├── page.tsx              # Root redirect → /branding
│   ├── globals.css           # Global styles and Tailwind base
│   │
│   ├── branding/
│   │   └── page.tsx          # Public landing / marketing page
│   │
│   ├── login/
│   │   └── page.tsx          # Role-based login (Admin / Reviewer / Analyst)
│   │
│   ├── register/
│   │   └── page.tsx          # Self-service analyst account registration
│   │
│   └── dashboard/            # Protected area (requires JWT)
│       ├── layout.tsx        # Dashboard shell — Sidebar + Navbar
│       ├── page.tsx          # KPI dashboard with live stats and AI query bar
│       │
│       ├── ubid-registry/
│       │   ├── page.tsx      # Searchable UBID list with pagination
│       │   └── [id]/
│       │       └── page.tsx  # 360° UBID profile — linked records, network, events
│       │
│       ├── data-upload/
│       │   └── page.tsx      # Drag-and-drop CSV ingestion with live job tracking
│       │
│       ├── review-center/
│       │   └── page.tsx      # Human review queue — approve / reject / escalate matches
│       │
│       ├── audit-logs/
│       │   └── page.tsx      # Searchable audit trail with colour-coded action types
│       │
│       ├── privacy-playground/
│       │   └── page.tsx      # PII scrambler / unscrambler demo (admin only)
│       │
│       └── user-management/
│           └── page.tsx      # User account management (admin only)
│
├── components/               # Shared React components
│   ├── Navbar.tsx            # Top bar — language switcher, user menu, breadcrumbs
│   ├── Sidebar.tsx           # Role-aware navigation sidebar
│   ├── ThemeToggle.tsx       # Dark / light mode toggle
│   └── LanguageSwitcher.tsx  # EN / हिन्दी / ಕನ್ನಡ dropdown
│
├── contexts/
│   └── AuthContext.tsx       # Auth state — login(), logout(), currentUser, role
│
├── lib/
│   ├── api.ts                # Axios instance — JWT header, Accept-Language, 401 redirect
│   ├── i18n.ts               # i18next initialisation with namespace loading
│   └── utils.ts              # Shared utility functions (cn, formatDate, etc.)
│
├── locales/                  # Translation files
│   ├── en.json               # English (default)
│   ├── hi.json               # Hindi — हिन्दी
│   └── kn.json               # Kannada — ಕನ್ನಡ
│
└── public/
    └── images/
        ├── logo.png              # SurakshaSetu brand logo
        ├── hero-bg.jpg           # Landing page hero background
        ├── login-bg.jpg          # Login page background
        ├── dashboard-bg.jpg      # Dashboard background
        ├── network-bg.jpg        # Network graph visual
        ├── how_it_works.png      # Explainer diagram
        └── secure_identity_network.png
```

---

## Key Configuration File: `rules.yaml`

`backend/config/rules.yaml` is the single source of truth for all business logic parameters. No thresholds or weights are hardcoded in Python.

```
config/
└── rules.yaml
    ├── matching
    │   ├── auto_link_threshold      # Score ≥ 0.85 → auto-link records to same UBID
    │   ├── review_threshold         # Score 0.40–0.85 → send to human review queue
    │   ├── feature_weights          # Per-feature weights (PAN: 0.30, GSTIN: 0.28, ...)
    │   └── pan_gstin_hard_floor     # PAN/GSTIN exact match sets minimum score of 0.88
    │
    ├── activity_classification
    │   ├── active_min_score         # Activity score ≥ 0.35 → Active
    │   ├── closed_max_score         # Activity score ≤ 0.05 → Closed
    │   └── event_weights            # Per-event-type weights with half-life decay
    │
    ├── departments                  # Registered source departments and their schemas
    │   ├── shop_establishment
    │   ├── factories
    │   ├── labour
    │   ├── kspcb
    │   └── bescom
    │
    ├── valid_pin_codes              # Whitelist of accepted Karnataka PIN codes
    ├── locality_synonyms            # Canonical locality name mappings
    └── abbreviations                # Business name abbreviation expansions
```

---

*Last Updated: May 2026 | Version 1.0.0*
