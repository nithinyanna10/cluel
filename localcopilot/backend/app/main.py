from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.utils.logging import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LocalCopilot backend starting")
    init_db()
    logger.info("Database initialised")
    yield
    logger.info("LocalCopilot backend stopped")


app = FastAPI(
    title="LocalCopilot API",
    description="Ethical AI Meeting Productivity Assistant — runs entirely on your machine.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "tauri://localhost",
        "http://localhost:1420",
        "http://localhost:5173",
        "http://127.0.0.1:1420",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers after app is constructed to avoid circular imports
from app.routes import assistant, health, ocr, sessions, settings, transcription  # noqa: E402

app.include_router(health.router, tags=["health"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
app.include_router(transcription.router, prefix="/transcription", tags=["transcription"])
app.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
