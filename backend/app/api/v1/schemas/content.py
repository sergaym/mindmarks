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

