"""WayPoint — Groq LLM Service (roadmap generation + quiz generation)

This is the AI core. Every LLM call goes through here.
Anti-hallucination: curated courses injected into prompts, JSON mode,
Pydantic validation, deterministic fallbacks.
"""

import json
import re
import os
import traceback
from typing import Optional
from pydantic import BaseModel, Field
from typing import Dict, List, Literal
from groq import Groq
from core.config import GROQ_API_KEY, GROQ_MODEL

# ─── Groq Client ───
client = Groq(api_key=GROQ_API_KEY, timeout=30.0)

# Faster model for conversational chat (low-latency interactions)
CHAT_MODEL = GROQ_MODEL

def strip_think_tags(text: str) -> str:
    """Remove <think>...</think> tags from reasoning models."""
    if not text:
        return text
    # Remove standard <think> tags
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    # Remove bracketed reasoning blocks like [Self-Correction/Verification during thought]...
    # This matches a block starting with [Self-Correction at the start of string or after a newline, followed by some text,
    # and then lines starting with '-', until a line that doesn't start with '-'
    text = re.sub(r'\[Self-Correction.*?\]\n(?:- .*?\n)*', '', text, flags=re.DOTALL)
    
    # Alternatively, just remove all lines before the final actual response if the model is hallucinating heavily,
    # but that's risky. The regex above specifically targets the pattern in the screenshot.
    # Let's use a simpler regex that matches the exact pattern seen:
    text = re.sub(r'\[Self-Correction.*?\][\s\S]*?(?=\n\n|\Z)', '', text)
    
    # Clean up any leftover "[Self-Correction...]"
    text = re.sub(r'\[Self-Correction/Verification during thought\](\n- .*)*', '', text)
    
    return text.strip()

def extract_json(text: str) -> str:
    """Extract JSON from LLM response which might contain markdown fences or extra text."""
    text = text.strip()
    
    # Fast path: if it already looks like pure JSON
    if (text.startswith('{') and text.endswith('}')) or (text.startswith('[') and text.endswith(']')):
        return text
        
    start_idx = -1
    end_idx = -1
    for i, char in enumerate(text):
        if char in ('{', '['):
            start_idx = i
            break
    if start_idx != -1:
        for i in range(len(text)-1, -1, -1):
            if text[i] in ('}', ']'):
                end_idx = i
                break
    
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        return text[start_idx:end_idx+1]
    return text

# ─── Load curated courses ───
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

with open(os.path.join(DATA_DIR, "courses.json"), "r", encoding="utf-8") as f:
    CURATED_COURSES = json.load(f)

# ─── Load fallback roadmaps ───
FALLBACKS = {}
fallback_path = os.path.join(DATA_DIR, "fallbacks.json")
if os.path.exists(fallback_path):
    with open(fallback_path, "r", encoding="utf-8") as f:
        FALLBACKS = json.load(f)

# ─── Role ID → Label mapping ───
ROLE_LABELS = {
    "ml": "Machine Learning",
    "java": "Java Backend",
    "python": "Python Foundations",
    "mern": "MERN Stack",
    "devops": "DevOps Engineering",
    "cloud": "Cloud Engineering",
    "uiux": "UI/UX Design",
    "data": "Data Analytics",
    "cyber": "Cybersecurity",
}


# ─── Pydantic Schemas for validation ───
class ModuleSchema(BaseModel):
    title: str
    status: str = "not_started"  # "not_started" | "completed"


class NodeSchema(BaseModel):
    title: str
    status: str = "not_started"
    match: int = Field(ge=0, le=100)
    duration: str
    stage: Literal["learn", "build", "prove"]
    modules: List[ModuleSchema] = []  # replaces syllabus — tracks per-topic completion
    resources: List[str] = []


class SkillSchema(BaseModel):
    skill: str
    current: int = Field(ge=0, le=100)
    target: int = Field(ge=0, le=100)


class ReasoningSchema(BaseModel):
    reason: str
    prereq: str
    time: str


class TrackSchema(BaseModel):
    label: str
    nodeMap: Dict[str, NodeSchema]
    skillData: List[SkillSchema]
    reasoning: Dict[str, ReasoningSchema]


class QuizQuestionSchema(BaseModel):
    q: str
    options: List[str]
    correct: int = Field(ge=0, le=3)


