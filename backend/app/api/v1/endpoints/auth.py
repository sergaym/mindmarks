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
from app.db.async_base import AsyncDBSession

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/login", response_model=Token)
async def login_for_access_token(
    session: AsyncDBSession, form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    True async implementation with AsyncSession for maximum performance
    """
    user_svc = UserService(session)
    user = await user_svc.get_user_by_email(form_data.username)
    
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
    await user_svc.create_refresh_token(user.id, refresh_token)
    
    logger.info(f"User logged in successfully: {user.email}")
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    session: AsyncDBSession, refresh_token: str = Body(..., embed=True)
):
    """
    Get a new access token using a refresh token
    True async implementation with AsyncSession for maximum performance
    """
    user_svc = UserService(session)
    
    # Validate the refresh token from JWT perspective
    try:
        payload = validate_refresh_token(refresh_token)
        user_id = payload.get("sub")
        
        # Verify token exists in database and is not revoked
        db_token = await user_svc.get_refresh_token(refresh_token)
        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked refresh token",
            )
        
        # Verify user exists and is active
        user = await user_svc.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user or inactive user",
            )
        
        # Revoke the used refresh token (token rotation)
        await user_svc.revoke_refresh_token(refresh_token)
        
        # Generate new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=str(user.id), expires_delta=access_token_expires
        )
        
        # Generate new refresh token
        new_refresh_token = create_refresh_token(subject=str(user.id))
        
        # Store new refresh token in database
        await user_svc.create_refresh_token(user.id, new_refresh_token)
        
        logger.info(f"Token refreshed successfully for user: {user.email}")
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
async def logout(session: AsyncDBSession, refresh_token: str = Body(..., embed=True)):
    """
    Logout a user by revoking their refresh token
    True async implementation with AsyncSession for maximum performance
    """
    user_svc = UserService(session)
    
    # Revoke the refresh token
    revoked = await user_svc.revoke_refresh_token(refresh_token)
    if not revoked:
        # We don't want to give hints about valid/invalid tokens
        # So just return success regardless
        pass
    
    logger.info("User logged out successfully")
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


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: DBSession
):
    """
    Request password reset - sends email with reset token
    
    Security considerations:
    - Always returns success message (don't reveal if email exists)
    - Rate limiting should be implemented at middleware level
    - Tokens expire in 1 hour
    - Old tokens are invalidated when new ones are created
    """
    try:
        user_svc = UserService(session)
        email = request.email.lower().strip()
        
        # Try to create a reset token (returns None if user doesn't exist)
        reset_token = user_svc.create_password_reset_token(email)
        
        if reset_token:
            # Send email in background
            background_tasks.add_task(
                email_service.send_password_reset_email,
                email,
                reset_token
            )
            logger.info(f"Password reset requested for existing user: {email}")
        else:
            logger.info(f"Password reset requested for non-existent user: {email}")
        
        # Always return success for security (don't reveal if email exists)
        return ForgotPasswordResponse(
            message="If an account with this email exists, you will receive password reset instructions."
        )
        
    except Exception as e:
        logger.error(f"Error in forgot_password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request. Please try again later."
        )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    session: DBSession
):
    """
    Reset password using token from email
    
    Security considerations:
    - Token is single-use and expires
    - Password is hashed before storage
    - All user sessions are invalidated for security
    """
    try:
        user_svc = UserService(session)
        token = request.token.strip()
        new_password = request.password
        
        # Validate password strength
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Verify and use the reset token
        success = user_svc.verify_and_use_reset_token(token, new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token. Please request a new password reset."
            )
        
        logger.info("Password successfully reset")
        
        return ResetPasswordResponse(
            message="Password has been successfully reset. You can now sign in with your new password."
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in reset_password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password. Please try again later."
        )


@router.delete("/cleanup-expired-tokens")
async def cleanup_expired_tokens(session: DBSession):
    """
    Cleanup expired password reset tokens
    Should be called periodically via cron job or maintenance tasks
    """
    try:
        user_svc = UserService(session)
        deleted_count = user_svc.cleanup_expired_reset_tokens()
        
        logger.info(f"Cleaned up {deleted_count} expired password reset tokens")
        return {"message": f"Cleaned up {deleted_count} expired tokens"}
        
    except Exception as e:
        logger.error(f"Error cleaning up expired tokens: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to cleanup expired tokens"
        ) 