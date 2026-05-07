# SurakshaSetu — Setup Guide

> AI-powered federated UBID platform for secure business identity  
> Karnataka Commerce & Industries | Version 1.0.0

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Structure](#repository-structure)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [Database Setup](#database-setup)
8. [Verifying the Installation](#verifying-the-installation)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| npm | 9+ | Frontend package manager |
| MongoDB Atlas | Any | Primary database (cloud) |
| Git | 2.x | Source control |

### External API Keys Required

| Service | Usage |
|---------|-------|
| **MongoDB Atlas** | Stores all master records, UBID documents, audit logs |
| **Mistral AI** | AI-powered match explanations and natural language queries |

---

## Backend Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd SurakshaSetu
```

### 2. Create a Python Virtual Environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# OR
.venv\Scripts\activate           # Windows
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the Backend `.env` File

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables)).

### 5. Verify the Installation

```bash
python -c "import fastapi, beanie, motor; print('All dependencies OK')"
```

---

## Frontend Setup

### 1. Navigate to the Frontend Directory

```bash
cd frontend
```

### 2. Install Node Dependencies

```bash
npm install --legacy-peer-deps
```

> Use `--legacy-peer-deps` to resolve peer dependency conflicts between React 19 and some packages.

### 3. Create the Frontend `.env.local` File

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Environment Variables

### Backend — `backend/.env`

```env
# ─── MongoDB Atlas ────────────────────────────────────────────────
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=suraksha_setu

# ─── Mistral AI ───────────────────────────────────────────────────
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_MODEL=mistral-small-latest

# ─── JWT Authentication ───────────────────────────────────────────
JWT_SECRET_KEY=your_super_secret_jwt_key_min_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480

# ─── PII Scrambler ────────────────────────────────────────────────
# Must be a long random string — changing this invalidates all scrambled data
SCRAMBLER_SECRET_SEED=your_random_seed_string_here

# ─── App Configuration ────────────────────────────────────────────
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
LOG_LEVEL=INFO
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> For production, replace with your deployed backend URL, e.g. `https://api.surakshasetu.gov.in`

---

## Running the Application

### Start the Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **Base URL:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/health`

### Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:3000`

### Running Both Concurrently (Optional)

```bash
# Terminal 1
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm run dev
```

---

## Database Setup

SurakshaSetu uses **MongoDB Atlas** (cloud-hosted). No local MongoDB install is needed.

### Step 1: Create a Free MongoDB Atlas Cluster

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Under **Security → Database Access**, create a user with `readWrite` on `suraksha_setu`
4. Under **Security → Network Access**, add your IP (or `0.0.0.0/0` for development)

### Step 2: Get the Connection String

From Atlas dashboard → **Connect → Drivers**, copy the connection string:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

Paste it as `MONGODB_URL` in your `backend/.env`.

### Collections Created Automatically

Beanie (the ODM) creates these collections on first run:

| Collection | Purpose |
|-----------|---------|
| `master_records` | Raw + normalised business records from all departments |
| `ubid_documents` | UBID cluster documents with merge history |
| `audit_logs` | Immutable audit trail of all decisions |
| `review_items` | Human review queue items |
| `orphan_events` | Activity events awaiting UBID assignment |
| `labelled_pairs` | Labelled match pairs for model training |
| `users` | Authentication users |

### Creating the First Admin User

After the backend is running, use the Swagger UI (`/docs`) to call `POST /api/v1/auth/register` with role `analyst`, or directly insert an admin user via the MongoDB Atlas console:

```json
{
  "username": "admin",
  "hashed_password": "<bcrypt hash>",
  "role": "admin",
  "is_active": true
}
```

---

## Verifying the Installation

### Backend Health Check

```bash
curl http://localhost:8000/health
# Expected: {"status": "ok", "service": "SurakshaSetu"}
```

### API Documentation

Visit `http://localhost:8000/docs` — you should see the full Swagger UI with all 7 router groups.

### Frontend

Visit `http://localhost:3000` — you should be redirected to the branding/landing page. Navigate to `/login` to sign in.

### Run Backend Tests

```bash
cd backend
pytest --asyncio-mode=auto -v
```

---

## Production Deployment

### Backend (Python / FastAPI)

```bash
# Production server with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or use **Gunicorn** with Uvicorn workers:

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Next.js)

```bash
cd frontend
npm run build
npm start
```

### Deployment Platforms

| Platform | Backend | Frontend |
|----------|---------|----------|
| **Vercel** | — | Recommended (auto-deploy from GitHub) |
| **Railway / Render** | Recommended | Supported |
| **AWS EC2 / GCP VM** | Full control | Full control |
| **Docker** | Use provided Dockerfile | Use provided Dockerfile |

### Environment Variables in Production

Set all variables from the `.env` template in your hosting platform's dashboard. Never commit `.env` files to version control.

---

## Troubleshooting

### `ModuleNotFoundError` on Backend Start
Ensure your virtual environment is activated: `source .venv/bin/activate`

### `CORS errors` in Browser
Confirm `NEXT_PUBLIC_API_URL` in `.env.local` matches the running backend URL exactly.

### MongoDB Connection Timeout
- Check your IP is whitelisted in Atlas Network Access
- Verify `MONGODB_URL` has the correct username/password

### `npm install` Peer Dependency Errors
Always use `npm install --legacy-peer-deps` for this project due to React 19 compatibility.

### Language Not Switching
Clear `localStorage` in DevTools → Application → Local Storage, then refresh.

### Mistral API Errors
The system gracefully falls back to template-based explanations if Mistral is unavailable. Check `MISTRAL_API_KEY` is valid.

---

*Last Updated: May 2026 | Version 1.0.0*
