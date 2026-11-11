"""WayPoint — Roadmap Routes (list, generate, update node status)"""

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Path
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from db.database import get_db
from db.models import Roadmap, User, ProgressEvent, QuizAttempt, RoadmapNode, Skill, Evidence
from core.auth import get_current_user_id
from services.groq_service import generate_roadmap, ROLE_LABELS, chat_with_node, adapt_roadmap

router = APIRouter(tags=["roadmap"])


def _advance_skills(skill_data: list, node_map: dict) -> list:
    """Distribute remaining skill gaps evenly as nodes are completed."""
    import copy

    remaining = sum(1 for n in node_map.values() if n.get("status") != "completed")
    new_skill_data = copy.deepcopy(skill_data)
    for skill in new_skill_data:
        current = skill.get("current", 0)
        target = skill.get("target", 100)
        if current < target:
            if remaining == 0:
                skill["current"] = target
            else:
                gap = target - current
                increment = max(2, int(gap / (remaining + 1)))
                skill["current"] = min(target, current + increment)
    return new_skill_data


def _sync_normalized_skills(db: Session, roadmap: Roadmap) -> None:
    """Batch-sync normalized Skill rows for a roadmap using a single query."""
    try:
        db_skills = {
            s.skill: s
            for s in db.query(Skill).filter(Skill.roadmap_id == roadmap.id).all()
        }
        for skill in (roadmap.skill_data or []):
            db_skill = db_skills.get(skill.get("skill"))
            if db_skill:
                db_skill.current = skill.get("current", 0)
                db_skill.target = skill.get("target", 100)
    except Exception as e:
        print(f"[ROADMAP] Failed to sync normalized skills: {e}")


def _sync_normalized_nodes(db: Session, roadmap: Roadmap, node_keys: Optional[list[str]] = None) -> None:
    """Batch-sync normalized RoadmapNode rows for a roadmap using a single query."""
    try:
        node_map = roadmap.node_map or {}
        query = db.query(RoadmapNode).filter(RoadmapNode.roadmap_id == roadmap.id)
        if node_keys is not None:
            query = query.filter(RoadmapNode.node_key.in_(node_keys))
        db_nodes = {n.node_key: n for n in query.all()}
        for key, db_node in db_nodes.items():
            node_data = node_map.get(key)
            if node_data:
                db_node.title = node_data.get("title", db_node.title)
                db_node.status = node_data.get("status", db_node.status)
                db_node.duration = node_data.get("duration", db_node.duration)
    except Exception as e:
        print(f"[ROADMAP] Failed to sync normalized nodes: {e}")


class GenerateRequest(BaseModel):
    target_role: str
    profile: Optional[dict] = None


class UpdateNodeRequest(BaseModel):
    status: str  # "completed" | "in_progress" | "not_started"


class UpdateModuleRequest(BaseModel):
    module_index: int
    status: str  # "not_started" | "completed"


class UpdateAllModulesRequest(BaseModel):
    status: str  # "not_started" | "completed"


class ChatRequest(BaseModel):
    query: str


class AdaptRequest(BaseModel):
    feedback: str


