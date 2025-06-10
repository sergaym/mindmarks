from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks, Response, Request
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

# Cookie settings for refresh tokens
REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


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
async def register_new_user(user_in: UserCreate, session: AsyncDBSession):
    """
    Create new user
    True async implementation with AsyncSession for maximum performance
    """
    user_svc = UserService(session)
    
    # Check if user already exists
    existing_user = await user_svc.get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists",
        )
    
    # Log if someone is trying to create a superuser
    if user_in.is_superuser:
        logger.info(f"Creating superuser account for email: {user_in.email}")
    
    # Create new user through service layer
    new_user = await user_svc.create_user(user_in)
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    logger.info(f"New user registered successfully: {new_user.email}")
    return new_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: AsyncDBSession
):
    """
    Request password reset - sends email with reset token
    True async implementation with AsyncSession for maximum performance
    
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
        reset_token = await user_svc.create_password_reset_token(email)
        
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
    session: AsyncDBSession
):
    """
    Reset password using token from email
    True async implementation with AsyncSession for maximum performance
    
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
        success = await user_svc.verify_and_use_reset_token(token, new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        logger.info("Password reset successful")
        return ResetPasswordResponse(
            message="Password reset successful. You can now login with your new password."
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in reset_password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password. Please try again later."
        )


@router.delete("/cleanup-expired-tokens")
async def cleanup_expired_tokens(session: AsyncDBSession):
    """
    Admin endpoint to cleanup expired tokens
    True async implementation with AsyncSession for maximum performance
    This should typically be called via a scheduled job
    """
    try:
        user_svc = UserService(session)
        
        # Cleanup expired refresh tokens
        refresh_count = await user_svc.cleanup_expired_refresh_tokens()
        
        # Cleanup expired reset tokens
        reset_count = await user_svc.cleanup_expired_reset_tokens()
        
        logger.info(f"Token cleanup completed: {refresh_count} refresh, {reset_count} reset tokens removed")
        return {
            "message": "Token cleanup completed successfully",
            "expired_refresh_tokens_removed": refresh_count,
            "expired_reset_tokens_removed": reset_count
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup_expired_tokens: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to cleanup expired tokens"
        )


@router.get("/health")
async def auth_health_check(session: AsyncDBSession):
    """
    Health check endpoint for authentication service
    Tests async database connectivity and basic operations
    """
    try:
        user_svc = UserService(session)
        
        # Test basic database connectivity
        users = await user_svc.get_users(limit=1)
        
        return {
            "status": "healthy",
            "database": "connected",
            "async_operations": "functional",
            "timestamp": logger.info("Auth health check passed")
        }
        
    except Exception as e:
        logger.error(f"Auth health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unhealthy"
        )


@router.post("/set-refresh-cookie", status_code=status.HTTP_200_OK)
async def set_refresh_token_cookie(
    response: Response,
    session: AsyncDBSession,
    refresh_token: str = Body(..., embed=True)
):
    """
    Set refresh token as HttpOnly cookie for secure storage
    This endpoint is called by the frontend after login to store refresh tokens securely
    """
    user_svc = UserService(session)
    
    try:
        # Validate the refresh token before setting it
        payload = validate_refresh_token(refresh_token)
        user_id = payload.get("sub")
        
        # Verify token exists in database
        db_token = await user_svc.get_refresh_token(refresh_token)
        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        # Verify user exists and is active
        user = await user_svc.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive user",
            )
        
        # Set HttpOnly cookie with refresh token
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            value=refresh_token,
            max_age=REFRESH_TOKEN_MAX_AGE,
            httponly=True,  # Prevents XSS attacks
            secure=settings.is_production,  # HTTPS only in production
            samesite="strict",  # CSRF protection
            path="/",  # Available for all routes
        )
        
        logger.info(f"Refresh token cookie set for user: {user.email}")
        return {"message": "Refresh token cookie set successfully"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error setting refresh token cookie: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to set refresh token cookie"
        )


@router.post("/clear-refresh-cookie", status_code=status.HTTP_200_OK)
async def clear_refresh_token_cookie(
    response: Response,
    request: Request,
    session: AsyncDBSession
):
    """
    Clear refresh token cookie and revoke token from database
    This endpoint is called during logout to ensure proper cleanup
    """
    user_svc = UserService(session)
    
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
        
        if refresh_token:
            # Revoke the refresh token from database
            await user_svc.revoke_refresh_token(refresh_token)
            logger.info("Refresh token revoked from database")
        
        # Clear the cookie regardless of whether token was found
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            path="/",
            secure=settings.is_production,
            samesite="strict"
        )
        
        logger.info("Refresh token cookie cleared")
        return {"message": "Refresh token cookie cleared successfully"}
        
    except Exception as e:
        logger.error(f"Error clearing refresh token cookie: {e}")
        # Still clear the cookie even if database operation fails
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            path="/",
            secure=settings.is_production,
            samesite="strict"
        )
        return {"message": "Refresh token cookie cleared"}


@router.post("/refresh-from-cookie", response_model=Token)
async def refresh_access_token_from_cookie(
    request: Request,
    response: Response,
    session: AsyncDBSession
):
    """
    Get a new access token using refresh token from HttpOnly cookie
    This provides an alternative to the body-based refresh endpoint
    """
    user_svc = UserService(session)
    
    # Get refresh token from cookie
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie not found",
        )
    
    try:
        # Validate the refresh token from JWT perspective
        payload = validate_refresh_token(refresh_token)
        user_id = payload.get("sub")
        
        # Verify token exists in database and is not revoked
        db_token = await user_svc.get_refresh_token(refresh_token)
        if not db_token:
            # Clear invalid cookie
            response.delete_cookie(
                key=REFRESH_TOKEN_COOKIE_NAME,
                path="/",
                secure=settings.is_production,
                samesite="strict"
            )
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
        
        # Update the cookie with new refresh token
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            value=new_refresh_token,
            max_age=REFRESH_TOKEN_MAX_AGE,
            httponly=True,
            secure=settings.is_production,
            samesite="strict",
            path="/",
        )
        
        logger.info(f"Token refreshed from cookie successfully for user: {user.email}")
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,  # Also return in body for compatibility
            "token_type": "bearer"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Refresh token from cookie error: {e}")
        # Clear potentially invalid cookie
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            path="/",
            secure=settings.is_production,
            samesite="strict"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) 