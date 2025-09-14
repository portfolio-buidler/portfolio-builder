import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.features.resumes import router as resumes_router

app = FastAPI(title="Portfolio Builder API", version="1.0.0")

app.include_router(resumes_router, prefix="/resumes", tags=["resumes"])

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
