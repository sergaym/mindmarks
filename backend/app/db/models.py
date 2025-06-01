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
    TIMESTAMP,
    Float,
    UniqueConstraint,
    Index,
    DateTime
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta
import secrets
import hashlib

Base = declarative_base()


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
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    reading_progress = relationship("ReadingProgress", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('users_email_idx', 'email'),
    )


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    source_url = Column(String(512))
    summary = Column(Text)
    tags = Column(String(255))
    is_summarized = Column(Boolean, default=False, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notes")
    reading_progress = relationship("ReadingProgress", back_populates="note", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('notes_user_id_idx', 'user_id'),
    )


class ReadingProgress(Base):
    __tablename__ = "reading_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    note_id = Column(String, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    current_position = Column(Integer, default=0, nullable=False)
    total_length = Column(Integer, default=0, nullable=False)
    progress_percentage = Column(Float, default=0.0, nullable=False)
    last_read_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    note = relationship("Note", back_populates="reading_progress")
    user = relationship("User", back_populates="reading_progress")
    
    __table_args__ = (
        UniqueConstraint('note_id', 'user_id', name='unique_user_note_progress'),
        Index('reading_progress_note_id_idx', 'note_id'),
        Index('reading_progress_user_id_idx', 'user_id'),
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

