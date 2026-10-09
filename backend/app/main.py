import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging_config import setup_logging, logger
from app.core.limiter import limiter
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.database.indexes import create_indexes
from app.api.router import api_router

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing FertiLens AI application backend...")
    
    # Ensure storage directories exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.PROCESSED_DIR, exist_ok=True)

    # Connect to MongoDB
    await connect_to_mongo()
    
    # Create indexes in MongoDB
    try:
        db = get_database()
        await create_indexes(db)
    except Exception as e:
        logger.warning(f"Could not initialize indexes on startup: {e}")

    yield

    # Shutdown actions
    logger.info("Shutting down FertiLens AI application backend...")
    await close_mongo_connection()

app = FastAPI(
    title="FertiLens AI API",
    description="Intelligent Clinical Synthesis & Patient Records Platform for Assisted Reproductive Technology (ART)",
    version="1.0.0",
    lifespan=lifespan
)

# Attach SlowAPI limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware (Must support credentials for httpOnly cookies)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Mount API v1 router
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "FertiLens AI API",
        "version": "1.0.0",
        "environment": settings.ENV
    }

@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Welcome to FertiLens AI API. Clinical Intelligence Platform.",
        "docs_url": "/docs",
        "api_prefix": "/api/v1"
    }
