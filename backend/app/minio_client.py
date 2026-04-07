import io
import logging

from minio import Minio
from minio.error import S3Error

from app.config import settings

logger = logging.getLogger(__name__)

_client: Minio | None = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
    return _client


def ensure_bucket(bucket: str | None = None) -> None:
    client = get_minio_client()
    bucket = bucket or settings.minio_bucket
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        logger.info("Created bucket: %s", bucket)


def upload_object(
    object_key: str,
    data: io.BytesIO,
    length: int,
    content_type: str,
    bucket: str | None = None,
) -> None:
    client = get_minio_client()
    bucket = bucket or settings.minio_bucket
    client.put_object(
        bucket_name=bucket,
        object_name=object_key,
        data=data,
        length=length,
        content_type=content_type,
    )


def delete_object(object_key: str, bucket: str | None = None) -> None:
    client = get_minio_client()
    bucket = bucket or settings.minio_bucket
    client.remove_object(bucket, object_key)


def get_object(object_key: str, bucket: str | None = None):
    client = get_minio_client()
    bucket = bucket or settings.minio_bucket
    return client.get_object(bucket, object_key)


def check_connection() -> bool:
    try:
        client = get_minio_client()
        client.list_buckets()
        return True
    except S3Error:
        return False
    except Exception:
        return False
