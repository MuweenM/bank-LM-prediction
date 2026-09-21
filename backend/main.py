"""FastAPI application entry point."""

from fastapi import FastAPI

app = FastAPI(title="Bank Marketing API")


@app.get("/health")
def health() -> dict[str, str]:
    """Return service health."""
    return {"status": "ok"}
