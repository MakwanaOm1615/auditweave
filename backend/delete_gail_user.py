import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("DELETE FROM users WHERE email = 'makwanaom1511@gail.com'"))
db.commit()
print('Deleted successfully via SQL')
