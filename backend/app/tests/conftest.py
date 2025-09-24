# Ensure the backend root is on sys.path so `from app.main import app` works
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # points to backend/
if str(ROOT) not in sys.path:
	sys.path.insert(0, str(ROOT))

# fixtures (TestClient, temp DB)