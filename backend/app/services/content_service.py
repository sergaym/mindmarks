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
