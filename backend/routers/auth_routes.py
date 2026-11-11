"""WayPoint — Auth Routes (signup + login)"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import os
import time
import random
import smtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User
from core.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_STORE = {}

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class AuthRequest(BaseModel):
    email: str
    password: str
    name: str = None


@router.post("/signup")
def signup(req: AuthRequest, db: Session = Depends(get_db)):
    print("Signup started")
    if len(req.password) < 6:
        raise HTTPException(400, detail="Password must be at least 6 characters")

    print("Checking existing user")
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        print("User exists")
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": {
                    "code": "duplicate_email",
                    "message": "An account with this email already exists",
                },
            },
        )

    print("Hashing password")
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
    )
    print("Adding user to db")
    db.add(user)
    print("Committing db")
    db.commit()
    print("Refreshing db")
    db.refresh(user)
    print("Signup db done")

    token = create_token(user.id, user.email)

    return {
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name or user.email.split("@")[0],
            "isOnboarded": user.is_onboarded,
        },
        "token": token,
    }


@router.post("/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": {
                    "code": "invalid_credentials",
                    "message": "Invalid email or password",
                },
            },
        )

    token = create_token(user.id, user.email)

    return {
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name or user.email.split("@")[0],
            "isOnboarded": user.is_onboarded,
        },
        "token": token,
    }


class GoogleAuthRequest(BaseModel):
    email: str
    name: str = ""

@router.post("/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register a user via Google OAuth and return our Custom JWT"""
    user = db.query(User).filter(User.email == req.email).first()

    if not user:
        # Create a new user if they don't exist
        user = User(
            email=req.email,
            password_hash="GOOGLE_SSO_USER",  # Dummy hash, cannot be logged into via standard login
            name=req.name or req.email.split("@")[0],
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif req.name and not user.name:
        user.name = req.name
        db.commit()
        db.refresh(user)

    token = create_token(user.id, user.email)

    return {
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name or req.name or user.email.split("@")[0],
            "isOnboarded": user.is_onboarded,
        },
        "token": token,
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Prevent email enumeration by returning success anyway
        return {"success": True, "message": "If an account exists, an OTP was sent."}

    otp = str(random.randint(100000, 999999))
    OTP_STORE[req.email] = {
        "otp": otp,
        "expires": time.time() + 600
    }

    sender_email = os.environ.get("SMTP_EMAIL")
    sender_password = os.environ.get("SMTP_PASSWORD")

    if not sender_email or not sender_password:
        print("SMTP Credentials not configured. Simulated OTP:", otp)
        return {"success": True, "message": "OTP simulated (check server logs)"}

    msg = EmailMessage()
    msg.set_content(f"Your WayPoint password reset OTP is: {otp}\n\nIt expires in 10 minutes.\n\nIf you did not request this, please ignore this email.")
    msg["Subject"] = "WayPoint Password Reset"
    msg["From"] = sender_email
    msg["To"] = req.email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Failed to send email:", str(e))
        raise HTTPException(500, detail="Failed to send OTP email")

    return {"success": True, "message": "OTP sent"}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = OTP_STORE.get(req.email)
    if not record:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": {"message": "No OTP requested or OTP expired"}}
        )

    if time.time() > record["expires"]:
        del OTP_STORE[req.email]
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": {"message": "OTP has expired"}}
        )

    if record["otp"] != req.otp:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": {"message": "Invalid OTP"}}
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": {"message": "Password must be at least 6 characters"}}
        )

    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"message": "User not found"}}
        )

    user.password_hash = hash_password(req.new_password)
    db.commit()

    del OTP_STORE[req.email]

    return {"success": True, "message": "Password updated successfully"}