# ─── Helper: filter courses by role ───
def get_courses_for_role(role_id: str) -> list:
    """Filter curated courses relevant to a role."""
    role_tags = {
        "ml": ["python", "statistics", "ml", "machine-learning", "data-science", "pandas", "numpy", "data-viz", "scikit-learn", "deep-learning"],
        "java": ["java", "oop", "spring-boot", "rest-api", "jpa", "hibernate", "testing", "junit", "collections"],
        "python": ["python", "automation", "data-structures", "oop"],
        "mern": ["html", "css", "javascript", "react", "nodejs", "express", "mongodb", "mern", "auth", "jwt", "docker", "deployment"],
        "devops": ["linux", "networking", "bash", "docker", "containers", "cicd", "kubernetes", "monitoring", "devops", "terraform"],
        "cloud": ["cloud", "aws", "terraform", "docker", "kubernetes", "devops"],
        "uiux": ["figma", "uiux", "design", "ux-research", "typography", "prototyping", "design-thinking"],
        "data": ["data-analytics", "python", "sql", "excel", "tableau", "powerbi", "data-viz", "statistics"],
        "cyber": ["cybersecurity", "security", "networking", "ethical-hacking", "linux", "cryptography", "penetration-testing"],
    }
    tags = role_tags.get(role_id, ["python", "programming"])
    return [c for c in CURATED_COURSES if any(t in c.get("tags", []) for t in tags)]


