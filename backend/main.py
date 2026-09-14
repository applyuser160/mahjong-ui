"""FastAPI Main Application for Mahjong AI UI.

Connects REST routes, WebSockets, and CORS configurations.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.drill import router as drill_router
from routers.match import router as match_router

app = FastAPI(
    title="Mahjong AI UI API",
    description="FastAPI Backend for 4-Player Match, Realtime AI HUD, and Drill UI",
    version="0.1.0",
)

# Enable CORS for Vite frontend dev server (default port 5173) and any local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drill_router)
app.include_router(match_router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "mahjong-ui-backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
