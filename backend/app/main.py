import uvicorn
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.features.resumes.routes import router as resumes_router
from app.core.config import ALLOWED_ORIGINS
from sqlalchemy import text
from app.core.db import engine, Base  # Base.create_all() is no-op if no models yet
# Ensure models are imported so SQLAlchemy sees them during Base.metadata.create_all()
from app.features.resumes import models  # noqa: F401
from fastapi.responses import RedirectResponse

# Expose Swagger UI at /dogs (instead of default /docs). Disable ReDoc for simplicity.
app = FastAPI(title="Portfolio Builder API", version="1.0.0", docs_url="/dogs", redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# Optional: keep /docs as an alias that redirects to /dogs
@app.get("/docs", include_in_schema=False)
def docs_redirect():
    return RedirectResponse(url="/dogs")

app.include_router(resumes_router)

@app.on_event("startup")
def startup_check_db():
    """Verify database connectivity and create tables if models exist."""
    try:
        # Fast connectivity check
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        # Safe even if there are no models yet
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        # Let the exception bubble up after logging; container will restart if configured
        print(f"[startup] Database connection failed: {exc}")
        raise

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "portfolio-builder",
        "version": app.version,
        "docs": "/dogs",
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