# ─── ROADMAP GENERATION ───
def generate_roadmap(
    role_id: str,
    user_profile: Optional[dict] = None,
    quiz_score: Optional[int] = None,
) -> dict:
    """Generate a personalized roadmap using Groq LLM.
    Returns a Track dict matching the frontend schema.
    Falls back to static data on any failure."""

    label = ROLE_LABELS.get(role_id, role_id.replace("-", " ").title())
    courses = get_courses_for_role(role_id)
    course_list = "\n".join([f"- {c['title']} ({c['provider']}, {c['difficulty']}, ~{c['duration_hours']}hrs)" for c in courses[:20]])

    profile_context = ""
    if user_profile:
        profile_context = f"""
User Profile:
- Skill Level: {user_profile.get('skillLevel', 'beginner')}
- Weekly Hours Available: {user_profile.get('weeklyTimeHours', 6)}
- Learning Style: {user_profile.get('learningStyle', 'balanced')}
- Past Experience: {user_profile.get('pastExperience', 'None specified')}
"""
    if quiz_score is not None:
        profile_context += f"- Quiz Readiness Score: {quiz_score}%\n"

    system_prompt = f"""You are an expert technical career coach. Generate a personalized learning roadmap for someone aiming for the role: "{label}".

{profile_context}

AVAILABLE VERIFIED COURSES (use these for inspiration on node titles — do NOT invent fake course names):
{course_list}

You MUST return ONLY a raw JSON object (no markdown, no explanation, no intro) with this EXACT structure:

{{
  "label": "{label}",
  "nodeMap": {{
    "f1": {{ "title": "Step name", "status": "not_started", "match": 85, "duration": "2 wks", "stage": "learn", "modules": [{{"title": "Variables & data types", "status": "not_started"}}, {{"title": "Control flow & loops", "status": "not_started"}}, {{"title": "Functions & scope", "status": "not_started"}}], "resources": ["YouTube: FreeCodeCamp Full Course"] }},
    "f2": {{ "title": "Step name", "status": "not_started", "match": 88, "duration": "1.5 wks", "stage": "learn", "modules": [{{"title": "Core concept A for this module", "status": "not_started"}}, {{"title": "Core concept B for this module", "status": "not_started"}}, {{"title": "Hands-on practice exercises", "status": "not_started"}}], "resources": ["YouTube: Traversy Media"] }},
    "f3": {{ "title": "Step name", "status": "not_started", "match": 82, "duration": "1 wk", "stage": "learn", "modules": [{{"title": "Specific sub-skill 1", "status": "not_started"}}, {{"title": "Specific sub-skill 2", "status": "not_started"}}, {{"title": "Real-world application", "status": "not_started"}}], "resources": ["Coursera: Relevant Course"] }},
    "d1": {{ "title": "Step name", "status": "not_started", "match": 90, "duration": "2 wks", "stage": "build", "modules": [{{"title": "Building feature X", "status": "not_started"}}, {{"title": "Integrating with Y", "status": "not_started"}}, {{"title": "Testing & debugging", "status": "not_started"}}], "resources": ["YouTube: Tech With Tim"] }},
    "d2": {{ "title": "Step name", "status": "not_started", "match": 86, "duration": "1.5 wks", "stage": "build", "modules": [{{"title": "Architecture patterns", "status": "not_started"}}, {{"title": "Data modeling", "status": "not_started"}}, {{"title": "API design", "status": "not_started"}}], "resources": ["YouTube: Fireship"] }},
    "m1": {{ "title": "Step name", "status": "not_started", "match": 84, "duration": "2 wks", "stage": "build", "modules": [{{"title": "Advanced technique 1", "status": "not_started"}}, {{"title": "Performance optimization", "status": "not_started"}}, {{"title": "Production best practices", "status": "not_started"}}], "resources": ["YouTube: The Net Ninja"] }},
    "m2": {{ "title": "Step name", "status": "not_started", "match": 80, "duration": "1 wk", "stage": "prove", "modules": [{{"title": "Portfolio project planning", "status": "not_started"}}, {{"title": "Code review practices", "status": "not_started"}}, {{"title": "Documentation", "status": "not_started"}}], "resources": ["GitHub: Awesome Lists"] }},
    "m3": {{ "title": "Step name", "status": "not_started", "match": 95, "duration": "2 wks", "stage": "prove", "modules": [{{"title": "End-to-end capstone project", "status": "not_started"}}, {{"title": "Deployment & CI/CD", "status": "not_started"}}, {{"title": "Interview preparation", "status": "not_started"}}], "resources": ["YouTube: Clever Programmer"] }}
  }},
  "skillData": [
    {{ "skill": "Skill Name", "current": 20, "target": 85 }},
    {{ "skill": "Skill Name", "current": 15, "target": 90 }},
    {{ "skill": "Skill Name", "current": 10, "target": 80 }},
    {{ "skill": "Skill Name", "current": 5, "target": 75 }},
    {{ "skill": "Skill Name", "current": 8, "target": 85 }},
    {{ "skill": "Skill Name", "current": 3, "target": 70 }}
  ],
  "reasoning": {{
    "f1": {{ "reason": "Why this step is important for the user", "prereq": "What comes before this", "time": "How it fits their schedule" }},
    "f2": {{ "reason": "...", "prereq": "...", "time": "..." }},
    "f3": {{ "reason": "...", "prereq": "...", "time": "..." }},
    "d1": {{ "reason": "...", "prereq": "...", "time": "..." }},
    "d2": {{ "reason": "...", "prereq": "...", "time": "..." }},
    "m1": {{ "reason": "...", "prereq": "...", "time": "..." }},
    "m2": {{ "reason": "...", "prereq": "...", "time": "..." }},
    "m3": {{ "reason": "...", "prereq": "...", "time": "..." }}
  }}
}}

CRITICAL RULES:
1. nodeMap MUST have EXACTLY 8 keys: f1, f2, f3, d1, d2, m1, m2, m3
2. f1-f3 = foundations (stage "learn"), d1-d2 = core build (stage "build"), m1 = advanced build, m2-m3 = capstone (stage "prove")
3. skillData MUST have exactly 5-6 skills relevant to the "{label}" role
4. "current" scores should reflect a beginner's typical starting point (lower if quiz score is low)
5. "target" scores should reflect what's needed for job readiness
6. match scores (0-100) indicate how well each step fits the user's profile
7. duration should be realistic (e.g. "1 wk", "1.5 wks", "2 wks", "3 wks")
8. reasoning must be personalized, practical, and specific — not generic
9. All node statuses must be "not_started"
10. modules MUST be an array of 3-5 objects, each with "title" (SPECIFIC, REAL topic) and "status": "not_started". NEVER use generic placeholders like "Topic A", "Topic B", "Topic 1". Each module title MUST be a concrete, descriptive topic name (e.g., "CSS Flexbox & Grid layouts", "RESTful API design patterns")
11. resources MUST be an array of 2-3 specific real-world resources (e.g., actual YouTube channels, free courses, books)
12. Return ONLY the JSON. No extra text."""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate a personalized {label} learning roadmap."},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=4096,
        )

        raw = response.choices[0].message.content
        raw = strip_think_tags(raw)
        raw = extract_json(raw)
        print(f"[GROQ] Raw response in generate_roadmap:\n{raw}\n")
        data = json.loads(raw)

        # Validate with Pydantic
        validated = TrackSchema(**data)

        # Check we have exactly 8 nodes
        required_keys = {"f1", "f2", "f3", "d1", "d2", "m1", "m2", "m3"}
        if set(validated.nodeMap.keys()) != required_keys:
            print(f"[GROQ] Missing node keys: {required_keys - set(validated.nodeMap.keys())}")
            raise ValueError("nodeMap doesn't have exactly 8 required keys")

        # Build final track dict
        node_map = {k: v.model_dump() for k, v in validated.nodeMap.items()}
        
        # Robust fallback for resources/modules in case LLM forgets them
        GENERIC_MODULE_TITLES = {"topic a", "topic b", "topic c", "topic 1", "topic 2", "topic 3",
                                 "fundamentals of this module", "key concepts and best practices",
                                 "hands-on application", "core concept a for this module",
                                 "core concept b for this module", "specific sub-skill 1",
                                 "specific sub-skill 2"}
        for node_key, node_val in node_map.items():
            if not node_val.get("resources"):
                title = node_val.get("title", "this topic")
                node_val["resources"] = [f"YouTube: {title} Tutorial", "Coursera / Udemy"]
            # Fix generic/placeholder module titles
            modules = node_val.get("modules", [])
            if modules:
                has_generic = any(
                    (m.get("title") or "").strip().lower() in GENERIC_MODULE_TITLES
                    for m in modules
                )
                if has_generic:
                    node_title = node_val.get("title", "Module")
                    node_val["modules"] = [
                        {"title": f"{node_title} — core concepts", "status": "not_started"},
                        {"title": f"{node_title} — practical exercises", "status": "not_started"},
                        {"title": f"{node_title} — real-world projects", "status": "not_started"},
                    ]
            elif not modules:
                # LLM returned empty modules — generate sensible defaults
                node_title = node_val.get("title", "Module")
                node_val["modules"] = [
                    {"title": f"{node_title} — fundamentals", "status": "not_started"},
                    {"title": f"{node_title} — hands-on practice", "status": "not_started"},
                    {"title": f"{node_title} — applied project", "status": "not_started"},
                ]

        track = {
            "id": role_id,
            "label": validated.label,
            "status": "active",
            "nodeMap": node_map,
            "skillData": [s.model_dump() for s in validated.skillData],
            "reasoning": {k: v.model_dump() for k, v in validated.reasoning.items()},
        }
        return track

    except Exception as e:
        print(f"[GROQ] Roadmap generation failed: {e}")
        traceback.print_exc()
        return get_fallback_roadmap(role_id)


