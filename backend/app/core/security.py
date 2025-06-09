from datetime import datetime, timedelta
from typing import Optional
import logging
import os
from hashlib import sha256
from uuid import UUID

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer

from app.db.models import User
from app.db.async_base import get_async_db
from app.core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create a logger
logger = logging.getLogger(__name__)

# Configure a more robust password context that can fall back to multiple schemes
# This ensures it works even if bcrypt has issues
try:
    # Try to use bcrypt first
    pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")
    logger.info("Using bcrypt for password hashing")
except Exception as e:
    # Fall back to PBKDF2 if bcrypt has issues
    logger.warning(f"Bcrypt error: {e}, falling back to PBKDF2")
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# OAuth2 scheme for extracting tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# JWT algorithm
ALGORITHM = "HS256"

# For backward compatibility, create a simple rate limiter
try:
    rate_limiter = Limiter(
        key_func=get_remote_address, 
        default_limits=["100/hour"]
    )
except Exception as e:
    logger.warning(f"Rate limiter setup failed: {e}")
    rate_limiter = None


def hash_password(password: str) -> str:
    """
    Hash a password for storing with error handling.
    """
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        # Fall back to a simpler hash if necessary
        salt = os.urandom(32)
        hash_obj = sha256(password.encode() + salt)
        return f"$fallback${salt.hex()}${hash_obj.hexdigest()}"


# Add alias for backward compatibility
get_password_hash = hash_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a stored password against one provided by the user with error handling.
    """
    try:
        # Handle fallback hash format if it was used
        if hashed_password.startswith("$fallback$"):
            _, salt_hex, hash_hex = hashed_password.split("$", 3)
            salt = bytes.fromhex(salt_hex)
            hash_obj = sha256(plain_password.encode() + salt)
            return hash_obj.hexdigest() == hash_hex
        
        # Use passlib for normal verification
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with the given subject and expiration time.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str) -> str:
    """
    Create a JWT refresh token with longer expiration time.
    """
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def validate_refresh_token(token: str) -> dict:
    """
    Validate and decode a refresh token.
    Raises HTTPException if invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except Exception as e:
        logger.error(f"Refresh token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Decode the JWT and return the User object, or raise HTTPException if invalid.
    """
    return await get_user_from_token(token, db)


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Check if the current user is active and has superuser privileges.
    Raises HTTPException if not.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


async def get_user_from_token(token: str, db: Session) -> User:
    """
    Decodes the JWT token, fetches the user from the DB, or raises if invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except Exception as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
