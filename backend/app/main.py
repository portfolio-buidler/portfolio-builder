import uvicorn
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.features.resumes.routes import router as resumes_router
from app.core.config import ALLOWED_ORIGINS

app = FastAPI(title="Portfolio Builder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(resumes_router)

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "portfolio-builder",
        "version": app.version
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)