def generate_quiz_questions(role_id: str, count: int = 10, skill_level: str = "beginner", quiz_type: str = "initial") -> list:
    """Generate exactly `count` quiz questions for a role using Groq, iterating if it returns fewer."""
    label = ROLE_LABELS.get(role_id, role_id.replace("-", " ").title())
    
    validated = []
    max_attempts = 3
    attempt = 0
    
    while len(validated) < count and attempt < max_attempts:
        needed = count - len(validated)
        
        if quiz_type == "final":
            system_prompt = f"""You are a rigorous technical examiner. Generate EXACTLY {needed} multiple-choice capstone questions to verify if the user is truly job-ready for the "{label}" role at the "{skill_level}" level. 
These questions MUST BE scenario-based, highly challenging, and test deep practical knowledge, architecture, and debugging skills. Do not ask basic definitions.

Return ONLY a raw JSON object with this structure:
{{
  "questions": [
    {{
      "q": "Clear, practical question about a core concept",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    }}
  ]
}}

RULES:
1. You MUST generate EXACTLY {needed} questions — no more, no less
2. Questions should test PRACTICAL understanding, not trivia
3. Each question must have exactly 4 options
4. "correct" is the 0-based index of the correct answer (0, 1, 2, or 3)
5. Cover different key skills relevant to "{label}"
6. Questions should be clear and unambiguous
7. Options should be plausible (no obviously wrong answers)
8. Return ONLY the JSON. No markdown, no explanation."""
        else:
            system_prompt = f"""You are a friendly skill assessor. Generate EXACTLY {needed} multiple-choice questions to assess the user's current level for the "{label}" role at the "{skill_level}" level.
Questions should cover foundational concepts to gauge where the user stands.

Return ONLY a raw JSON object with this structure:
{{
  "questions": [
    {{
      "q": "Clear question about a core concept",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    }}
  ]
}}

RULES:
1. You MUST generate EXACTLY {needed} questions — no more, no less
2. Questions should test foundational understanding
3. Each question must have exactly 4 options
4. "correct" is the 0-based index of the correct answer (0, 1, 2, or 3)
5. Cover different key skills relevant to "{label}"
6. Questions should be clear and unambiguous
7. Options should be plausible (no obviously wrong answers)
8. Return ONLY the JSON. No markdown, no explanation."""

        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate EXACTLY {needed} questions. Return exactly {needed} questions in the JSON array."},
                ],
                response_format={"type": "json_object"},
                # Tuned temperature for deterministic roadmap outputs
                temperature=0.6,
                max_tokens=4096,
            )

            raw = response.choices[0].message.content
            raw = strip_think_tags(raw)
            raw = extract_json(raw)
            data = json.loads(raw)
            questions = data.get("questions", [])

            for q in questions[:needed]:
                try:
                    parsed = QuizQuestionSchema(**q)
                    validated.append(parsed.model_dump())
                except Exception:
                    continue
                    
            if len(validated) >= count:
                return validated[:count]
                
        except Exception as e:
            print(f"[GROQ] Quiz chunk attempt {attempt + 1} failed: {e}")
            
        attempt += 1

    # Last resort fallback if we STILL couldn't get enough questions after all attempts
    if len(validated) < count:
        fallback = get_fallback_quiz(role_id, skill_level, count)
        while len(validated) < count and fallback:
            validated.append(fallback.pop(0))

    return validated[:count]


