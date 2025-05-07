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
