"""WayPoint — Onboarding Routes"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User
from core.auth import get_current_user_id

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class ProfileData(BaseModel):
    name: str = ""
    email: str = ""
    targetRole: str = ""
    skillLevel: str = "beginner"
    weeklyTimeHours: int = 6
    learningStyle: str = ""
    pastExperience: str = ""
    careerGoals: str = ""
    detailedContext: Optional[dict] = None

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    role_id: str
    messages: list[ChatMessage]


@router.post("/confirm")
def confirm_onboarding(
    profile: ProfileData,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        # If demo mode (no auth), create a user on the fly
        user = User(id=user_id, email=profile.email or "demo@waypoint.ai", password_hash="demo")
        db.add(user)

    user.name = profile.name
    user.email = profile.email or user.email
    user.target_role = profile.targetRole
    user.skill_level = profile.skillLevel
    user.weekly_time_hours = profile.weeklyTimeHours
    user.learning_style = profile.learningStyle
    user.past_experience = profile.pastExperience
    user.career_goals = profile.careerGoals
    user.detailed_context = profile.detailedContext
    user.is_onboarded = True

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "profile": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "targetRole": user.target_role,
            "skillLevel": user.skill_level,
            "weeklyTimeHours": user.weekly_time_hours,
            "learningStyle": user.learning_style,
            "pastExperience": user.past_experience,
            "careerGoals": user.career_goals,
            "detailedContext": user.detailed_context,
            "isOnboarded": True,
        },
    }

from services.groq_service import onboarding_chat

@router.post("/chat")
def handle_onboarding_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.name if user and user.name else "Learner"
    
    # Dynamic token limit allocated based on context length
    # Call Groq service
    result = onboarding_chat(req.messages, req.role_id, user_name)
    
    # result can be a string (next message) or a dict (extracted profile)
    if isinstance(result, dict) and result.get("done"):
        return {"success": True, "done": True, "profile": result.get("profile", {})}
        
    return {"success": True, "done": False, "message": result}