# ─── ADAPT ROADMAP ───
# ─── ADAPT ROADMAP ───
def compress_duration(duration_str: str) -> str:
    """Shorten a duration label, e.g. '2 wks' -> '1 wk', '1.5 wks' -> '1 wk', '1 wk' -> '3 days'"""
    import re
    m = re.match(r'([\d.]+)\s*(wk|wks|week|weeks|day|days)', duration_str.lower())
    if m:
        val = float(m.group(1))
        unit = m.group(2)
        if 'day' in unit:
            new_val = max(1, int(val * 0.7))
            return f"{new_val} days" if new_val > 1 else "1 day"
        else:
            new_val = val * 0.7
            if new_val < 1.0:
                days = max(2, int(new_val * 7))
                return f"{days} days"
            else:
                formatted = float(f"{new_val:.1f}")
                if formatted == 1.0:
                    return "1 wk"
                return f"{formatted} wks"
    return "1 wk"

def expand_duration(duration_str: str) -> str:
    """Lengthen a duration label, e.g. '2 wks' -> '3 wks', '1 wk' -> '2 wks'"""
    import re
    m = re.match(r'([\d.]+)\s*(wk|wks|week|weeks|day|days)', duration_str.lower())
    if m:
        val = float(m.group(1))
        unit = m.group(2)
        if 'day' in unit:
            new_val = int(val * 1.5)
            return f"{new_val} days"
        else:
            new_val = val * 1.5
            formatted = float(f"{new_val:.1f}")
            if formatted == 1.0:
                return "1 wk"
            return f"{formatted} wks"
    return "3 wks"

def programmatic_adapt_roadmap(track_dict: dict, node_id: str, feedback_type: str) -> dict:
    """Programmatic adaptation when feedback is received. No LLM calls.
    Mutates titles and durations of remaining uncompleted nodes to simulate adaptation."""
    import copy
    
    print(f"[ADAPT] deterministic adaptation started for feedback={feedback_type} node={node_id}")
    
    # Make a deep copy to avoid side-effects
    track = copy.deepcopy(track_dict)
    
    nodeMap = track.get("nodeMap", {})
    
    # Node keys in topological order
    NODE_ORDER = ["f1", "f2", "f3", "d1", "d2", "m1", "m2", "m3"]
    
    if node_id in NODE_ORDER:
        current_idx = NODE_ORDER.index(node_id)
    else:
        current_idx = -1
        
    feedback_clean = feedback_type.lower().strip()
    
    # Process modifications
    if feedback_clean == "skip":
        # Mark current node as completed/skipped
        if node_id in nodeMap:
            nodeMap[node_id]["status"] = "completed"
            if " (Skipped)" not in nodeMap[node_id]["title"]:
                nodeMap[node_id]["title"] += " (Skipped)"
        
        # Adjust subsequent nodes to reflect skip
        for i, nid in enumerate(NODE_ORDER):
            if i > current_idx and nid in nodeMap:
                node = nodeMap[nid]
                if node.get("status") != "completed":
                    if " (Re-planned)" not in node["title"]:
                        node["title"] += " (Re-planned)"
                        
    elif feedback_clean in ("easy", "too easy"):
        # Compress subsequent uncompleted nodes
        for i, nid in enumerate(NODE_ORDER):
            if i > current_idx and nid in nodeMap:
                node = nodeMap[nid]
                if node.get("status") != "completed":
                    if " (Accelerated)" not in node["title"]:
                        node["title"] += " (Accelerated)"
                    
                    duration = node.get("duration", "2 wks")
                    node["duration"] = compress_duration(duration)
                    
                    # Add advanced topic to syllabus
                    if "syllabus" in node and isinstance(node["syllabus"], list):
                        if "Advanced optimization & best practices" not in node["syllabus"]:
                            node["syllabus"].append("Advanced optimization & best practices")
                        
    elif feedback_clean in ("hard", "too hard"):
        # For too hard, we simplify current and subsequent uncompleted nodes
        for i, nid in enumerate(NODE_ORDER):
            if i >= current_idx and nid in nodeMap:
                node = nodeMap[nid]
                if node.get("status") != "completed":
                    if " (Foundations)" not in node["title"]:
                        node["title"] += " (Foundations)"
                    
                    duration = node.get("duration", "2 wks")
                    node["duration"] = expand_duration(duration)
                    
                    # Prepend foundational concepts to syllabus
                    if "syllabus" in node and isinstance(node["syllabus"], list):
                        if "Core foundational concepts" not in node["syllabus"]:
                            node["syllabus"].insert(0, "Core foundational concepts")

    elif feedback_clean == "medium":
        # Keep approximately the same difficulty/duration, optimize subsequent uncompleted nodes
        for i, nid in enumerate(NODE_ORDER):
            if i > current_idx and nid in nodeMap:
                node = nodeMap[nid]
                if node.get("status") != "completed":
                    if " (Optimized)" not in node["title"]:
                        node["title"] += " (Optimized)"
                    
                    # Add paced exercises to syllabus
                    if "syllabus" in node and isinstance(node["syllabus"], list):
                        if "Paced review exercises" not in node["syllabus"]:
                            node["syllabus"].append("Paced review exercises")

    return track

