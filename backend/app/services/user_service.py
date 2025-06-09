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

    async def update_user(self, user_id: UUID, user_in: Union[UserUpdate, Dict]) -> Optional[User]:
        """Update a user - True async operation"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return None
            
            # Update user fields
            if hasattr(user_in, 'dict'):
                update_data = user_in.dict(exclude_unset=True)
            else:
                update_data = user_in
            
            # Handle password separately to hash it
            if "password" in update_data:
                update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
            
            # Update timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            for key, value in update_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            
            await self.db.commit()
            await self.db.refresh(user)
            
            logger.info(f"User updated successfully: {user.email}")
            return user
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating user {user_id}: {e}")
            return None

    async def delete_user(self, user_id: UUID) -> bool:
        """Delete a user and associated data - True async operation"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return False
            
            # Delete associated refresh tokens
            await self.db.execute(
                delete(RefreshToken).filter(RefreshToken.user_id == str(user_id))
            )
            
            # Delete associated password reset tokens
            await self.db.execute(
                delete(PasswordResetToken).filter(PasswordResetToken.user_email == user.email)
            )
            
            # Delete the user
            await self.db.execute(
                delete(User).filter(User.id == str(user_id))
            )
            await self.db.commit()
            
            logger.info(f"User {user_id} and associated data deleted successfully")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to delete user {user_id}: {e}")
            return False

    async def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination - True async operation"""
        try:
            result = await self.db.execute(
                select(User).offset(skip).limit(limit)
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error getting users: {e}")
            return []
        
    async def create_refresh_token(self, user_id: UUID, token: str) -> Optional[RefreshToken]:
        """Store a refresh token in the database - True async operation"""
        try:
            # Calculate expiration date
            expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            
            # Create token record
            refresh_token = RefreshToken(
                id=str(uuid.uuid4()),
                token=token,
                user_id=str(user_id),
                expires_at=expires_at
            )
            
            # Save to database
            self.db.add(refresh_token)
            await self.db.commit()
            await self.db.refresh(refresh_token)
            
            return refresh_token
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating refresh token: {e}")
            return None
    
    async def get_refresh_token(self, token: str) -> Optional[RefreshToken]:
        """Get a refresh token by its token string - True async operation"""
        try:
            result = await self.db.execute(
                select(RefreshToken).filter(
                    RefreshToken.token == token,
                    RefreshToken.revoked == False,
                    RefreshToken.expires_at > datetime.utcnow()
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting refresh token: {e}")
            return None
    
    async def revoke_refresh_token(self, token: str) -> bool:
        """Revoke a refresh token - True async operation"""
        try:
            result = await self.db.execute(
                update(RefreshToken)
                .filter(RefreshToken.token == token)
                .values(revoked=True)
            )
            await self.db.commit()
            return result.rowcount > 0
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error revoking refresh token: {e}")
            return False
    
    async def revoke_all_user_refresh_tokens(self, user_id: UUID) -> int:
        """Revoke all refresh tokens for a user - True async operation"""
        try:
            result = await self.db.execute(
                update(RefreshToken)
                .filter(
                    RefreshToken.user_id == str(user_id),
                    RefreshToken.revoked == False
                )
                .values(revoked=True)
            )
            await self.db.commit()
            revoked_count = result.rowcount
            logger.info(f"Revoked {revoked_count} refresh tokens for user {user_id}")
            return revoked_count
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error revoking user refresh tokens: {e}")
            return 0

    async def cleanup_expired_refresh_tokens(self) -> int:
        """Clean up expired refresh tokens - True async operation"""
        try:
            result = await self.db.execute(
                delete(RefreshToken).filter(
                    RefreshToken.expires_at <= datetime.utcnow()
                )
            )
            await self.db.commit()
            deleted_count = result.rowcount
            logger.info(f"Cleaned up {deleted_count} expired refresh tokens")
            return deleted_count
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to cleanup expired refresh tokens: {e}")
            return 0

    async def create_password_reset_token(self, email: str) -> Optional[str]:
        """Create a password reset token for a user - True async operation"""
        try:
            user = await self.get_user_by_email(email)
            if not user:
                return None
            
            # Invalidate any existing tokens for this user
            await self.db.execute(
                update(PasswordResetToken)
                .filter(
                    and_(
                        PasswordResetToken.user_email == email.lower(),
                        PasswordResetToken.used == False,
                        PasswordResetToken.expires_at > datetime.utcnow()
                    )
                )
                .values(used=True)
            )
            
            # Create new reset token
            reset_record, reset_token = PasswordResetToken.create_token(email.lower())
            self.db.add(reset_record)
            await self.db.commit()
            
            logger.info(f"Password reset token created for user: {email}")
            return reset_token
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating password reset token: {e}")
            return None
    
    async def verify_and_use_reset_token(self, token: str, new_password: str) -> bool:
        """Verify and use a password reset token - True async operation"""
        try:
            # Find valid reset token
            result = await self.db.execute(
                select(PasswordResetToken).filter(
                    and_(
                        PasswordResetToken.used == False,
                        PasswordResetToken.expires_at > datetime.utcnow()
                    )
                )
            )
            reset_record = result.scalar_one_or_none()
            
            if not reset_record:
                logger.warning("Invalid or expired reset token attempted")
                return False
            
            # Verify token
            if not reset_record.verify_token(token):
                logger.warning("Invalid reset token verification failed")
                return False
            
            # Find and update user password
            user = await self.get_user_by_email(reset_record.user_email)
            if not user:
                logger.error(f"User not found for email: {reset_record.user_email}")
                return False
            
            # Update password
            user.hashed_password = get_password_hash(new_password)
            user.updated_at = datetime.utcnow()
            
            # Mark token as used
            reset_record.used = True
            
            # Revoke all refresh tokens for security
            await self.revoke_all_user_refresh_tokens(UUID(user.id))
            
            await self.db.commit()
            logger.info(f"Password reset successful for user: {user.email}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to reset password: {e}")
            return False

    async def cleanup_expired_reset_tokens(self) -> int:
        """Clean up expired password reset tokens - True async operation"""
        try:
            result = await self.db.execute(
                delete(PasswordResetToken).filter(
                    or_(
                        PasswordResetToken.expires_at <= datetime.utcnow(),
                        PasswordResetToken.used == True
                    )
                )
            )
            await self.db.commit()
            deleted_count = result.rowcount
            logger.info(f"Cleaned up {deleted_count} expired/used password reset tokens")
            return deleted_count
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to cleanup expired reset tokens: {e}")
            return 0 