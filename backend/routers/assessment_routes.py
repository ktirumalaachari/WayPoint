"""WayPoint — Assessment Routes (quiz + grading)"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from db.database import get_db
from core.auth import get_current_user_id
from services.quiz_service import get_or_generate_quiz, grade_quiz

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


class SubmitQuizRequest(BaseModel):
    target_role: str
    answers: List[int]
    quiz_type: str = "initial"


@router.get("/quiz")
def get_quiz(
    target_role: str = Query(..., description="Role ID (ml, java, mern, devops, etc.)"),
    skill_level: str = Query("beginner", description="User's skill level"),
    quiz_type: str = Query("initial", description="Type of quiz (initial or final)"),
    db: Session = Depends(get_db),
):
    """Return quiz questions for a role. Correct answers are NEVER sent to client."""
    questions = get_or_generate_quiz(target_role, skill_level, quiz_type, db)
    return {"success": True, "questions": questions}


@router.post("/submit")
def submit_quiz(
    req: SubmitQuizRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Grade quiz answers server-side. Returns readiness score."""
    result = grade_quiz(req.target_role, req.answers, req.quiz_type, user_id, db)
    return {"success": True, **result}
