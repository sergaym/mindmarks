from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
import logging

from app.api.v1.schemas.token import Token
from app.api.v1.schemas.user import UserCreate, UserRead
from app.api.v1.schemas.password_reset import (
    ForgotPasswordRequest, 
    ForgotPasswordResponse, 
    ResetPasswordRequest, 
    ResetPasswordResponse
)
from app.services.user_service import UserService
from app.services.email_service import email_service
from app.core.config import settings
from app.core.security import create_access_token, verify_password, create_refresh_token, validate_refresh_token
from app.db.base import DBSession

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/login", response_model=Token)
def login_for_access_token(
    session: DBSession, form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user_svc = UserService(session)
    user = user_svc.get_user_by_email(form_data.username)
    
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
    
    # Generate tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(subject=str(user.id))
    
    # Store refresh token in database
    user_svc.create_refresh_token(user.id, refresh_token)
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
def refresh_access_token(
    session: DBSession, refresh_token: str = Body(..., embed=True)
):
    """
    Get a new access token using a refresh token
    """
    user_svc = UserService(session)
    
    # Validate the refresh token from JWT perspective
    try:
        payload = validate_refresh_token(refresh_token)
        user_id = payload.get("sub")
        
        # Verify token exists in database and is not revoked
        db_token = user_svc.get_refresh_token(refresh_token)
        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked refresh token",
            )
        
        # Verify user exists and is active
        user = user_svc.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user or inactive user",
            )
        
        # Revoke the used refresh token (token rotation)
        user_svc.revoke_refresh_token(refresh_token)
        
        # Generate new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=str(user.id), expires_delta=access_token_expires
        )
        
        # Generate new refresh token
        new_refresh_token = create_refresh_token(subject=str(user.id))
        
        # Store new refresh token in database
        user_svc.create_refresh_token(user.id, new_refresh_token)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Refresh token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(session: DBSession, refresh_token: str = Body(..., embed=True)):
    """
    Logout a user by revoking their refresh token
    """
    user_svc = UserService(session)
    
    # Revoke the refresh token
    revoked = user_svc.revoke_refresh_token(refresh_token)
    if not revoked:
        # We don't want to give hints about valid/invalid tokens
        # So just return success regardless
        pass
    
    return {"message": "Successfully logged out"}


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_new_user(user_in: UserCreate, session: DBSession):
    """
    Create new user
    """
    user_svc = UserService(session)
    
    # Check if user already exists
    existing_user = user_svc.get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists",
        )
    
    # Log if someone is trying to create a superuser
    if user_in.is_superuser:
        logger.info(f"Creating superuser account for email: {user_in.email}")
    
    # Create new user through service layer
    new_user = user_svc.create_user(user_in)
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    return new_user 