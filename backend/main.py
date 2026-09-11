import uvicorn
import os
import sys

# Ensure the backend directory is in the python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.api.routes import app

if __name__ == "__main__":
    uvicorn.run("AuditWeave:app", host="0.0.0.0", port=8000, reload=True)
