import uvicorn
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import ALLOWED_ORIGINS

app = FastAPI(title="Portfolio Builder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/resumes", tags=["resumes"])

@router.get("/health")
def resumes_health():
    return {"ok": True}

app.include_router(router)

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "portfolio-builder",
        "version": app.version
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)