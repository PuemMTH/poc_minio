from starlette.background import BackgroundTask

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import minio_client, services
from app.database import get_db
from app.schemas import (
    DeleteResponse,
    FileListResponse,
    FileResponse,
)

router = APIRouter(prefix="/files", tags=["files"])


@router.post("", response_model=FileResponse, status_code=201)
def upload_file(file: UploadFile, db: Session = Depends(get_db)):
    try:
        record = services.upload_file(db, file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    return record


@router.get("", response_model=FileListResponse)
def list_files(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    db: Session = Depends(get_db),
):
    items, total = services.list_files(db, page, page_size, search)
    return FileListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{file_id}", response_model=FileResponse)
def get_file(file_id: str, db: Session = Depends(get_db)):
    record = services.get_file(db, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    return record


@router.get("/{file_id}/download")
def download_file(file_id: str, db: Session = Depends(get_db)):
    record = services.get_file(db, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        minio_response = minio_client.get_object(record.object_key, record.bucket)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Download failed: {exc}") from exc

    return StreamingResponse(
        minio_response.stream(32 * 1024),
        media_type=record.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{record.original_name}"'
        },
        background=BackgroundTask(
            lambda: (minio_response.close(), minio_response.release_conn())
        ),
    )


@router.delete("/{file_id}", response_model=DeleteResponse)
def delete_file(file_id: str, db: Session = Depends(get_db)):
    ok = services.delete_file(db, file_id)
    if not ok:
        raise HTTPException(status_code=404, detail="File not found")
    return DeleteResponse(detail="File deleted successfully")
