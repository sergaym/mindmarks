from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID

from app.core.security import get_current_user
from app.api.v1.schemas.content import (
    ContentCreate, ContentUpdate, ContentRead, ContentListItem, ContentResponse,
    ContentSearchFilters, ContentStats, ContentCollaboratorCreate, ContentCollaboratorUpdate
)
from app.services.content_service import ContentService
from app.db.base import DBSession
from app.db.models import User

router = APIRouter()


@router.get("/user/{user_id}", response_model=List[ContentListItem])
def get_user_content(
    user_id: UUID,
    db: DBSession,
    query: Optional[str] = Query(None, description="Search query"),
    types: Optional[List[str]] = Query(None, description="Filter by content types"),
    statuses: Optional[List[str]] = Query(None, description="Filter by statuses"),
    priorities: Optional[List[str]] = Query(None, description="Filter by priorities"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    current_user: User = Depends(get_current_user),
):
    """
    Get content for a specific user with optional filtering
    """
    # Ensure user can only access their own content or is superuser
    if str(user_id) != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    content_svc = ContentService(db)
    
    # Build filters if provided
    filters = None
    if any([query, types, statuses, priorities, tags, skip > 0, limit != 100]):
        # Convert string lists to enum lists
        type_enums = None
        status_enums = None
        priority_enums = None
        
        if types:
            from app.api.v1.schemas.content import ContentType
            type_enums = [ContentType(t) for t in types if t in [e.value for e in ContentType]]
        
        if statuses:
            from app.api.v1.schemas.content import ContentStatus
            status_enums = [ContentStatus(s) for s in statuses if s in [e.value for e in ContentStatus]]
        
        if priorities:
            from app.api.v1.schemas.content import ContentPriority
            priority_enums = [ContentPriority(p) for p in priorities if p in [e.value for e in ContentPriority]]
        
        filters = ContentSearchFilters(
            query=query,
            types=type_enums,
            statuses=status_enums,
            priorities=priority_enums,
            tags=tags,
            skip=skip,
            limit=limit
        )
    
    content_list = content_svc.get_user_content(user_id, filters)
    return [ContentService.content_to_list_item(content) for content in content_list]


@router.get("/me", response_model=List[ContentListItem])
def get_my_content(
    db: DBSession,
    query: Optional[str] = Query(None, description="Search query"),
    types: Optional[List[str]] = Query(None, description="Filter by content types"),
    statuses: Optional[List[str]] = Query(None, description="Filter by statuses"),
    priorities: Optional[List[str]] = Query(None, description="Filter by priorities"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's content with optional filtering
    """
    content_svc = ContentService(db)
    
    # Build filters if provided
    filters = None
    if any([query, types, statuses, priorities, tags, skip > 0, limit != 100]):
        # Convert string lists to enum lists
        type_enums = None
        status_enums = None
        priority_enums = None
        
        if types:
            from app.api.v1.schemas.content import ContentType
            type_enums = [ContentType(t) for t in types if t in [e.value for e in ContentType]]
        
        if statuses:
            from app.api.v1.schemas.content import ContentStatus
            status_enums = [ContentStatus(s) for s in statuses if s in [e.value for e in ContentStatus]]
        
        if priorities:
            from app.api.v1.schemas.content import ContentPriority
            priority_enums = [ContentPriority(p) for p in priorities if p in [e.value for e in ContentPriority]]
        
        filters = ContentSearchFilters(
            query=query,
            types=type_enums,
            statuses=status_enums,
            priorities=priority_enums,
            tags=tags,
            skip=skip,
            limit=limit
        )
    
    content_list = content_svc.get_user_content(UUID(current_user.id), filters)
    return [ContentService.content_to_list_item(content) for content in content_list]


@router.post("", response_model=ContentResponse)
def create_content(
    content_in: ContentCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Create new content
    """
    content_svc = ContentService(db)
    content = content_svc.create_content(content_in, UUID(current_user.id))
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create content"
        )
    
    # Convert to response format
    content_item = ContentService.content_to_list_item(content)
    content_page = ContentService.content_to_read_schema(content)
    
    return ContentResponse(
        id=UUID(content.id),
        content=content_item,
        content_page=content_page
    )


@router.get("/{content_id}", response_model=ContentRead)
def get_content_by_id(
    content_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Get content by ID
    """
    content_svc = ContentService(db)
    content = content_svc.get_content_by_id(content_id, UUID(current_user.id))
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    return ContentService.content_to_read_schema(content)


@router.patch("/{content_id}", response_model=ContentRead)
def update_content(
    content_id: UUID,
    content_in: ContentUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Update content
    """
    content_svc = ContentService(db)
    content = content_svc.update_content(content_id, content_in, UUID(current_user.id))
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found or no permission to edit"
        )
    
    return ContentService.content_to_read_schema(content)


@router.delete("/{content_id}")
def delete_content(
    content_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Delete content (owner only)
    """
    content_svc = ContentService(db)
    success = content_svc.delete_content(content_id, UUID(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found or no permission to delete"
        )
    
    return {"message": "Content deleted successfully"}


@router.get("/stats/me", response_model=ContentStats)
def get_my_content_stats(
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Get content statistics for current user
    """
    content_svc = ContentService(db)
    return content_svc.get_content_stats(UUID(current_user.id))

