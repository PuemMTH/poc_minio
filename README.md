# POC MinIO - Full Stack File Manager

Upload, list, download, and delete files using **React + Ant Design** frontend, **FastAPI** backend, **MinIO** object storage, and **PostgreSQL** metadata — all orchestrated with **Docker Compose**.

## Flow Overview

```mermaid
flowchart LR
    U[User Browser] --> FE[React UI]
    FE --> N[Nginx]
    N --> API[FastAPI]
    API --> DB[(PostgreSQL)]
    API --> OBJ[(MinIO)]
    API --> N
    N --> FE
```

## Runtime Flow

```mermaid
flowchart TD
    R1[Browser opens http://localhost] --> R2[Nginx serves frontend assets]
    R2 --> R3[React app boots]
    R3 --> R4[GET /api/health]
    R3 --> R5[GET /api/files?page=1&page_size=20]
    R4 --> R6[Health card renders]
    R5 --> R7[Registry table renders]
```

## Upload Flow

```mermaid
flowchart TD
    U1[User selects file] --> U2[AntD Upload keeps file in local queue]
    U2 --> U3[User clicks Start secure upload]
    U3 --> U4[POST /api/files multipart form]
    U4 --> U5[Backend validates size and content type]
    U5 -->|valid| U6[Generate object key]
    U6 --> U7[Upload bytes to MinIO]
    U7 --> U8[Insert metadata into PostgreSQL]
    U8 --> U9[Return JSON metadata]
    U9 --> U10[Frontend refreshes file registry]
    U5 -->|invalid| U11[Return 400 to frontend]
    U8 -->|DB write fails| U12[Delete orphan object from MinIO]
```

## File Management Flow

```mermaid
flowchart TD
    M1[Frontend requests paginated files] --> M2[Backend queries PostgreSQL]
    M2 --> M3[Return total and items]
    M3 --> M4[Frontend renders table and filters]

    M5[User clicks Download] --> M6[GET /api/files/:id/download]
    M6 --> M7[Backend loads metadata from PostgreSQL]
    M7 --> M8[Backend reads object stream from MinIO]
    M8 --> M9[Backend streams file to browser]

    M10[User confirms delete] --> M11[DELETE /api/files/:id]
    M11 --> M12[Backend deletes object from MinIO]
    M12 --> M13[Backend deletes metadata from PostgreSQL]
    M13 --> M14[Frontend refreshes table]
```

## Startup Flow

```mermaid
flowchart TD
    S1[docker compose up -d --build] --> S2[PostgreSQL and MinIO start]
    S2 --> S3[Backend container starts]
    S3 --> S4[Alembic upgrade head runs]
    S4 --> S5[FastAPI ensures uploads bucket exists]
    S5 --> S6[Frontend static container starts]
    S6 --> S7[Nginx routes slash to frontend and /api to backend]
```

## Architecture

```
┌──────────────────────────────────────────┐
│            nginx (port 80)               │
│   /api/* → backend    /* → frontend      │
├──────────┬───────────┬───────────────────┤
│ Frontend │  Backend  │  MinIO  │ Postgres│
│ React    │  FastAPI  │  :9000  │  :5432  │
│ Ant Design│  uv      │  :9001  │         │
└──────────┴───────────┴─────────┴─────────┘
```

## Quick Start

```bash
# 1. Clone and enter the project
cd poc_minio

# 2. Start everything (builds + runs all services)
./scripts/start.sh

# 3. Open in browser
open http://localhost
```

**Services:**

| Service        | URL                        | Credentials            |
|----------------|----------------------------|------------------------|
| Web App        | http://localhost            | -                      |
| API Docs       | http://localhost:8000/docs  | -                      |
| MinIO Console  | http://localhost:9001       | minioadmin / minioadmin|
| PostgreSQL     | localhost:5432              | postgres / postgres    |

## API Endpoints

| Method   | Path                       | Description              |
|----------|----------------------------|--------------------------|
| `GET`    | `/api/health`              | Health check             |
| `POST`   | `/api/files`               | Upload file (multipart)  |
| `GET`    | `/api/files`               | List files (paginated)   |
| `GET`    | `/api/files/{id}`          | Get file metadata        |
| `GET`    | `/api/files/{id}/download` | Stream file download via backend |
| `DELETE` | `/api/files/{id}`          | Delete file              |

## Project Structure

```
poc_minio/
├── backend/                 # Python FastAPI + uv
│   ├── app/
│   │   ├── main.py          # App entrypoint
│   │   ├── config.py        # Environment config
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # DB models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── services.py      # Business logic
│   │   ├── minio_client.py  # MinIO wrapper
│   │   └── routers/         # API routes
│   ├── alembic/             # DB migrations
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/                # React + Vite + Ant Design
│   ├── src/
│   │   ├── api/client.ts    # API client
│   │   ├── components/      # UI components
│   │   └── pages/           # Page components
│   ├── package.json
│   └── Dockerfile
├── nginx/                   # Reverse proxy
│   └── nginx.conf
├── scripts/                 # Helper scripts
│   ├── start.sh
│   ├── stop.sh
│   ├── migrate.sh
│   └── smoke-test.sh
├── docker-compose.yml
├── .env.example
└── README.md
```

## Development

### Backend only (local)

```bash
cd backend
cp ../.env.example .env
# Edit .env: set MINIO_ENDPOINT=localhost:9000, DATABASE_URL with localhost
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend only (local)

```bash
cd frontend
npm install
npm run dev
# Proxies /api to localhost:8000 via vite.config.ts
```

### Run migrations manually

```bash
./scripts/migrate.sh
```

### Smoke test

```bash
./scripts/smoke-test.sh
```

## Environment Variables

See [.env.example](.env.example) for all variables.

## Stopping

```bash
./scripts/stop.sh
# Or to remove volumes too:
docker compose down -v
```
