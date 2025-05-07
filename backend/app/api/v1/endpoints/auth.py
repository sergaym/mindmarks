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


@router.post("/login", response_model=Token)
def login_for_access_token(
    session: DBSession, form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = user_service.get_user_by_email(session, form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


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