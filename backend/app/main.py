from fastapi import FastAPI
from backend.app.api.v1.routes import router as api_v1

def create_app() -> FastAPI:
    application=FastAPI(title="Portfolio Builder API", version= "0.1.0")
    application.include_router(api_v1,prefix="/api/v1")

    @application.get("/")
    def root():
        return {"message": "Portfolio Builder!"}

    return application

app=create_app()

