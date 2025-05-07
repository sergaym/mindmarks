from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.v1.schemas.token import Token
from app.api.v1.schemas.user import UserCreate, UserRead
from app.api.v1.services import user_service
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db.base import DBSession

router = APIRouter()
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_new_user(user_in: UserCreate, session: DBSession):
    """
    Create new user
    """
    # Check if user already exists
    existing_user = user_service.get_user_by_email(session, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists",
        )
    
    # Create new user through service layer
    # The service now returns a proper UserRead model
    return user_service.create_user(session, user_in) 