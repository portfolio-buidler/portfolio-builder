# app/main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import ALLOWED_ORIGINS
from app.features.resumes.routes import router as resumes_router
from app.features.portfolios.routes_draft import router as draft_router  # PC-65

app = FastAPI(title="Portfolio Builder API", version="1.0.0")

# --- Routers ---
app.include_router(resumes_router)
app.include_router(draft_router)  # /api/v1/portfolio/draft/seed

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,            # e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok", "service": "portfolio-builder", "version": app.version}

if __name__ == "__main__":
    # for local runs; in Docker we also want 0.0.0.0:9000
    uvicorn.run("app.main:app", host="0.0.0.0", port=9000, reload=True)
