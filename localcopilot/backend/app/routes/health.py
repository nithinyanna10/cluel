from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter()

_SERVICES: dict[str, str] = {}


def _check_whisper() -> str:
    try:
        import faster_whisper  # noqa: F401
        return "available"
    except ImportError:
        return "not installed (mock mode)"


def _check_easyocr() -> str:
    try:
        import easyocr  # noqa: F401
        return "available"
    except ImportError:
        return "not installed (mock mode)"


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version="0.1.0",
        services={
            "faster_whisper": _check_whisper(),
            "easyocr": _check_easyocr(),
        },
    )
