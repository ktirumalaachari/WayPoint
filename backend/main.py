"""WayPoint — FastAPI Application Entry Point

Start: uvicorn main:app --reload --port 8000
"""

import os
import sys

# Add backend dir to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import FRONTEND_ORIGIN
from db.database import init_db

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5180",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
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


# ─── Startup ───
@app.on_event("startup")
def on_startup():
    """Server start."""
    print("[OK] WayPoint API started - database initialized (skipped create_all)")
    print(f"[OK] CORS allowed: {FRONTEND_ORIGIN}, localhost:5173")


# ─── Health Check ───
@app.get("/")
def health():
    return {"status": "ok", "service": "WayPoint API", "version": "1.0.0"}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "WayPoint API"}
