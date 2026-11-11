from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.groq_service import general_chat

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class GeneralChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("/general")
def post_general_chat(req: GeneralChatRequest):
    """Handle global chatbot queries via Groq."""
    response_text = general_chat([msg.dict() for msg in req.messages])
    return {"success": True, "message": response_text}
