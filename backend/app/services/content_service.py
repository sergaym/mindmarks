import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_, func, text, select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.db.models import User, Content, ContentCollaborator, ContentTypeEnum, ContentStatusEnum, ContentPriorityEnum
from app.api.v1.schemas.content import (
    ContentCreate, ContentUpdate, ContentSearchFilters, ContentListItem,
    ContentRead, UserBase, ContentCollaboratorBase, ContentStats
)

logger = logging.getLogger(__name__)


class ContentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _convert_to_naive_datetime(dt: Optional[datetime]) -> Optional[datetime]:
        """Convert timezone-aware datetime to timezone-naive datetime for database storage"""
        if dt is None:
            return None
        if dt.tzinfo is not None:
            # Convert to UTC and remove timezone info
            utc_dt = dt.utctimetuple()
            return datetime(utc_dt.tm_year, utc_dt.tm_mon, utc_dt.tm_mday, 
                          utc_dt.tm_hour, utc_dt.tm_min, utc_dt.tm_sec)
        return dt

    async def get_content_by_id(self, content_id: UUID, user_id: UUID) -> Optional[Content]:
        """Get content by ID with access control"""
        try:
            stmt = (
                select(Content)
                .options(
                    selectinload(Content.created_by),
                    selectinload(Content.last_edited_by),
                    selectinload(Content.collaborators).selectinload(ContentCollaborator.user)
                )
                .where(
                    and_(
                        Content.id == str(content_id),
                        or_(
                            Content.created_by_id == str(user_id),
                            Content.is_public == True,
                            Content.collaborators.any(ContentCollaborator.user_id == str(user_id))
                        )
                    )
                )
            )
            
            result = await self.db.execute(stmt)
            content = result.unique().scalar_one_or_none()
            
            if content:
                logger.info(f"Retrieved content {content_id} for user {user_id}")
            else:
                logger.warning(f"Content {content_id} not found or access denied for user {user_id}")
            
            return content
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving content {content_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error retrieving content {content_id}: {str(e)}")
            raise

    async def get_user_content(self, user_id: UUID, filters: Optional[ContentSearchFilters] = None) -> List[Content]:
        """Get all content accessible by a user with optional filtering"""
        try:
            stmt = (
                select(Content)
                .options(
                    selectinload(Content.created_by),
                    selectinload(Content.last_edited_by),
                    selectinload(Content.collaborators).selectinload(ContentCollaborator.user)
                )
                .where(
                    or_(
                        Content.created_by_id == str(user_id),
                        Content.collaborators.any(ContentCollaborator.user_id == str(user_id))
                    )
                )
            )

            # Apply filters if provided
            if filters:
                if filters.query:
                    search_pattern = f"%{filters.query}%"
                    stmt = stmt.where(
                        or_(
                            Content.title.ilike(search_pattern),
                            Content.summary.ilike(search_pattern),
                            Content.author.ilike(search_pattern)
                        )
                    )
                
                if filters.types:
                    stmt = stmt.where(Content.type.in_([t.value for t in filters.types]))
                
                if filters.statuses:
                    stmt = stmt.where(Content.status.in_([s.value for s in filters.statuses]))
                
                if filters.priorities:
                    stmt = stmt.where(Content.priority.in_([p.value for p in filters.priorities]))
                
                if filters.tags:
                    # PostgreSQL JSONB contains operation for tag filtering
                    for tag in filters.tags:
                        stmt = stmt.where(Content.tags.contains([tag]))
                
                if filters.created_after:
                    stmt = stmt.where(Content.created_at >= filters.created_after)
                
                if filters.created_before:
                    stmt = stmt.where(Content.created_at <= filters.created_before)

            # Order by updated_at desc for most recent first
            stmt = stmt.order_by(Content.updated_at.desc())

            # Apply pagination if filters provided
            if filters:
                stmt = stmt.offset(filters.skip).limit(filters.limit)

            result = await self.db.execute(stmt)
            content_list = result.unique().scalars().all()
            
            logger.info(f"Retrieved {len(content_list)} content items for user {user_id}")
            return list(content_list)
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving user content for {user_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error retrieving user content for {user_id}: {str(e)}")
            raise

    async def create_content(self, content_in: ContentCreate, user_id: UUID) -> Optional[Content]:
        """Create new content"""
        try:
            # Generate default content based on type if not provided
            if not content_in.content:
                default_content = self._get_default_content(content_in.type.value)
            else:
                default_content = [c.dict() for c in content_in.content]

            # Convert timezone-aware datetime to naive for database storage
            published_date = self._convert_to_naive_datetime(content_in.published_date)

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
                published_date=published_date,
                estimated_read_time=content_in.estimated_read_time,
                rating=content_in.rating,
                progress=content_in.progress,
                is_public=content_in.is_public,
                created_by_id=str(user_id),
                last_edited_by_id=str(user_id)
            )

            self.db.add(content)
            await self.db.commit()
            await self.db.refresh(content)
        
            # Load relationships
            created_content = await self.get_content_by_id(UUID(content.id), user_id)
            
            logger.info(f"Created content {content.id} for user {user_id}")
            return created_content
            
        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Integrity error creating content for user {user_id}: {str(e)}")
            raise
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Database error creating content for user {user_id}: {str(e)}")
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Unexpected error creating content for user {user_id}: {str(e)}")
            raise

    async def update_content(self, content_id: UUID, content_in: ContentUpdate, user_id: UUID) -> Optional[Content]:
        """Update content with access control"""
        try:
            content = await self._get_content_for_write(content_id, user_id)
            if not content:
                logger.warning(f"Content {content_id} not found or no write access for user {user_id}")
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

            # Handle timezone conversion for published_date
            if "published_date" in update_data:
                update_data["published_date"] = self._convert_to_naive_datetime(update_data["published_date"])

            # Update last editor
            update_data["last_edited_by_id"] = str(user_id)
            update_data["updated_at"] = datetime.utcnow()

            for key, value in update_data.items():
                if hasattr(content, key):
                    setattr(content, key, value)

            await self.db.commit()
            await self.db.refresh(content)
            
            logger.info(f"Updated content {content_id} by user {user_id}")
            return content

        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Database error updating content {content_id}: {str(e)}")
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Unexpected error updating content {content_id}: {str(e)}")
            raise
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

    def _calculate_reading_streak(self, user_id: UUID) -> int:
        """Calculate reading streak (days with content updates)"""
        # Simplified implementation - count consecutive days with updates
        # This could be enhanced with more sophisticated logic
        current_date = datetime.utcnow().date()
        streak = 0
        
        for i in range(365):  # Check up to a year
            check_date = current_date - timedelta(days=i)
            
            # Check if user had any content activity on this date
            activity = self.db.query(Content).filter(
                or_(
                    Content.created_by_id == str(user_id),
                    Content.collaborators.any(ContentCollaborator.user_id == str(user_id))
                ),
                func.date(Content.updated_at) == check_date
            ).first()
            
            if activity:
                streak += 1
            elif i > 0:  # Don't break on first day if no activity today
                break
        
        return streak

