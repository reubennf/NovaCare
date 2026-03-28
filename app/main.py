from fastapi import FastAPI
from app.core.config import settings
from app.api.routes import profiles, medications, companion

app = FastAPI(
    title="Novacare API",
    version="0.1.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
)

app.include_router(profiles.router)
app.include_router(medications.router)
app.include_router(companion.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.APP_ENV}