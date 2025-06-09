"""
Async database configuration for maximum performance with AsyncPG
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from fastapi import Depends

from app.core.config import settings

logger = logging.getLogger(__name__)

# Convert DATABASE_URL to async format for AsyncPG
def get_async_database_url() -> str:
    """Convert sync database URL to async format for AsyncPG"""
    database_url = settings.DATABASE_URL
    
    # Replace postgresql:// with postgresql+asyncpg:// for async
    if database_url.startswith("postgresql://"):
        async_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgres://"):
        async_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    else:
        # Already async format
        async_url = database_url
    
    # AsyncPG doesn't accept 'sslmode' in URL - remove it
    # SSL will be handled by connection parameters instead
    if "sslmode=" in async_url:
        # Remove sslmode parameter from URL
        import urllib.parse
        parsed = urllib.parse.urlparse(async_url)
        query_params = urllib.parse.parse_qs(parsed.query)
        
        # Remove sslmode from query parameters
        if 'sslmode' in query_params:
            del query_params['sslmode']
        
        # Rebuild URL without sslmode
        new_query = urllib.parse.urlencode(query_params, doseq=True)
        async_url = urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
    
    logger.info("Configured async database URL with AsyncPG driver (SSL handled separately)")
    return async_url

