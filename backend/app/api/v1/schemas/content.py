from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, UUID4
from enum import Enum


class ContentType(str, Enum):
    """Content types for different kinds of learning materials"""
    book = "book"
    article = "article"
    video = "video"
    podcast = "podcast"
    course = "course"
    other = "other"


class ContentStatus(str, Enum):
    """Content status for tracking progress"""
    planned = "planned"
    in_progress = "in-progress"
    completed = "completed"
    archived = "archived"


class ContentPriority(str, Enum):
    """Content priority levels"""
    low = "low"
    medium = "medium"
    high = "high"


class EditorContent(BaseModel):
    """Editor content structure for rich text content"""
    type: str
    children: List[Dict[str, Any]]
    attrs: Optional[Dict[str, Any]] = None


class UserBase(BaseModel):
    """Basic user info for content schemas"""
    id: UUID4
    name: str
    image: Optional[str] = None


class ContentCollaboratorBase(BaseModel):
    """Base schema for content collaborators"""
    user: UserBase
    permission: str = "read"
    invited_at: datetime
    accepted_at: Optional[datetime] = None
