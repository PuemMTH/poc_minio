import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.minio_client import ensure_bucket
from app.routers import files, health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Ensuring MinIO bucket '%s' exists...", settings.minio_bucket)
    try:
        ensure_bucket()
        logger.info("MinIO bucket ready.")
    except Exception as e:
        logger.warning("Could not ensure MinIO bucket: %s", e)
    yield
    # Shutdown
    logger.info("Shutting down.")


app = FastAPI(
    title="POC MinIO API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(files.router, prefix="/api")
