import os
import logging
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
from redis import asyncio as aioredis
import uvicorn

from .simulator import FactorySimulator
from config.settings import settings
from config.logging import setup_logging

# Setup logging
logger = setup_logging()

# Initialize FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize simulator
factory = FactorySimulator(num_machines=5)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Startup event
@app.on_event("startup")
async def startup():
    # Initialize Redis for caching
    redis = aioredis.from_url(settings.REDIS_URL)
    FastAPICache.init(RedisBackend(redis), prefix="smart-factory-cache")
    logger.info("Application startup complete")

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Health check endpoint
@app.get("/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }

# Cached status endpoint
@app.get("/api/status")
@cache(expire=5)
@limiter.limit("30/minute")
async def get_status(request: Request):
    return factory.get_status()

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            try:
                factory.update()
                status = factory.get_status()
                await websocket.send_json(status)
                await asyncio.sleep(1)
            except (WebSocketDisconnect, ConnectionResetError):
                logger.info("WebSocket client disconnected")
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket: {e}")
    finally:
        await websocket.close()

# API endpoints
@app.get("/api/start/{machine_id}")
@limiter.limit("10/minute")
async def start_machine(request: Request, machine_id: int):
    if 0 <= machine_id < len(factory.machines):
        factory.machines[machine_id].start()
        logger.info(f"Started machine {machine_id}")
        return {"status": "success"}
    return {"status": "error", "message": "Invalid machine ID"}

@app.get("/api/stop/{machine_id}")
@limiter.limit("10/minute")
async def stop_machine(request: Request, machine_id: int):
    if 0 <= machine_id < len(factory.machines):
        factory.machines[machine_id].stop()
        logger.info(f"Stopped machine {machine_id}")
        return {"status": "success"}
    return {"status": "error", "message": "Invalid machine ID"}

@app.get("/api/maintenance/{machine_id}")
@limiter.limit("5/minute")
async def perform_maintenance(request: Request, machine_id: int):
    if 0 <= machine_id < len(factory.machines):
        factory.machines[machine_id].perform_maintenance()
        logger.info(f"Performed maintenance on machine {machine_id}")
        return {"status": "success"}
    return {"status": "error", "message": "Invalid machine ID"}

# Serve index.html for the root path
@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

if __name__ == "__main__":
    # Create static directory if it doesn't exist
    os.makedirs("static", exist_ok=True)
    os.makedirs("static/js", exist_ok=True)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config="config/logging.conf"
    )