def adapt_roadmap(track_dict: dict, node_id: str, feedback_type: str) -> dict:
    """Adapt the roadmap based on user feedback. Returns the updated Track dict.
    Runs completely programmatically to ensure low latency and zero LLM calls."""
    import time
    start_time = time.time()
    
    adapted = programmatic_adapt_roadmap(track_dict, node_id, feedback_type)
    
    duration_ms = (time.time() - start_time) * 1000
    print(f"[ADAPT] adaptation duration={duration_ms:.2f}ms")
    
    return adapted

# ─── FALLBACKS ───
def get_fallback_roadmap(role_id: str) -> dict:
    """Return a pre-built static roadmap. Used when Groq fails."""
    if role_id in FALLBACKS:
        return FALLBACKS[role_id]

    # Generic fallback
    label = ROLE_LABELS.get(role_id, "General Programming")
    return {
        "id": role_id,
        "label": label,
        "status": "active",
        "nodeMap": {
            "f1": {"title": f"{label} — Fundamentals I", "status": "not_started", "match": 88, "duration": "2 wks", "stage": "learn", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
            "f2": {"title": f"{label} — Fundamentals II", "status": "not_started", "match": 85, "duration": "2 wks", "stage": "learn", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
            "f3": {"title": f"{label} — Core Concepts", "status": "not_started", "match": 82, "duration": "1.5 wks", "stage": "learn", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
            "d1": {"title": f"{label} — Hands-On Project I", "status": "not_started", "match": 90, "duration": "2 wks", "stage": "build", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
            "d2": {"title": f"{label} — Hands-On Project II", "status": "not_started", "match": 86, "duration": "1.5 wks", "stage": "build", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
            "m1": {"title": f"{label} — Advanced Topics", "status": "not_started", "match": 84, "duration": "2 wks", "stage": "build", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
            "m2": {"title": f"{label} — Testing & Validation", "status": "not_started", "match": 80, "duration": "1 wk", "stage": "prove", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
            "m3": {"title": f"Capstone: {label} Portfolio Project", "status": "not_started", "match": 95, "duration": "2 wks", "stage": "prove", "syllabus": ["Topic A", "Topic B", "Topic C"], "resources": ["YouTube: FreeCodeCamp"]},
        },
        "skillData": [
            {"skill": "Core Knowledge", "current": 15, "target": 85},
            {"skill": "Practical Skills", "current": 10, "target": 80},
            {"skill": "Problem Solving", "current": 20, "target": 75},
            {"skill": "Tools & Frameworks", "current": 5, "target": 80},
            {"skill": "Project Experience", "current": 3, "target": 70},
            {"skill": "Best Practices", "current": 8, "target": 65},
        ],
        "reasoning": {
            "f1": {"reason": f"Start with the foundational concepts of {label}.", "prereq": "No prerequisites — this is your starting point.", "time": "Fits your schedule in about 2 weeks."},
            "f2": {"reason": "Build on the basics with deeper understanding.", "prereq": "Builds on Fundamentals I.", "time": "About 2 weeks at your pace."},
            "f3": {"reason": "Core concepts that everything else depends on.", "prereq": "Fundamentals I and II.", "time": "1.5 weeks."},
            "d1": {"reason": "Apply what you've learned in a real project.", "prereq": "All fundamentals complete.", "time": "2 weeks — plan extra practice time."},
            "d2": {"reason": "Second project to deepen your skills.", "prereq": "First project experience.", "time": "1.5 weeks."},
            "m1": {"reason": "Advanced topics to set you apart.", "prereq": "Core projects complete.", "time": "2 weeks — heavier module."},
            "m2": {"reason": "Testing proves you write reliable code.", "prereq": "Can run alongside advanced topics.", "time": "1 week — focused."},
            "m3": {"reason": "Your capstone — ties everything together into a portfolio piece.", "prereq": "All previous modules.", "time": "2 weeks — your showcase project."},
        },
    }


def get_fallback_quiz(role_id: str, skill_level: str = "beginner", count: int = 10) -> list:
    """Return static quiz questions when Groq fails. Always returns exactly `count` questions."""
    label = ROLE_LABELS.get(role_id, role_id.replace("-", " ").title())
    
    fallback_questions = []
    topics = [
        "Core Concepts", "Best Practices", "Error Handling", "Architecture",
        "Performance", "Security", "Testing", "Deployment", "Data Structures", "Tooling",
        "Design Patterns", "Debugging", "Version Control", "Code Quality", "Documentation",
        "API Design", "Database Management", "Scalability", "Monitoring", "Optimization"
    ]
    
    for i in range(count):
        topic = topics[i % len(topics)]
        fallback_questions.append({
            "q": f"[{skill_level.title()}] In {label}, regarding {topic}, which of the following is most accurate?",
            "options": [
                f"Standard approach for {topic}",
                f"Incorrect assumption about {topic}",
                f"Deprecated method for {topic}",
                f"Unrelated concept"
            ],
            "correct": 0
        })
        
    return fallback_questions


# ─── CHAT GENERATION ───
def chat_with_node(query: str, node: dict, reasoning: dict, track_label: str) -> str:
    """Generate a contextual answer to a user's question about a specific node."""
    node_title = node.get("title", "this topic")
    node_duration = node.get("duration", "some time")
    node_stage = node.get("stage", "learning")
    syllabus = node.get("syllabus", [])
    syllabus_str = ", ".join(syllabus) if syllabus else "General concepts"
    reason_str = reasoning.get("reason", "") if reasoning else ""
    prereq_str = reasoning.get("prereq", "") if reasoning else ""
    
    system_prompt = f"""You are an expert technical career coach and AI guide for a user learning to become a {track_label}.
The user is currently asking about a specific module in their roadmap: "{node_title}".
Module context:
- Stage: {node_stage}
- Estimated Duration: {node_duration}
- Topics covered: {syllabus_str}
- Why this is important: {reason_str}
- Prerequisites: {prereq_str}

Answer the user's question directly, concisely, and encouragingly. Default to English. If the user writes in Hindi or Hinglish, mirror their language and reply in Hinglish. Keep it conversational.
Do not exceed 3-4 sentences. Be helpful and contextualize it to their role as a {track_label}."""

    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            temperature=0.7,
            max_tokens=256,
        )
        content = response.choices[0].message.content.strip()
        return strip_think_tags(content)
    except Exception as e:
        print(f"[GROQ] Chat generation failed: {e}")
        return f"I'm having trouble connecting right now, but for '{node_title}', you'll focus on {syllabus_str}. Let me know if you need to adjust its difficulty."


def onboarding_chat(messages: list, role_id: str, user_name: str):
    """
    Handle the conversational onboarding interview.
    Returns either a string (the next message) or a dict (if extraction is done).
    """
    label = ROLE_LABELS.get(role_id, role_id)
    user_msg_count = sum(1 for m in messages if m.role == "user")
    
    system_prompt = f"""You are WayPoint 🚀, a friendly and enthusiastic technical career coach.
You are interviewing {user_name} who wants to become a "{label}".

YOUR PERSONALITY:
- You are warm, encouraging, and relatable — like a cool mentor who guides learners.
- You DEFAULT to speaking in English. Be professional but friendly.
- LANGUAGE MIRRORING: If the user writes in Hindi or Hinglish (mix of Hindi + English), you MUST switch to Hinglish too. Example: If user says "mujhe ML seekhna hai", you reply "Awesome bhai! ML mein bahut scope hai 💪"
- If the user writes in English, you STAY in English. Do NOT randomly use Hindi words.
- Use emojis sparingly but naturally (1-2 per message max).

YOUR TASK — ASK THESE QUESTIONS ONE AT A TIME (wait for user response before next):
1. **Education/Background**: "What are you currently doing? College, job, or self-learning?"
2. **Past Experience**: "Have you built any projects or learned any languages before? Big or small, anything counts!"
3. **Career Goal**: "What's your dream job? Startup, big tech, freelance — where do you see yourself?"
4. **Strengths & Weaknesses**: "Tell me one strength that helps you in tech, and one thing you find challenging."
5. **Time Commitment**: "How many hours per week can you dedicate to learning? Be honest — we'll make a realistic plan."
6. **Learning Style**: "How do you like to learn — building projects, reading theory, watching videos, or a mix of everything?"

CRITICAL RULES:
- Ask ONLY ONE question per message. Wait for the user to respond before asking the next.
- Keep messages SHORT (2-3 sentences max). Don't write paragraphs.
- React to the user's answer briefly before asking the next question (e.g., "That's great! Python is super useful for this path.")
- LANGUAGE: Always match the user's language. English → English. Hindi/Hinglish → Hinglish. Do NOT start in Hindi unless the user does.
- If the user gives very short answers, you can gently probe ("Could you share a bit more — any specific project or topic?") but don't push too hard.
- DO NOT repeat questions the user has already answered.
- NEVER output raw JSON, code blocks, or technical data in your conversational responses.
- NO INTERNAL THOUGHTS: Do NOT output your internal thought process, reasoning, or verification steps. Output ONLY the final conversational response.
"""

    # Only allow profile extraction after at least 5 user messages (all 6 questions get a chance)
    if user_msg_count >= 5:
        system_prompt += """
- You have now gathered enough information. You MUST output the extracted profile as a JSON object.
- Output EXACTLY this JSON structure and ABSOLUTELY NOTHING ELSE — no greeting, no text, no markdown, just pure JSON:
{"done": true, "profile": {"skillLevel": "beginner|intermediate|advanced", "learningStyle": "project-first|theory-first|visual|mixed", "weeklyTimeHours": 6, "pastExperience": "summary", "careerGoals": "summary", "detailedContext": {"education": "...", "strengths": "...", "weaknesses": "...", "projectsDone": "...", "preferredLanguages": [], "dreamCompany": "...", "motivation": "..."}}}
"""
    else:
        system_prompt += f"""
- IMPORTANT: You have only asked {user_msg_count} out of 6 questions. You MUST continue asking the remaining questions. DO NOT output any JSON. DO NOT try to extract a profile yet. Just respond conversationally and ask the next question.
"""

    system_prompt += f"\nSTART by greeting {user_name} warmly in English and asking the FIRST question about their background."

    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    for msg in messages:
        # Convert frontend message format to Groq format
        role = "user" if msg.role == "user" else "assistant"
        formatted_messages.append({"role": role, "content": msg.content})

    # Many LLMs on Groq require at least one user message to begin generation.
    # If this is the initial call (no history), add a trigger message.
    if len(formatted_messages) == 1:
        formatted_messages.append({"role": "user", "content": f"Hi! I am {user_name}. Let's start."})

    try:
        # Use faster model for conversational chat, full model for extraction
        model = GROQ_MODEL if user_msg_count >= 5 else CHAT_MODEL
        response = client.chat.completions.create(
            model=model,
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=512,  # Chat messages should be short
        )
        
        content = response.choices[0].message.content.strip()
        content = strip_think_tags(content)
        
        # Try to detect and parse JSON profile extraction from the response
        # The LLM sometimes wraps JSON with text, so we need robust extraction
        if '"done"' in content and '"profile"' in content:
            if user_msg_count >= 5:
                try:
                    # Try direct parse first
                    parsed = json.loads(content)
                    if "profile" in parsed:
                        return parsed
                except json.JSONDecodeError:
                    pass
                # Try extracting JSON from mixed text
                try:
                    json_str = extract_json(content)
                    parsed = json.loads(json_str)
                    if "profile" in parsed:
                        return parsed
                except (json.JSONDecodeError, Exception):
                    pass
            # If we're not ready for extraction or parsing failed,
            # don't show raw JSON to the user — ask a follow-up instead
            return "That's really helpful! Let me ask you one more thing — how do you prefer to learn? Building projects, watching videos, reading docs, or a mix of everything?"
                
        # Safety: strip any accidental JSON fragments from conversational responses
        if content.startswith("{") or '"done":' in content:
            return "Thanks for sharing! Could you tell me more about your learning preferences and how many hours per week you can dedicate?"
        
        return content

    except Exception as e:
        print(f"[GROQ] Onboarding chat failed: {e}")
        traceback.print_exc()
        return f"DEBUG_ERROR: {str(e)}"

# ─── GENERAL CHAT ───
def general_chat(messages: list) -> str:
    """
    Handle global chatbot queries.
    Restricted to tech/career/studies. Mirrors user language.
    """
    system_prompt = """You are WayPoint AI, a friendly and helpful guide for users navigating their tech careers, studies, and learning roadmaps.

CRITICAL RULES:
1. TOPIC RESTRICTION: You MUST ONLY answer questions related to tech, programming, studies, careers, roadmaps, software engineering, and learning. 
   - If the user asks about ANYTHING else (e.g., cooking, movies, politics, personal advice), you must politely decline and guide them back to tech/learning. Example: "I specialize in tech careers and learning roadmaps. I can't help with that, but I'd love to answer any questions you have about programming!"
2. LANGUAGE MIRRORING: You MUST answer in the EXACT SAME language the user asked their question in.
   - If they ask in English, reply in English.
   - If they ask in Hindi, reply in Hindi.
   - If they ask in Hinglish (mix of Hindi/English), reply in Hinglish (e.g., "Haan bilkul, main aapki help kar sakta hoon!").
3. TONE: Be encouraging, concise (keep answers under 3-4 sentences), and professional but friendly. Do not use markdown headers; keep it simple text.
4. NO INTERNAL THOUGHTS: Do NOT output your internal thought process, reasoning, or verification steps. Output ONLY the final conversational response.
"""

    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    for msg in messages:
        # Assuming msg is a dict with "role" and "content" or an object with those attributes
        role = getattr(msg, "role", None) or msg.get("role", "user")
        content = getattr(msg, "content", None) or msg.get("content", "")
        formatted_messages.append({"role": role, "content": content})

    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=512,
        )
        content = response.choices[0].message.content.strip()
        return strip_think_tags(content)
    except Exception as e:
        print(f"[GROQ] General chat failed: {e}")
        traceback.print_exc()
        return "I'm having a bit of trouble connecting right now. Please try again in a moment!"
