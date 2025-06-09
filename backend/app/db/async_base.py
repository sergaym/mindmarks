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

# Create async SQLAlchemy engine
try:
    # Get SSL mode from settings for AsyncPG
    ssl_mode = getattr(settings, 'DB_SSLMODE', 'prefer')
    
    # AsyncPG SSL configuration
    connect_args = {}
    if ssl_mode:
        if ssl_mode == 'require':
            connect_args['ssl'] = True
        elif ssl_mode == 'prefer':
            connect_args['ssl'] = 'prefer'
        elif ssl_mode == 'disable':
            connect_args['ssl'] = False
        # For development/local, often we want to disable SSL
        elif ssl_mode == 'allow':
            connect_args['ssl'] = False
    
    # For local development, try without SSL first if connection fails
    is_local_dev = 'localhost' in get_async_database_url() or '127.0.0.1' in get_async_database_url()
    
    try:
        async_engine = create_async_engine(
            get_async_database_url(),
            # Performance optimizations for async
            pool_size=20,          # Larger pool for async concurrency
            max_overflow=30,       # Allow burst connections
            pool_pre_ping=True,    # Test connections before use
            pool_recycle=3600,     # Recycle connections hourly
            echo=False,            # Set to True for SQL debugging
            future=True,           # Use SQLAlchemy 2.0 style
            connect_args=connect_args  # SSL configuration for AsyncPG
        )
        logger.info(f"Async database engine created successfully with SSL mode: {ssl_mode}")
    except Exception as ssl_error:
        if is_local_dev and ssl_mode != 'disable':
            # Retry without SSL for local development
            logger.warning(f"SSL connection failed for local dev, retrying without SSL: {ssl_error}")
            connect_args['ssl'] = False
            async_engine = create_async_engine(
                get_async_database_url(),
                pool_size=20,
                max_overflow=30,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False,
                future=True,
                connect_args=connect_args
            )
            logger.info("Async database engine created successfully without SSL (local development)")
        else:
            raise ssl_error
            
except Exception as e:
    logger.error(f"Error creating async database engine: {e}")
    raise

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False  # Important for async operations
)

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async dependency injection for FastAPI endpoints.
    Provides AsyncSession for true async database operations.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()

# Type alias for dependency injection
from typing import Annotated
AsyncDBSession = Annotated[AsyncSession, Depends(get_async_db)]

@asynccontextmanager
async def get_async_db_session():
    """
    Async context manager for database session.
    Use this for operations outside of FastAPI endpoints.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()

async def init_async_db():
    """
    Initialize async database connection and test connectivity.
    """
    try:
        async with async_engine.begin() as conn:
            # Test async connection
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()  # fetchone() is synchronous, not async
        logger.info("Async database connection established successfully")
    except Exception as e:
        logger.error(f"Error connecting to async database: {e}")
        raise

async def create_async_tables():
    """
    Create all defined tables in the database using async engine.
    Note: This requires importing Base from the main models file.
    """
    try:
        from app.db.models import Base
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

async def close_async_db():
    """
    Close async database connections gracefully.
    Call this during application shutdown.
    """
    await async_engine.dispose()
    logger.info("Async database connections closed")

# Health check function
async def check_async_db_health() -> bool:
    """
    Check if async database is healthy and responsive.
    Returns True if healthy, False otherwise.
    """
    try:
        async with async_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()  # fetchone() is synchronous, not async
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False 