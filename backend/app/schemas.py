from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    minio_connected: bool
    db_connected: bool


class FileResponse(BaseModel):
    id: str
    original_name: str
    object_key: str
    bucket: str
    content_type: str
    size_bytes: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FileListResponse(BaseModel):
    items: list[FileResponse]
    total: int
    page: int
    page_size: int


class PresignedUrlResponse(BaseModel):
    url: str
    expires_in_seconds: int


class DeleteResponse(BaseModel):
    detail: str
