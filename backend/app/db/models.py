"""
SQLAlchemy models for Mindmarks database
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    Float,
    UniqueConstraint,
    Index,
    DateTime,
    Enum
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta
import secrets
import hashlib
import enum

Base = declarative_base()


class ContentTypeEnum(enum.Enum):
    """Content types for different kinds of learning materials"""
    book = "book"
    article = "article"
    video = "video"
    podcast = "podcast"
    course = "course"
    other = "other"


class ContentStatusEnum(enum.Enum):
    """Content status for tracking progress"""
    planned = "planned"
    in_progress = "in-progress"
    completed = "completed"
    archived = "archived"


class ContentPriorityEnum(enum.Enum):
    """Content priority levels"""
    low = "low"
    medium = "medium"
    high = "high"


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    # Content relationships
    created_content = relationship("Content", foreign_keys="Content.created_by_id", back_populates="created_by", cascade="all, delete-orphan")
    last_edited_content = relationship("Content", foreign_keys="Content.last_edited_by_id", back_populates="last_edited_by")
    collaborated_content = relationship("ContentCollaborator", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('users_email_idx', 'email'),
    )



class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    token = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)
    
    # Relationship to user
    user = relationship("User", back_populates="refresh_tokens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_email = Column(String, index=True, nullable=False)
    token_hash = Column(String, nullable=False)  # Store hashed token for security
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('password_reset_tokens_user_email_idx', 'user_email'),
        Index('password_reset_tokens_expires_at_idx', 'expires_at'),
    )
    
    @classmethod
    def create_token(cls, user_email: str, expires_in_hours: int = 1):
        """Create a new password reset token"""
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        return cls(
            user_email=user_email.lower(),
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(hours=expires_in_hours)
        ), token
    
    def verify_token(self, token: str) -> bool:
        """Verify if the provided token matches this record"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return (
            self.token_hash == token_hash and
            not self.used and
            datetime.utcnow() < self.expires_at
        )

