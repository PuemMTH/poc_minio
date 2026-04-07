from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/poc_minio"
    async_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/poc_minio"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_secure: bool = False
    minio_bucket: str = "uploads"

    # Upload
    upload_max_size_mb: int = 100

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
