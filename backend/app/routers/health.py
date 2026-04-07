from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import minio_client
from app.database import get_db
from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    minio_ok = minio_client.check_connection()

    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    status = "ok" if (minio_ok and db_ok) else "degraded"
    return HealthResponse(status=status, minio_connected=minio_ok, db_connected=db_ok)
