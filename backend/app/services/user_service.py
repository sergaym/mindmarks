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