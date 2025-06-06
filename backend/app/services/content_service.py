import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, text

from app.db.models import User, Content, ContentCollaborator, ContentTypeEnum, ContentStatusEnum, ContentPriorityEnum
from app.api.v1.schemas.content import (
    ContentCreate, ContentUpdate, ContentSearchFilters, ContentListItem,
    ContentRead, UserBase, ContentCollaboratorBase, ContentStats
)

logger = logging.getLogger(__name__)


class ContentService:
    def __init__(self, db: Session):
        self.db = db

    def get_content_by_id(self, content_id: UUID, user_id: UUID) -> Optional[Content]:
        """Get content by ID with access control"""
        return self.db.query(Content).options(
            joinedload(Content.created_by),
            joinedload(Content.last_edited_by),
            joinedload(Content.collaborators).joinedload(ContentCollaborator.user)
        ).filter(
            Content.id == str(content_id),
            or_(
                Content.created_by_id == str(user_id),
                Content.is_public == True,
                Content.collaborators.any(ContentCollaborator.user_id == str(user_id))
            )
        ).first()

    def get_user_content(self, user_id: UUID, filters: Optional[ContentSearchFilters] = None) -> List[Content]:
        """Get all content accessible by a user with optional filtering"""
        query = self.db.query(Content).options(
            joinedload(Content.created_by),
            joinedload(Content.last_edited_by),
            joinedload(Content.collaborators).joinedload(ContentCollaborator.user)
        ).filter(
            or_(
                Content.created_by_id == str(user_id),
                Content.collaborators.any(ContentCollaborator.user_id == str(user_id))
            )
        )

        # Apply filters if provided
        if filters:
            if filters.query:
                search_pattern = f"%{filters.query}%"
                query = query.filter(
                    or_(
                        Content.title.ilike(search_pattern),
                        Content.summary.ilike(search_pattern),
                        Content.author.ilike(search_pattern)
                    )
                )
            
            if filters.types:
                query = query.filter(Content.type.in_([t.value for t in filters.types]))
            
            if filters.statuses:
                query = query.filter(Content.status.in_([s.value for s in filters.statuses]))
            
            if filters.priorities:
                query = query.filter(Content.priority.in_([p.value for p in filters.priorities]))
            
            if filters.tags:
                # PostgreSQL JSONB contains operation for tag filtering
                for tag in filters.tags:
                    query = query.filter(Content.tags.contains([tag]))
            
            if filters.created_after:
                query = query.filter(Content.created_at >= filters.created_after)
            
            if filters.created_before:
                query = query.filter(Content.created_at <= filters.created_before)

        # Order by updated_at desc for most recent first
        query = query.order_by(Content.updated_at.desc())

        # Apply pagination if filters provided
        if filters:
            query = query.offset(filters.skip).limit(filters.limit)

        return query.all()

    def create_content(self, content_in: ContentCreate, user_id: UUID) -> Content:
        """Create new content"""
        # Generate default content based on type if not provided
        if not content_in.content:
            default_content = self._get_default_content(content_in.type.value)
        else:
            default_content = [c.dict() for c in content_in.content]

        content = Content(
            id=str(uuid.uuid4()),
            title=content_in.title,
            type=content_in.type.value,
            url=content_in.url,
            summary=content_in.summary,
            tags=content_in.tags,
            status=content_in.status.value,
            priority=content_in.priority.value,
            content=default_content,
            key_takeaways=content_in.key_takeaways,
            author=content_in.author,
            published_date=content_in.published_date,
            estimated_read_time=content_in.estimated_read_time,
            rating=content_in.rating,
            progress=content_in.progress,
            is_public=content_in.is_public,
            created_by_id=str(user_id),
            last_edited_by_id=str(user_id)
        )

        self.db.add(content)
        self.db.commit()
        self.db.refresh(content)
        
        # Load relationships
        content = self.get_content_by_id(UUID(content.id), user_id)
        return content

    def update_content(self, content_id: UUID, content_in: ContentUpdate, user_id: UUID) -> Optional[Content]:
        """Update content with access control"""
        content = self._get_content_for_write(content_id, user_id)
        if not content:
            return None

        # Update fields
        update_data = content_in.dict(exclude_unset=True)
        
        # Handle editor content serialization
        if "content" in update_data and update_data["content"]:
            update_data["content"] = [c.dict() if hasattr(c, 'dict') else c for c in update_data["content"]]

        # Convert enum values to strings
        if "type" in update_data:
            update_data["type"] = update_data["type"].value
        if "status" in update_data:
            update_data["status"] = update_data["status"].value
        if "priority" in update_data:
            update_data["priority"] = update_data["priority"].value

        # Update last editor
        update_data["last_edited_by_id"] = str(user_id)
        update_data["updated_at"] = datetime.utcnow()

        for key, value in update_data.items():
            if hasattr(content, key):
                setattr(content, key, value)

        self.db.commit()
        self.db.refresh(content)
        return content

    def delete_content(self, content_id: UUID, user_id: UUID) -> bool:
        """Delete content with ownership check"""
        content = self.db.query(Content).filter(
            Content.id == str(content_id),
            Content.created_by_id == str(user_id)  # Only owner can delete
        ).first()

        if not content:
            return False

        self.db.delete(content)
        self.db.commit()
        return True

    def get_content_stats(self, user_id: UUID) -> ContentStats:
        """Get content statistics for a user"""
        base_query = self.db.query(Content).filter(
            or_(
                Content.created_by_id == str(user_id),
                Content.collaborators.any(ContentCollaborator.user_id == str(user_id))
            )
        )

        # Total content
        total_content = base_query.count()

        # By status
        by_status = {}
        for status in ContentStatusEnum:
            count = base_query.filter(Content.status == status.value).count()
            by_status[status.value] = count

        # By type
        by_type = {}
        for content_type in ContentTypeEnum:
            count = base_query.filter(Content.type == content_type.value).count()
            by_type[content_type.value] = count

        # By priority
        by_priority = {}
        for priority in ContentPriorityEnum:
            count = base_query.filter(Content.priority == priority.value).count()
            by_priority[priority.value] = count

        # Average progress
        avg_progress = base_query.with_entities(func.avg(Content.progress)).scalar() or 0.0

        # Completed this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        completed_this_month = base_query.filter(
            Content.status == ContentStatusEnum.completed.value,
            Content.updated_at >= month_start
        ).count()

        # Reading streak (simplified - days with content activity)
        reading_streak = self._calculate_reading_streak(user_id)

        return ContentStats(
            total_content=total_content,
            by_status=by_status,
            by_type=by_type,
            by_priority=by_priority,
            avg_progress=avg_progress,
            completed_this_month=completed_this_month,
            reading_streak=reading_streak
        )

