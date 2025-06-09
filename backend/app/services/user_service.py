import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, and_, select, update, delete

from app.db.models import User, RefreshToken, PasswordResetToken
from app.core.security import get_password_hash, verify_password
from app.api.v1.schemas.user import UserCreate, UserUpdate
from app.core.config import settings

logger = logging.getLogger(__name__)


class UserService:
    """
    async UserService using AsyncSession for maximum performance.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID - True async operation"""
        try:
            result = await self.db.execute(
                select(User).filter(User.id == str(user_id))
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting user by ID {user_id}: {e}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email - True async operation"""
        try:
            result = await self.db.execute(
                select(User).filter(User.email == email)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user by email and password - True async"""
        user = await self.get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    async def create_user(self, user_in: UserCreate) -> Optional[User]:
        """Create a new user - True async operation"""
        try:
            # Check if email is already registered
            existing_user = await self.get_user_by_email(user_in.email)
            if existing_user:
                return None
            
            hashed_password = get_password_hash(user_in.password)
            user = User(
                id=str(uuid.uuid4()),
                email=user_in.email,
                full_name=user_in.full_name,
                is_active=user_in.is_active,
                is_superuser=user_in.is_superuser,
                hashed_password=hashed_password
            )
            
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            
            logger.info(f"User created successfully: {user.email}")
            return user
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating user: {e}")
            return None
            return False
        
        db_token.revoked = True
        self.db.commit()
        return True
    
    def revoke_all_user_refresh_tokens(self, user_id: UUID) -> int:
        """
        Revoke all refresh tokens for a user, returns count of revoked tokens
        """
        result = self.db.query(RefreshToken).filter(
            RefreshToken.user_id == str(user_id),
            RefreshToken.revoked == False
        ).update({"revoked": True})
        
        self.db.commit()
        return result

    def create_password_reset_token(self, email: str) -> Optional[str]:
        """
        Create a password reset token for a user
        Returns the token string if successful, None if user doesn't exist
        """
        user = self.get_user_by_email(email)
        if not user:
            return None
        
        # Invalidate any existing tokens for this user
        self.db.query(PasswordResetToken).filter(
            and_(
                PasswordResetToken.user_email == email.lower(),
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.utcnow()
            )
        ).update({"used": True})
        
        # Create new reset token
        reset_record, reset_token = PasswordResetToken.create_token(email.lower())
        self.db.add(reset_record)
        self.db.commit()
        
        logger.info(f"Password reset token created for user: {email}")
        return reset_token
    
    def verify_and_use_reset_token(self, token: str, new_password: str) -> bool:
        """
        Verify and use a password reset token to change the user's password
        Returns True if successful, False otherwise
        """
        # Find valid reset token
        reset_record = self.db.query(PasswordResetToken).filter(
            and_(
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.utcnow()
            )
        ).first()
        
        if not reset_record:
            logger.warning("Invalid or expired reset token attempted")
            return False
        
        # Verify token
        if not reset_record.verify_token(token):
            logger.warning("Invalid reset token verification failed")
            return False
        
        # Find user
        user = self.get_user_by_email(reset_record.user_email)
        if not user:
            # Mark token as used and return False
            reset_record.used = True
            self.db.commit()
            logger.error(f"User not found for reset token: {reset_record.user_email}")
            return False
        
        # Update user password
        user.hashed_password = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        
        # Mark token as used
        reset_record.used = True
        
        # Revoke all existing refresh tokens for security
        self.revoke_all_user_refresh_tokens(UUID(user.id))
        
        # Commit changes
        self.db.commit()
        
        logger.info(f"Password successfully reset for user: {user.email}")
        return True
    
    def cleanup_expired_reset_tokens(self) -> int:
        """
        Cleanup expired password reset tokens
        Returns the number of deleted tokens
        """
        deleted_count = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.expires_at < datetime.utcnow()
        ).delete()
        
        self.db.commit()
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired password reset tokens")
        
        return deleted_count

    @staticmethod
    def is_active_user(user: User) -> bool:
        """Check if user is active"""
        return user.is_active

    @staticmethod
    def is_superuser(user: User) -> bool:
        """Check if user is superuser"""
        return user.is_superuser

# For backwards compatibility
def get_user_by_id(db: Session, user_id: UUID) -> Optional[User]:
    return UserService(db).get_user_by_id(user_id)

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return UserService(db).get_user_by_email(email)

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    return UserService(db).authenticate_user(email, password)

def create_user(db: Session, user_in: UserCreate) -> User:
    return UserService(db).create_user(user_in)

def update_user(db: Session, user_id: UUID, user_in: Union[UserUpdate, Dict]) -> Optional[User]:
    return UserService(db).update_user(user_id, user_in)

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return UserService(db).get_users(skip, limit)

def search_users(db: Session, query: str, skip: int = 0, limit: int = 100) -> List[User]:
    return UserService(db).search_users(query, skip, limit)

def is_active_user(user: User) -> bool:
    return UserService.is_active_user(user)

def is_superuser(user: User) -> bool:
    return UserService.is_superuser(user) 