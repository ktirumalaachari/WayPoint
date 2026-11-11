"""WayPoint — Database setup (SQLite + SQLAlchemy)"""

import ssl
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import DATABASE_URL

_UNSUPPORTED_PG8000_PARAMS = (
    "sslmode",
    "pgbouncer",
    "connection_limit",
    "pool_timeout",
    "channel_binding",
    "schema",
    "supa",
)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite needs this for FastAPI
        echo=False,
    )
else:
    # For Supabase/PostgreSQL, force SQLAlchemy to use the installed pg8000 driver,
    # strip libpq-only query flags (like ?sslmode=require or ?pgbouncer=true) that
    # pg8000 rejects as unexpected kwargs, and reuse pooled connections.
    parsed_url = make_url(DATABASE_URL)
    if parsed_url.drivername in ("postgres", "postgresql"):
        parsed_url = parsed_url.set(drivername="postgresql+pg8000")

    query_params = dict(parsed_url.query)
    sslmode = str(query_params.get("sslmode", "")).lower()
    for param in _UNSUPPORTED_PG8000_PARAMS:
        query_params.pop(param, None)
    parsed_url = parsed_url.set(query=query_params)

    connect_args = {}
    if sslmode in ("verify-ca", "verify-full"):
        connect_args["ssl_context"] = ssl.create_default_context()

    engine = create_engine(
        parsed_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=connect_args,
    )





SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
# Optimized query execution plan for faster retrieval

def get_db():
    """FastAPI dependency — yields a DB session, auto-closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Safe to call multiple times (IF NOT EXISTS)."""
    Base.metadata.create_all(bind=engine)
