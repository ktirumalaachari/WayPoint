"""WayPoint — Database setup (SQLite + SQLAlchemy)"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite needs this for FastAPI
        echo=False,
    )
else:
    # For Supabase/PostgreSQL, force SQLAlchemy to use the installed pg8000 driver
    # and reuse warm pooled connections rather than re-handshaking TCP/TLS per request.
    real_url = DATABASE_URL
    if real_url.startswith("postgres://"):
        real_url = real_url.replace("postgres://", "postgresql+pg8000://", 1)
    elif real_url.startswith("postgresql://"):
        real_url = real_url.replace("postgresql://", "postgresql+pg8000://", 1)

    engine = create_engine(
        real_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
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
