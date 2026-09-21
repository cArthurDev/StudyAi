import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger(__name__)

# Base declarative class
Base = declarative_base()

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True
)

# Session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db():
    """Initialize database, extensions, and tables with SQLite / Postgres compatibility."""
    try:
        async with engine.begin() as conn:
            # Enable pgvector extension if on Postgres
            if "postgresql" in settings.DATABASE_URL:
                try:
                    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    logger.info("pgvector extension ensured.")
                except Exception as e:
                    logger.warning(f"Could not create vector extension directly: {e}")
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        raise e

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining async DB sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
