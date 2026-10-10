from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List
import os

class Settings(BaseSettings):
    ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "fertilens_db"

    # Security & JWT
    JWT_SECRET_KEY: str = "supersecretjwtkeyforfertilensclinicalappchangeinproduction32char"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Ollama LLM & Embeddings
    OLLAMA_CLOUD_HOST: str = "https://ollama.com"
    OLLAMA_API_KEY: str = "your_ollama_api_key"
    OLLAMA_LLM_MODEL: str = "gpt-oss:120b"
    OLLAMA_EMBED_HOST: str = "http://localhost:11434"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"
    EMBEDDING_DIMENSIONS: int = 768

    # RAG & Storage
    SIMILARITY_THRESHOLD: float = 0.65
    TOP_K_CHUNKS: int = 6
    UPLOAD_DIR: str = "storage/uploads"
    PROCESSED_DIR: str = "storage/processed"
    MAX_UPLOAD_SIZE_BYTES: int = 10485760  # 10 MB

    # Data Protection & Field-Level Encryption
    ENCRYPTION_KEY: str = "cT9uNQ8vCpKER3w00TT4LsnBEDG1HGoP0GiDVbBOSVc="
    SEARCH_INDEX_KEY: str = "c86eafc1b680545e6a3974ed264247ba6081675f3ba0c5959a88d917aa2a1c79"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
