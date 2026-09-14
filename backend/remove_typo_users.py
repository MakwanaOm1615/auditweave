import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from app.models import User

def remove_typo_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        typos = ["gma.com", "gmial.com", "gmail.con", "yaho.com", "yahoo.con", "hotmal.com", "hotmail.con", "outlok.com", "outlook.con"]
        deleted_count = 0
        for user in users:
            domain = user.email.split("@")[-1] if "@" in user.email else ""
            if domain in typos:
                print(f"Deleting user with email: {user.email}")
                db.delete(user)
                deleted_count += 1
        db.commit()
        print(f"Successfully deleted {deleted_count} users with typo domains.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    remove_typo_users()
