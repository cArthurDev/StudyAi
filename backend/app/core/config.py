import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow",
        case_sensitive=True
    )

    PROJECT_NAME: str = "StudyMind AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "studymind-ai-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (Defaults to SQLite for instant Zero-Docker execution, supports PostgreSQL + pgvector via .env)
    DATABASE_URL: str = "sqlite+aiosqlite:///./studymind.db"
    SYNC_DATABASE_URL: str = "sqlite:///./studymind.db"
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_LLM_MODEL: str = "qwen3:8b"
    OLLAMA_EMBEDDING_MODEL: str = "qwen3-embedding:0.6b"
    
    # Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".pptx", ".txt"]
    
    # RAG settings
    EMBEDDING_DIMENSION: int = 1024  # qwen3-embedding:0.6b output dimension
    CHUNK_SIZE: int = 800  # characters
    CHUNK_OVERLAP: int = 150
    TOP_K_CHUNKS: int = 5
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

settings = Settings()
