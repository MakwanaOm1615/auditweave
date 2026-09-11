import os

def load_env():
    """Manually parses the backend .env file and sets environment variables if they are not already set."""
    # Try finding .env file in parent directories
    current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(current_dir, ".env")
    
    if not os.path.exists(env_path):
        # Fallback to current working directory
        env_path = os.path.join(os.getcwd(), "backend", ".env")
        if not os.path.exists(env_path):
            env_path = os.path.join(os.getcwd(), ".env")
            
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key not in os.environ:
                        os.environ[key] = val
