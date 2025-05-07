from datetime import datetime, timedelta
from typing import Optional
import logging
import os
from hashlib import sha256
from uuid import UUID

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer

from app.db.models import User
from app.db.base import get_db
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

# Rate limiter setup
rate_limiter = Limiter(
    key_func=get_remote_address, default_limits=[settings.get_rate_limiter]
)


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

