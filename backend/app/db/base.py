import logging
from contextlib import contextmanager
from typing import Generator, Tuple, Annotated

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create the SQLAlchemy base class
Base = declarative_base()

# Ensure we're using the correct dialect name
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
    logger.info("Changed database URL dialect from 'postgres' to 'postgresql'")

# Create SQLAlchemy engine with psycopg2
try:
    engine = create_engine(
        database_url, 
        pool_pre_ping=True  # Add connection testing before usage
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Error creating database engine: {e}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_sqlalchemy_db() -> Generator[Session, None, None]:
    """
    Get a SQLAlchemy database session as dependency injection for FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Alias for backward compatibility
get_db = get_sqlalchemy_db

# Type alias for type hinting
DBSession = Annotated[Session, Depends(get_db)]


@contextmanager
def get_db_session():
    """
    Context manager to get a database session.
    """
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db():
    """
    Initialize database connection.
    """
    try:
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        raise


def create_tables():
    """Create all defined tables in the database"""
    Base.metadata.create_all(bind=engine) 