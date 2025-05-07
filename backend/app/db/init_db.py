from sqlalchemy import create_engine
import os
import dotenv
from sqlalchemy.orm import sessionmaker

dotenv.load_dotenv(dotenv.find_dotenv(".env"))

POSTGRES_USER = os.getenv("DB_USERNAME")
POSTGRES_PASSWORD = os.getenv("DB_PASSWORD")
POSTGRES_DB = os.getenv("DB_DATABASE")
POSTGRES_HOST = os.getenv("DB_HOST")
POSTGRES_PORT = os.getenv("DB_PORT")

# PostgreSQL connection URL
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Create a SQLAlchemy engine
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> SessionLocal:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
