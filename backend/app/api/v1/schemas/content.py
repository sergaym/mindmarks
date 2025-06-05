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


class ContentBase(BaseModel):
    """Base content schema with common fields"""
    title: str = Field(..., min_length=1, max_length=255)
    type: ContentType
    url: Optional[str] = Field(None, max_length=1024)
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    status: ContentStatus = ContentStatus.planned
    priority: ContentPriority = ContentPriority.medium
    
    # Editor content
    content: List[EditorContent] = Field(default_factory=list)
    
    # Additional metadata
    key_takeaways: List[str] = Field(default_factory=list)
    author: Optional[str] = Field(None, max_length=255)
    published_date: Optional[datetime] = None
    estimated_read_time: Optional[int] = Field(None, ge=0)  # in minutes
    rating: Optional[float] = Field(None, ge=0, le=5)
    progress: float = Field(default=0.0, ge=0, le=100)  # percentage
    
    # Visibility
    is_public: bool = False


class ContentCreate(ContentBase):
    """Schema for creating new content"""
    # All required fields inherited from ContentBase
    pass


class ContentUpdate(BaseModel):
    """Schema for updating content - all fields optional"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[ContentType] = None
    url: Optional[str] = Field(None, max_length=1024)
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[ContentStatus] = None
    priority: Optional[ContentPriority] = None
    
    # Editor content
    content: Optional[List[EditorContent]] = None
    
    # Additional metadata
    key_takeaways: Optional[List[str]] = None
    author: Optional[str] = Field(None, max_length=255)
    published_date: Optional[datetime] = None
    estimated_read_time: Optional[int] = Field(None, ge=0)
    rating: Optional[float] = Field(None, ge=0, le=5)
    progress: Optional[float] = Field(None, ge=0, le=100)
    
    # Visibility
    is_public: Optional[bool] = None


class ContentRead(ContentBase):
    """Schema for reading content with full details"""
    id: UUID4
    created_at: datetime
    updated_at: datetime
    created_by: UserBase
    last_edited_by: Optional[UserBase] = None
    collaborators: List[ContentCollaboratorBase] = Field(default_factory=list)
    
    class Config:
        from_attributes = True


class ContentListItem(BaseModel):
    """Simplified schema for content lists (dashboard view)"""
    id: UUID4
    name: str  # title mapped to name for frontend compatibility
    type: ContentType
    start_at: datetime  # created_at mapped to start_at
    end_at: Optional[datetime] = None  # can be enhanced based on content type
    column: str  # status mapped to column for kanban
    owner: UserBase  # created_by mapped to owner
    description: Optional[str] = None  # summary mapped to description
    tags: List[str] = Field(default_factory=list)
    url: Optional[str] = None
    progress: float = 0.0
    priority: ContentPriority = ContentPriority.medium
    
    class Config:
        from_attributes = True


class ContentResponse(BaseModel):
    """Response schema for content operations"""
    id: UUID4
    content: ContentListItem
    content_page: ContentRead


class ContentCollaboratorCreate(BaseModel):
    """Schema for adding collaborators to content"""
    user_email: str
    permission: str = Field(default="read", pattern="^(read|write|admin)$")


class ContentCollaboratorUpdate(BaseModel):
    """Schema for updating collaborator permissions"""
    permission: str = Field(..., pattern="^(read|write|admin)$")


class ContentSearchFilters(BaseModel):
    """Schema for content search and filtering"""
    query: Optional[str] = None
    types: Optional[List[ContentType]] = None
    statuses: Optional[List[ContentStatus]] = None
    priorities: Optional[List[ContentPriority]] = None
    tags: Optional[List[str]] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=100, ge=1, le=1000)


class ContentStats(BaseModel):
    """Schema for content statistics"""
    total_content: int
    by_status: Dict[str, int]
    by_type: Dict[str, int]
    by_priority: Dict[str, int]
    avg_progress: float
    completed_this_month: int
    reading_streak: int 