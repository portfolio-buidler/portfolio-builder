# app/main.py
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import ALLOWED_ORIGINS
from app.core.rate_limiting import rate_limit_middleware
from app.core.errors import AuthenticationError, AuthorizationError
from app.features.auth.routes import router as auth_router
from app.features.resumes.routes import router as resumes_router
from app.features.portfolios.routes_draft import router as draft_router  # PC-65
from app.features.portfolios.routes_public import router as public_router  # PC-68
from app.features.portfolios import routes_site

app = FastAPI(title="Portfolio Builder API", version="1.0.0")

# --- Middleware ---
# Rate limiting (applied before CORS)
app.middleware("http")(rate_limit_middleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,            # e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# --- Exception Handlers ---
@app.exception_handler(AuthenticationError)
async def authentication_error_handler(request: Request, exc: AuthenticationError):
    """Handle 401 authentication errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )


@app.exception_handler(AuthorizationError)
async def authorization_error_handler(request: Request, exc: AuthorizationError):
    """Handle 403 authorization errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


# --- Routers ---
app.include_router(auth_router)  # /auth/*
app.include_router(resumes_router)
app.include_router(draft_router)  # /api/v1/portfolio/draft/seed
app.include_router(public_router)  # /api/v1/portfolio/public/{slug}
app.include_router(routes_site.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "portfolio-builder", "version": app.version}

if __name__ == "__main__":
    # for local runs; in Docker we also want 0.0.0.0:9000
    uvicorn.run("app.main:app", host="0.0.0.0", port=9000, reload=True)
