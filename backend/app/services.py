import io
import logging
import uuid
from datetime import datetime

from fastapi import UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import minio_client
from app.config import settings
from app.models import FileRecord

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/json",
    "application/zip",
    "application/x-tar",
    "application/gzip",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def validate_upload(file: UploadFile) -> None:
    max_bytes = settings.upload_max_size_mb * 1024 * 1024
    if file.size and file.size > max_bytes:
        raise ValueError(
            f"File too large. Max size is {settings.upload_max_size_mb} MB."
        )
    ct = file.content_type or "application/octet-stream"
    if ct not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Content type '{ct}' is not allowed.")


def generate_object_key(original_name: str) -> str:
    ext = ""
    if "." in original_name:
        ext = "." + original_name.rsplit(".", 1)[1]
    prefix = datetime.utcnow().strftime("%Y/%m/%d")
    unique = uuid.uuid4().hex[:12]
    return f"{prefix}/{unique}{ext}"


def upload_file(db: Session, file: UploadFile) -> FileRecord:
    validate_upload(file)

    content = file.file.read()
    size = len(content)

    max_bytes = settings.upload_max_size_mb * 1024 * 1024
    if size > max_bytes:
        raise ValueError(
            f"File too large. Max size is {settings.upload_max_size_mb} MB."
        )

    original_name = file.filename or "unnamed"
    content_type = file.content_type or "application/octet-stream"
    object_key = generate_object_key(original_name)

    # Upload to MinIO
    minio_client.upload_object(
        object_key=object_key,
        data=io.BytesIO(content),
        length=size,
        content_type=content_type,
    )

    # Save metadata to DB
    record = FileRecord(
        original_name=original_name,
        object_key=object_key,
        bucket=settings.minio_bucket,
        content_type=content_type,
        size_bytes=size,
        status="uploaded",
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception:
        # Rollback DB and remove orphan object from MinIO
        db.rollback()
        try:
            minio_client.delete_object(object_key)
        except Exception:
            logger.error("Failed to clean up orphan object: %s", object_key)
        raise

    return record


def list_files(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> tuple[list[FileRecord], int]:
    query = db.query(FileRecord).filter(FileRecord.status == "uploaded")
    if search:
        query = query.filter(FileRecord.original_name.ilike(f"%{search}%"))

    total = query.with_entities(func.count(FileRecord.id)).scalar() or 0
    items = (
        query.order_by(FileRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_file(db: Session, file_id: str) -> FileRecord | None:
    return db.query(FileRecord).filter(FileRecord.id == file_id).first()


def delete_file(db: Session, file_id: str) -> bool:
    record = get_file(db, file_id)
    if not record:
        return False
    try:
        minio_client.delete_object(record.object_key, record.bucket)
    except Exception:
        logger.error("Failed to delete object from MinIO: %s", record.object_key)

    db.delete(record)
    db.commit()
    return True
