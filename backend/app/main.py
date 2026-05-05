from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.database import connect_db, disconnect_db
from app.core.exceptions import validation_exception_handler, generic_exception_handler
from app.core.logger import logger
from app.core.i18n import I18nMiddleware

from app.routers import auth, ingest, lookup, query, review, ubid, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="SurakshaSetu",
    description=(
        "AI-powered federated UBID platform for secure business identity "
        "and real-time intelligence. Karnataka Commerce & Industries."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# i18n
app.add_middleware(I18nMiddleware)

# Exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Routers
PREFIX = "/api/v1"
app.include_router(auth.router,    prefix=f"{PREFIX}/auth",    tags=["Authentication"])
app.include_router(ingest.router,  prefix=f"{PREFIX}/ingest",  tags=["Data Ingestion"])
app.include_router(lookup.router,  prefix=f"{PREFIX}/lookup",  tags=["UBID Lookup"])
app.include_router(query.router,   prefix=f"{PREFIX}/query",   tags=["Analytics Query"])
app.include_router(review.router,  prefix=f"{PREFIX}/review",  tags=["Review Workflow"])
app.include_router(ubid.router,    prefix=f"{PREFIX}/ubid",    tags=["UBID Management"])
app.include_router(admin.router,   prefix=f"{PREFIX}/admin",   tags=["Admin"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "SurakshaSetu"}


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "SurakshaSetu",
        "version": "1.0.0",
        "docs": "/docs",
    }
