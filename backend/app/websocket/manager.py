import asyncio
import json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis
from app.config import settings

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str = "global"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "global"):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)

    async def broadcast(self, message, channel: str = "global"):
        if channel not in self.active_connections:
            return
        if not isinstance(message, str):
            message = json.dumps(message)
        dead = set()
        for ws in self.active_connections[channel]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active_connections[channel].discard(ws)

    async def send_personal(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)


manager = ConnectionManager()


async def redis_subscriber():
    """Background task: subscribe to Redis and broadcast to WebSocket clients."""
    try:
        r = aioredis.from_url(settings.redis_url)
        pubsub = r.pubsub()
        await pubsub.subscribe("events:global", "events:sla_alert")

        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                channel = message["channel"]
                if isinstance(channel, bytes):
                    channel = channel.decode("utf-8")
                await manager.broadcast(data, "global")
    except Exception:
        pass  # Redis unavailable — graceful degradation


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "global")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.send_personal("pong", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global")
