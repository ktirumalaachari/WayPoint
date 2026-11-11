"""WayPoint — FastAPI Application Entry Point

Start: uvicorn main:app --reload --port 8000
"""

import os
import re
import sys
import traceback

# Add backend dir to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from core.config import DATABASE_URL, FRONTEND_ORIGIN
from db.database import SessionLocal, init_db

# Import routers
from routers.auth_routes import router as auth_router
from routers.onboarding_routes import router as onboarding_router
from routers.assessment_routes import router as assessment_router
from routers.roadmap_routes import router as roadmap_router
from routers.user_routes import router as user_router
from routers.chat_routes import router as chat_router

# ─── Create App ───
app = FastAPI(
    title="WayPoint API",
    description="AI Career Readiness & Adaptive Learning Path Recommender",
    version="1.0.0",
)

# ─── CORS ───
_configured_origins = [
    origin.strip().rstrip("/")
    for origin in FRONTEND_ORIGIN.split(",")
    if origin.strip()
]
_allowed_origins = list(
    dict.fromkeys(
        [
            *_configured_origins,
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5180",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ]
    )
)
_cors_origin_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"^https://[a-zA-Z0-9-]+\.vercel\.app$",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ───
# Standardized error response wrappers
app.include_router(auth_router)
app.include_router(onboarding_router)
app.include_router(assessment_router)
app.include_router(roadmap_router)
app.include_router(user_router)
app.include_router(chat_router)


def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
    normalized = origin.strip().rstrip("/")
    if normalized in _allowed_origins:
        return True
    return bool(_cors_origin_regex and re.match(_cors_origin_regex, normalized))


def _sanitized_500_message(exc: Exception) -> str:
    msg = str(exc).lower()
    if "no such table" in msg or "undefinedtable" in msg or "does not exist" in msg:
        return "Database tables are not initialized on the server."
    if any(
        token in msg
        for token in (
            "network is unreachable",
            "connection refused",
            "could not translate host",
            "getaddrinfo failed",
            "password authentication",
            "eauthtimeout",
            "timed out",
            "timeout",
            "operationalerror",
            "interfaceerror",
        )
    ):
        return (
            "Backend could not connect to the database. "
            "Check Render DATABASE_URL (use Supabase Pooler IPv4 URI on port 6543/5432, not direct IPv6 db.*.supabase.co)."
        )
    return "Internal server error on the backend."


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
    """Ensure unhandled 500s log cleanly, never leak secrets, and preserve CORS headers."""
    traceback.print_exc()
    headers = {}
    origin = request.headers.get("origin", "")
    if _is_allowed_origin(origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "internal_server_error",
                "message": _sanitized_500_message(exc),
            },
        },
        headers=headers,
    )


# ─── Startup ───
@app.on_event("startup")
def on_startup():
    """Server start."""
    if DATABASE_URL.startswith("sqlite"):
        init_db()
        print("[WARN] DATABASE_URL not set; initialized local SQLite fallback")
    else:
        print("[OK] WayPoint API started - database engine configured (skipped create_all)")
    print(f"[OK] CORS allowed: {_allowed_origins}, regex={_cors_origin_regex}")


# ─── Health Check ───
@app.get("/")
def health():
    return {"status": "ok", "service": "WayPoint API", "version": "1.0.0"}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "WayPoint API"}


@app.get("/api/health/db")
def api_health_db():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1")).scalar()
        backend_type = "sqlite" if DATABASE_URL.startswith("sqlite") else "postgresql"
        return {"status": "ok", "database": "connected", "backend": backend_type}
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "database": "unreachable",
                "message": _sanitized_500_message(exc),
            },
        )
    finally:
        db.close()
