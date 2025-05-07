import logging
import uuid
from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.models import User
from app.core.security import get_password_hash, verify_password
from app.api.v1.schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)


def get_user_by_id(db: Session, user_id: UUID) -> Optional[User]:
    """Get a user by ID"""
    return db.query(User).filter(User.id == str(user_id)).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email"""
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password"""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    
    return user


def create_user(db: Session, user_in: UserCreate) -> User:
    """Create a new user"""
    # Check if email is already registered
    existing_user = get_user_by_email(db, user_in.email)
    if existing_user:
        return None
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: UUID, user_in: UserUpdate) -> Optional[User]:
    """Update a user"""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    # Update user fields
    update_data = user_in.dict(exclude_unset=True)
    
    # Handle password separately to hash it
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for key, value in update_data.items():
        if hasattr(user, key):
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with pagination"""
    return db.query(User).offset(skip).limit(limit).all()


def search_users(db: Session, query: str, skip: int = 0, limit: int = 100) -> List[User]:
    """Search users by email or name"""
    search_pattern = f"%{query}%"
    return db.query(User).filter(
        or_(
            User.email.ilike(search_pattern),
            User.full_name.ilike(search_pattern)
        )
    ).offset(skip).limit(limit).all()


def is_active_user(user: User) -> bool:
    """Check if user is active"""
    return user.is_active


def is_superuser(user: User) -> bool:
    """Check if user is superuser"""
    return user.is_superuser 