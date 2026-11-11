import urllib.request
import json
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, Roadmap, QuizAttempt, ProgressEvent, Evidence
from fastapi import status
"""WayPoint — Authentication helpers (JWT + hashing)"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash password using SHA256 with salt. Simple + works everywhere."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a salted SHA256 hash."""
    try:
        salt, stored_hash = hashed.split("$", 1)
        return hashlib.sha256((salt + plain).encode()).hexdigest() == stored_hash
    except (ValueError, AttributeError):
        return False


def create_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Prepared payload structure for future OAuth expansion
def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.JWTError as e:
        print(f"[AUTH] Token signature verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token signature",
        )


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> str:
    """FastAPI dependency - extracts user_id from the Bearer token.
    Throws HTTP 401 if missing, invalid, or expired.
    Auto-provisions or reconciles the user in database if they do not exist."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization credentials",
        )
    payload = decode_token(credentials.credentials)
    user_id = payload["sub"]
    email = payload.get("email", "")
    
    # CASE 1: JWT UUID exists in users
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        # CASE 2: JWT UUID exists in users BUT belongs to a different email
        if email and user.email != email:
            print(f"[AUTH] ID conflict: JWT UUID {user_id} belongs to a different email {user.email} in database (JWT email is {email})")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Authentication UUID conflict: ID belongs to a different email address.",
            )
        return user_id

    # CASE 3: JWT UUID does not exist BUT the JWT email already exists in users under another UUID
    existing_by_email = db.query(User).filter(User.email == email).first() if email else None
    if existing_by_email:
        old_id = existing_by_email.id
        print(f"[AUTH] Re-registration detected for {email}. Reconciling old UUID {old_id} to new Supabase UUID {user_id}...")
        
        try:
            # Perform reconciliation atomically in a single transaction
            # Update User ID
            db.query(User).filter(User.id == old_id).update({User.id: user_id}, synchronize_session=False)
            
            # Cascade User ID update to related tables referencing user_id
            db.query(Roadmap).filter(Roadmap.user_id == old_id).update({Roadmap.user_id: user_id}, synchronize_session=False)
            db.query(QuizAttempt).filter(QuizAttempt.user_id == old_id).update({QuizAttempt.user_id: user_id}, synchronize_session=False)
            db.query(ProgressEvent).filter(ProgressEvent.user_id == old_id).update({ProgressEvent.user_id: user_id}, synchronize_session=False)
            db.query(Evidence).filter(Evidence.user_id == old_id).update({Evidence.user_id: user_id}, synchronize_session=False)
            
            db.commit()
            print(f"[AUTH] Successfully reconciled existing user {email} from old UUID {old_id} to new UUID {user_id}")
        except Exception as e:
            db.rollback()
            print(f"[AUTH] Failed to reconcile user credentials for {email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reconcile user credentials.",
            )
    else:
        # CASE 4: Neither JWT UUID nor email exists - Auto-provision new user normally
        try:
            user = User(
                id=user_id,
                email=email or f"user_{user_id[:8]}@waypoint.ai",
                password_hash="supabase_auth",  # unused placeholder
                name=email.split("@")[0] if email else "Learner",
                is_onboarded=False
            )
            db.add(user)
            db.commit()
            print(f"[AUTH] Auto-provisioned new user: {user_id} ({user.email})")
        except Exception as e:
            db.rollback()
            print(f"[AUTH] Failed to create new user record: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user account.",
            )
            
    return user_id
