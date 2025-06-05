from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, content

# Create an API router specifically for v1 endpoints
# without prefixing the version - this allows the main app to handle versioning
api_router = APIRouter()

# Include the various endpoint routers with their appropriate prefixes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