# ─── GET /api/roadmaps/list ───
# The most important endpoint — the entire app renders from this payload.
@router.get("/api/roadmaps/list")
def list_roadmaps(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all tracks for the user, keyed by role_id."""
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == user_id).all()

    data = {}
    for rm in roadmaps:
        data[rm.role_id] = {
            "id": rm.role_id,
            "label": rm.label,
            "status": rm.status,
            "nodeMap": rm.node_map,
            "skillData": rm.skill_data,
            "reasoning": rm.reasoning or {},
        }

    return {"success": True, "data": data}


# ─── POST /api/roadmap/generate ───
# THE AI CORE — generates a personalized roadmap with Groq LLM.
@router.post("/api/roadmap/generate")
def generate_roadmap_endpoint(
    req: GenerateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Generate a new roadmap for a target role using Groq LLM.
    If an active roadmap exists for this role, return it instead."""
    role_id = req.target_role

    # Check if an active roadmap already exists for this role
    existing = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == role_id, Roadmap.status == "active")
        .first()
    )
    if existing:
        track = {
            "id": existing.role_id,
            "label": existing.label,
            "status": existing.status,
            "nodeMap": existing.node_map,
            "skillData": existing.skill_data,
            "reasoning": existing.reasoning or {},
        }
        return {"success": True, "roadmap": track}

    # Get user profile for personalization
    user = db.query(User).filter(User.id == user_id).first()
    profile = req.profile or {}
    if user:
        profile.update({
            "skillLevel": user.skill_level or "beginner",
            "weeklyTimeHours": user.weekly_time_hours or 6,
            "learningStyle": user.learning_style or "balanced",
            "pastExperience": user.past_experience or "",
        })

    # Get latest quiz score for this role
    quiz_score = None
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id, QuizAttempt.role_id == role_id)
        .order_by(QuizAttempt.created_at.desc())
        .first()
    )
    if attempt:
        quiz_score = attempt.readiness_score

    # Generate with Groq
    track = generate_roadmap(role_id, user_profile=profile, quiz_score=quiz_score)

    # Save to DB (Denormalized)
    roadmap = Roadmap(
        user_id=user_id,
        role_id=role_id,
        label=track.get("label", ROLE_LABELS.get(role_id, role_id)),
        status="active",
        node_map=track.get("nodeMap", {}),
        skill_data=track.get("skillData", []),
        reasoning=track.get("reasoning", {}),
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    # Save to Normalized Tables (Idempotent: clean existing nodes/skills for this roadmap)
    try:
        db.query(RoadmapNode).filter(RoadmapNode.roadmap_id == roadmap.id).delete()
        db.query(Skill).filter(Skill.roadmap_id == roadmap.id).delete()

        # Insert roadmap nodes
        NODE_ORDER = ["f1", "f2", "f3", "d1", "d2", "m1", "m2", "m3"]
        node_map = track.get("nodeMap", {})
        reasoning_map = track.get("reasoning", {})
        for idx, node_key in enumerate(NODE_ORDER):
            if node_key in node_map:
                node_data = node_map[node_key]
                reason_data = reasoning_map.get(node_key, {})
                
                db_node = RoadmapNode(
                    roadmap_id=roadmap.id,
                    node_key=node_key,
                    title=node_data.get("title", ""),
                    status=node_data.get("status", "not_started"),
                    match=node_data.get("match", 100),
                    duration=node_data.get("duration", ""),
                    stage=node_data.get("stage", "learn"),
                    order_index=idx,
                    reason=reason_data.get("reason", ""),
                    prereq=reason_data.get("prereq", ""),
                    time_fit=reason_data.get("time", "")
                )
                db.add(db_node)

        # Insert skills
        skill_list = track.get("skillData", [])
        for s in skill_list:
            db_skill = Skill(
                roadmap_id=roadmap.id,
                skill=s.get("skill", ""),
                current=s.get("current", 0),
                target=s.get("target", 10)
            )
            db.add(db_skill)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[ROADMAP] Failed to save normalized roadmap nodes/skills: {e}")

    return {"success": True, "roadmap": track}


# ─── PATCH /api/roadmap/{trackId}/nodes/{nodeId} ───
@router.patch("/api/roadmap/{track_id}/nodes/{node_id}")
def update_node_status(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: UpdateNodeRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update a node's status and log the progress event."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    # Update node status in the JSONB
    node_map = dict(roadmap.node_map)
    skill_data = list(roadmap.skill_data) if roadmap.skill_data else []

    if node_id in node_map:
        old_status = node_map[node_id].get("status")

        # ─ CORE TASK 6: Backend enforcement ─
        # Prevent parent being forced to "completed" if any module is still pending
        if req.status == "completed":
            node_data = node_map[node_id]
            modules = node_data.get("modules", [])
            if modules:  # only enforce when modules exist
                all_modules_done = all(
                    m.get("status") == "completed" for m in modules
                )
                if not all_modules_done:
                    return {
                        "success": False,
                        "error": {
                            "message": "Complete all modules first before marking this step as complete.",
                            "code": "MODULES_INCOMPLETE"
                        }
                    }

        node_map[node_id] = {**node_map[node_id], "status": req.status}
        roadmap.node_map = node_map

        # If transitioning to completed, simulate skill progress
        if req.status == "completed" and old_status != "completed":
            roadmap.skill_data = _advance_skills(skill_data, node_map)
            flag_modified(roadmap, "skill_data")
            _sync_normalized_skills(db, roadmap)

        # Check if all nodes are completed -> mark track completed, otherwise active
        all_completed = all(n.get("status") == "completed" for n in node_map.values())
        if all_completed:
            roadmap.status = "completed"
        elif roadmap.status == "completed":
            roadmap.status = "active"

        flag_modified(roadmap, "node_map")
        _sync_normalized_nodes(db, roadmap, [node_id])

        db.commit()

    # Log progress event (for heatmap)
    event = ProgressEvent(
        user_id=user_id,
        roadmap_id=roadmap.id,
        node_key=node_id,
        new_status=req.status,
    )
    db.add(event)
    db.commit()

    return {"success": True, "skillData": roadmap.skill_data}


# ─── PATCH /api/roadmap/{trackId}/nodes/{nodeId}/modules ───
# CORE TASK 4: Module-level completion. Derives parent status automatically.
@router.patch("/api/roadmap/{track_id}/nodes/{node_id}/modules")
def update_module_status(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: UpdateModuleRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update a single module's completion status within a node.
    Automatically derives parent node status from all module states.
    Triggers skill progression when the parent becomes completed."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    node_map = dict(roadmap.node_map)
    node_data = node_map.get(node_id)
    if not node_data:
        return {"success": False, "error": {"message": "Node not found"}}

    modules = list(node_data.get("modules", []))

    # Validate module index
    if req.module_index < 0 or req.module_index >= len(modules):
        return {"success": False, "error": {"message": f"Invalid module_index {req.module_index}"}}

    # Update the specific module
    modules[req.module_index] = {**modules[req.module_index], "status": req.status}

    # Derive parent status from all modules (CORE TASK 2 & 4)
    all_done = all(m.get("status") == "completed" for m in modules)
    any_done = any(m.get("status") == "completed" for m in modules)
    old_parent_status = node_data.get("status", "not_started")
    new_parent_status = (
        "completed" if all_done
        else "in_progress" if any_done
        else "not_started"
    )

    # Update node in node_map
    node_map[node_id] = {**node_data, "modules": modules, "status": new_parent_status}
    roadmap.node_map = node_map

    skill_data = list(roadmap.skill_data) if roadmap.skill_data else []

    # Trigger skill progression only when parent transitions to completed
    if new_parent_status == "completed" and old_parent_status != "completed":
        roadmap.skill_data = _advance_skills(skill_data, node_map)
        flag_modified(roadmap, "skill_data")
        _sync_normalized_skills(db, roadmap)

    _sync_normalized_nodes(db, roadmap, [node_id])

    # Check if all nodes completed -> mark roadmap completed, otherwise active
    if all(n.get("status") == "completed" for n in node_map.values()):
        roadmap.status = "completed"
    elif roadmap.status == "completed" and new_parent_status != "completed":
        roadmap.status = "active"

    flag_modified(roadmap, "node_map")
    db.commit()

    # Log progress event
    event = ProgressEvent(
        user_id=user_id,
        roadmap_id=roadmap.id,
        node_key=f"{node_id}.module_{req.module_index}",
        new_status=req.status,
    )
    db.add(event)
    db.commit()

    return {
        "success": True,
        "nodeStatus": new_parent_status,
        "skillData": roadmap.skill_data,
        "nodeMap": roadmap.node_map,
    }


# ─── PATCH /api/roadmap/{trackId}/nodes/{nodeId}/modules/all ───
@router.patch("/api/roadmap/{track_id}/nodes/{node_id}/modules/all")
def update_all_modules_status(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: UpdateAllModulesRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Bulk update all modules in a node to the given status."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    node_map = dict(roadmap.node_map)
    node_data = node_map.get(node_id)
    if not node_data:
        return {"success": False, "error": {"message": "Node not found"}}

    modules = list(node_data.get("modules", []))
    
    # Update all modules
    for i in range(len(modules)):
        modules[i] = {**modules[i], "status": req.status}

    new_parent_status = req.status
    old_parent_status = node_data.get("status", "not_started")

    # Update node in node_map
    node_map[node_id] = {**node_data, "modules": modules, "status": new_parent_status}
    roadmap.node_map = node_map

    skill_data = list(roadmap.skill_data) if roadmap.skill_data else []

    # Trigger skill progression only when parent transitions to completed
    if new_parent_status == "completed" and old_parent_status != "completed":
        roadmap.skill_data = _advance_skills(skill_data, node_map)
        flag_modified(roadmap, "skill_data")
        _sync_normalized_skills(db, roadmap)

    flag_modified(roadmap, "node_map")
    _sync_normalized_nodes(db, roadmap, [node_id])

    # Check if all nodes completed -> mark roadmap completed
    if all(n.get("status") == "completed" for n in node_map.values()):
        roadmap.status = "completed"
    elif roadmap.status == "completed" and new_parent_status != "completed":
        roadmap.status = "active"

    db.commit()

    # Log progress event
    event = ProgressEvent(
        user_id=user_id,
        roadmap_id=roadmap.id,
        node_key=f"{node_id}.all_modules",
        new_status=new_parent_status,
    )
    db.add(event)
    db.commit()

    return {
        "success": True,
        "nodeStatus": new_parent_status,
        "skillData": roadmap.skill_data,
        "nodeMap": roadmap.node_map,
    }


# ─── POST /api/roadmap/{track_id}/nodes/{node_id}/chat ───

@router.post("/api/roadmap/{track_id}/nodes/{node_id}/chat")
def chat_with_node_endpoint(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: ChatRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Answer user questions contextualized to the specific roadmap node."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    node_map = roadmap.node_map or {}
    reasoning_map = roadmap.reasoning or {}

    node = node_map.get(node_id)
    if not node:
        return {"success": False, "error": {"message": "Node not found"}}

    reasoning = reasoning_map.get(node_id, {})
    
    answer = chat_with_node(req.query, node, reasoning, roadmap.label)
    
    return {"success": True, "answer": answer}


# ─── POST /api/roadmap/{track_id}/nodes/{node_id}/adapt ───
@router.post("/api/roadmap/{track_id}/nodes/{node_id}/adapt")
def adapt_roadmap_endpoint(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: AdaptRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Adapt the roadmap based on user feedback."""
    import time
    start_time = time.time()
    print(f"[API] [ADAPT] Request received for track: {track_id}, node: {node_id}, feedback: {req.feedback} at {start_time}")

    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        print(f"[API] [ADAPT] Roadmap not found for track: {track_id}, user: {user_id}")
        return {"success": False, "error": {"message": "Roadmap not found"}}

    # Build the full track dict
    track_dict = {
        "id": roadmap.role_id,
        "label": roadmap.label,
        "status": roadmap.status,
        "nodeMap": roadmap.node_map,
        "skillData": roadmap.skill_data,
        "reasoning": roadmap.reasoning or {},
    }

    adapted_track = adapt_roadmap(track_dict, node_id, req.feedback)

    # Save adapted roadmap to DB
    roadmap.node_map = adapted_track.get("nodeMap", roadmap.node_map)
    roadmap.skill_data = adapted_track.get("skillData", roadmap.skill_data)
    roadmap.reasoning = adapted_track.get("reasoning", roadmap.reasoning)

    flag_modified(roadmap, "node_map")
    flag_modified(roadmap, "skill_data")
    flag_modified(roadmap, "reasoning")

    # Batch-sync normalized nodes & skills on adaptation
    _sync_normalized_nodes(db, roadmap)
    _sync_normalized_skills(db, roadmap)

    db.commit()

    # Return a fully validated, complete track dictionary
    updated_track = {
        "id": roadmap.role_id,
        "label": roadmap.label,
        "status": roadmap.status,
        "nodeMap": roadmap.node_map,
        "skillData": roadmap.skill_data,
        "reasoning": roadmap.reasoning,
    }

    duration = time.time() - start_time
    print(f"[API] [ADAPT] Request completed for track: {track_id}, node: {node_id} in {duration:.2f}s")
    return {"success": True, "roadmap": updated_track}

# ─── DELETE /api/roadmap/{track_id} ───
@router.delete("/api/roadmap/{track_id}")
def delete_roadmap_endpoint(
    track_id: str = Path(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete a roadmap and its associated progress."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    db.query(RoadmapNode).filter(RoadmapNode.roadmap_id == roadmap.id).delete(synchronize_session=False)
    db.query(Skill).filter(Skill.roadmap_id == roadmap.id).delete(synchronize_session=False)
    db.query(ProgressEvent).filter(ProgressEvent.roadmap_id == roadmap.id).delete(synchronize_session=False)
    db.query(Evidence).filter(Evidence.roadmap_id == roadmap.id).delete(synchronize_session=False)
    db.delete(roadmap)
    db.commit()

    return {"success": True, "message": "Roadmap deleted successfully"}
