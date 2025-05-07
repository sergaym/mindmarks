import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router as api_v1_router
from app.core.config import settings

logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    """
    Create FastAPI application
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url="/api/openapi.json",
    )

    # Set up CORS
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.BACKEND_CORS_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Include API routers with version prefixes
    # This centralizes the versioning and makes it easier to add new API versions
    app.include_router(api_v1_router, prefix="/api/v1")

    return app


app = create_application()

@app.get("/health")
def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Mindmarks API!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
