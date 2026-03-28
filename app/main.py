from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.routes import profiles, medications, companion, missions, caregiver, social, notifications
from app.workers.scheduler import start_scheduler, stop_scheduler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting scheduler...")
    start_scheduler()
    yield
    # Shutdown
    logger.info("Stopping scheduler...")
    stop_scheduler()

app = FastAPI(
    title="Novacare API",
    version="0.1.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    lifespan=lifespan
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"}
    )

app.include_router(profiles.router)
app.include_router(medications.router)
app.include_router(companion.router)
app.include_router(missions.router)
app.include_router(caregiver.router)
app.include_router(social.router)
app.include_router(notifications.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.APP_ENV}