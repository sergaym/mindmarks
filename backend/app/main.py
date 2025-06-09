import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router as api_v1_router
from app.core.config import settings
from app.db.async_base import init_async_db, close_async_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Async context manager for application lifespan events.
    Handles startup and shutdown of async database connections.
    """
    # Startup
    try:
        logger.info("Starting up Mindmarks API with async database...")
        await init_async_db()
        logger.info("Async database initialized successfully")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize async database: {e}")
        raise
    finally:
        # Shutdown
        try:
            logger.info("Shutting down async database connections...")
            await close_async_db()
            logger.info("Async database connections closed successfully")
        except Exception as e:
            logger.error(f"Error during database shutdown: {e}")


def create_application() -> FastAPI:
    """
    Create FastAPI application with async database support
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.API_VERSION,
        openapi_url="/api/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan  # Enable async lifespan management
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
    app.include_router(api_v1_router, prefix="/api/v1")

    # Add health check endpoint at root level
    @app.get("/health")
    async def health_check():
        """
        Root health check endpoint for monitoring
        """
        from app.db.async_base import check_async_db_health
        
        try:
            db_healthy = await check_async_db_health()
            if db_healthy:
                return {
                    "status": "healthy",
                    "database": "connected",
                    "async_mode": "enabled",
                    "version": settings.API_VERSION
                }
            else:
                return {
                    "status": "unhealthy",
                    "database": "disconnected",
                    "async_mode": "enabled",
                    "version": settings.API_VERSION
                }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "database": "error",
                "async_mode": "enabled",
                "error": str(e),
                "version": settings.API_VERSION
            }

    logger.info(f"FastAPI application created with async database support")
    return app


# Create the application instance
app = create_application()

# Optional: Add middleware for performance monitoring
@app.middleware("http")
async def log_requests(request, call_next):
    """
    Middleware to log requests and measure performance
    """
    import time
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    # Add performance header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
