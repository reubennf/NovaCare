from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.routes import profiles, medications, companion, missions, caregiver, social
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Novacare API",
    version="0.1.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
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

@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.APP_ENV}