import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.models import User, RefreshToken
from app.core.security import get_password_hash, verify_password
from app.api.v1.schemas.user import UserCreate, UserUpdate
from app.core.config import settings

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID"""
        return self.db.query(User).filter(User.id == str(user_id)).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user by email and password"""
        user = self.get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        
        return user

    def create_user(self, user_in: UserCreate) -> User:
        """Create a new user"""
        # Check if email is already registered
        existing_user = self.get_user_by_email(user_in.email)
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
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user_id: UUID, user_in: Union[UserUpdate, Dict]) -> Optional[User]:
        """Update a user"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        # Update user fields
        if hasattr(user_in, 'dict'):
            # It's a Pydantic model
            update_data = user_in.dict(exclude_unset=True)
        else:
            # It's already a dict
            update_data = user_in
        
        # Handle password separately to hash it
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination"""
        return self.db.query(User).offset(skip).limit(limit).all()

    def search_users(self, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by email or name"""
        search_pattern = f"%{query}%"
        return self.db.query(User).filter(
            or_(
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern)
            )
        ).offset(skip).limit(limit).all()
        
    def create_refresh_token(self, user_id: UUID, token: str) -> RefreshToken:
        """
        Store a refresh token in the database
        """
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
        self.db.commit()
        self.db.refresh(refresh_token)
        
        return refresh_token
    
    def get_refresh_token(self, token: str) -> Optional[RefreshToken]:
        """
        Get a refresh token by its token string
        """
        return self.db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        ).first()
    
    def revoke_refresh_token(self, token: str) -> bool:
        """
        Revoke a refresh token
        """
        db_token = self.db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if not db_token:
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