import sys
import os

# Add parent directory to path so we can import from database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.database import SessionLocal, engine
from db.models import QuizQuestion

SEEDS = [
    {
        "role_id": "ml",
        "q": "What is the main purpose of a loss function?",
        "options": ["To optimize learning rate", "To calculate error", "To define the neural network architecture", "To initialize weights"],
        "correct_index": 1,
        "order_index": 0
    },
    {
        "role_id": "ml",
        "q": "Which algorithm is best for classification?",
        "options": ["Linear Regression", "Random Forest", "K-Means", "PCA"],
        "correct_index": 1,
        "order_index": 1
    },
    {
        "role_id": "java",
        "q": "Which of the following is not a Java keyword?",
        "options": ["static", "Boolean", "void", "private"],
        "correct_index": 1,
        "order_index": 0
    },
    {
        "role_id": "mern",
        "q": "What does the \"E\" in MERN stand for?",
        "options": ["Ember", "Express", "Elastic", "Electron"],
        "correct_index": 1,
        "order_index": 0
    }
]

def seed_db():
    print("[SEED] Starting database seeding...")
    # Dynamically create all tables if they do not exist
    from db.database import Base
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        inserted = 0
        updated = 0
        for s in SEEDS:
            # Check if this exact question already exists for the role
            q_db = db.query(QuizQuestion).filter(
                QuizQuestion.role_id == s["role_id"],
                QuizQuestion.q == s["q"]
            ).first()
            
            if q_db:
                # Update existing question
                q_db.options = s["options"]
                q_db.correct_index = s["correct_index"]
                q_db.order_index = s["order_index"]
                updated += 1
            else:
                # Insert new question
                q_db = QuizQuestion(
                    role_id=s["role_id"],
                    q=s["q"],
                    options=s["options"],
                    correct_index=s["correct_index"],
                    order_index=s["order_index"]
                )
                db.add(q_db)
                inserted += 1
        
        db.commit()
        print(f"[SEED] Finished database seeding successfully. Created: {inserted}, Updated: {updated}")
    except Exception as e:
        db.rollback()
        print(f"[SEED] Error occurred during seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
