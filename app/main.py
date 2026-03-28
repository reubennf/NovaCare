from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title="Eldercare API",
    version="0.1.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
)

@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.APP_ENV}
