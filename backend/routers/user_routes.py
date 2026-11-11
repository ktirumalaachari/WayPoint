"""WayPoint — User Routes (profile, stats)"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime, timedelta, timezone
from db.database import get_db
from db.models import User, Roadmap, ProgressEvent
from core.auth import get_current_user_id

router = APIRouter(tags=["user"])


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    targetRole: Optional[str] = None
    skillLevel: Optional[str] = None
    weeklyTimeHours: Optional[int] = None
    learningStyle: Optional[str] = None
    pastExperience: Optional[str] = None
    careerGoals: Optional[str] = None
    detailedContext: Optional[dict] = None


def _build_profile_payload(user: User, xp: int, streak: int, heatmap_data: list) -> dict:
    return {
        "id": user.id,
        "name": user.name or user.email.split('@')[0],
        "email": user.email,
        "targetRole": user.target_role,
        "skillLevel": user.skill_level,
        "weeklyTimeHours": user.weekly_time_hours,
        "learningStyle": user.learning_style,
        "pastExperience": user.past_experience,
        "careerGoals": user.career_goals or "",
        "detailedContext": user.detailed_context or {},
        "isOnboarded": user.is_onboarded,
        "stats": {
            "xp": xp,
            "streak": streak,
        },
        "heatmapData": heatmap_data,
    }


def _compute_user_activity(db: Session, user_id: str) -> tuple[int, int, list]:
    # 1. Calculate XP from completed nodes across all roadmaps
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == user_id).all()
    completed_nodes_count = 0
    for rm in roadmaps:
        for _, node_data in (rm.node_map or {}).items():
            if node_data.get("status") == "completed":
                completed_nodes_count += 1

    xp = completed_nodes_count * 150  # 150 XP per completed node

    # 2. Process ProgressEvents for Heatmap and Streak
    events = (
        db.query(ProgressEvent)
        .filter(ProgressEvent.user_id == user_id)
        .order_by(ProgressEvent.created_at.desc())
        .all()
    )

    activity_by_date = {}
    for event in events:
        if event.created_at:
            date_str = event.created_at.strftime("%Y-%m-%d")
            activity_by_date[date_str] = activity_by_date.get(date_str, 0) + 1

    heatmap_data = []
    today = datetime.now(timezone.utc)
    for i in range(89, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        intensity = activity_by_date.get(date_str, 0)
        heatmap_data.append({
            "date": date_str,
            "active": intensity > 0,
            "intensity": min(4, intensity) if intensity > 0 else 0,
        })

    streak = 0
    current_date = today
    while True:
        date_str = current_date.strftime("%Y-%m-%d")
        if activity_by_date.get(date_str, 0) > 0:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            if streak == 0 and date_str == today.strftime("%Y-%m-%d"):
                current_date -= timedelta(days=1)
            else:
                break

    return xp, streak, heatmap_data


@router.get("/api/user/profile")
def get_user_profile(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return the user profile, calculated XP, streak, and 90-day heatmap data."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"success": False, "error": {"message": "User not found"}}

    xp, streak, heatmap_data = _compute_user_activity(db, user_id)
    return {
        "success": True,
        "profile": _build_profile_payload(user, xp, streak, heatmap_data),
    }


@router.patch("/api/user/profile")
def update_user_profile(
    req: UpdateProfileRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update editable profile and learner context fields."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.email is not None and req.email.strip() and req.email.strip() != user.email:
        new_email = req.email.strip()
        existing = db.query(User).filter(User.email == new_email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email address is already in use")
        user.email = new_email

    if req.name is not None:
        user.name = req.name.strip()
    if req.targetRole is not None:
        user.target_role = req.targetRole
    if req.skillLevel is not None:
        user.skill_level = req.skillLevel
    if req.weeklyTimeHours is not None:
        user.weekly_time_hours = req.weeklyTimeHours
    if req.learningStyle is not None:
        user.learning_style = req.learningStyle
    if req.pastExperience is not None:
        user.past_experience = req.pastExperience
    if req.careerGoals is not None:
        user.career_goals = req.careerGoals
    if req.detailedContext is not None:
        merged_context = dict(user.detailed_context or {})
        merged_context.update(req.detailedContext)
        user.detailed_context = merged_context
        flag_modified(user, "detailed_context")

    db.commit()
    db.refresh(user)

    xp, streak, heatmap_data = _compute_user_activity(db, user_id)
    return {
        "success": True,
        "profile": _build_profile_payload(user, xp, streak, heatmap_data),
    }
