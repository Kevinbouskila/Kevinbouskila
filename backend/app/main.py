"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import health, markets
from app.core.config import settings
from app.core.logging import configure_logging

configure_logging()

app = FastAPI(
    title="Polymarket Intelligence Platform",
    description=(
        "Detects, analyzes, and (optionally) executes opportunities on "
        "Polymarket using a pipeline of specialized AI agents."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(markets.router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root() -> dict:
    return {"name": app.title, "version": app.version, "docs": "/docs"}
