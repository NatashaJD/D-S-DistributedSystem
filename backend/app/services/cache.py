"""
Cache-aside strategy implementation backed by Redis.
Pattern: check cache -> on miss, compute + store -> on write, invalidate.
"""
import json
from typing import Any, Optional

from pydantic import BaseModel

_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            import redis as redis_lib
            from app.config import settings
            _redis_client = redis_lib.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


def cache_get(key: str) -> Optional[Any]:
    r = _get_redis()
    if not r:
        return None
    try:
        raw = r.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    r = _get_redis()
    if not r:
        return
    try:
        if isinstance(value, BaseModel):
            serializable = value.model_dump()
        elif isinstance(value, list):
            serializable = [
                v.model_dump() if isinstance(v, BaseModel) else v
                for v in value
            ]
        else:
            serializable = value
        r.setex(key, ttl, json.dumps(serializable, default=str))
    except Exception:
        pass


def cache_invalidate(*keys: str) -> None:
    r = _get_redis()
    if not r:
        return
    try:
        for key in keys:
            r.delete(key)
    except Exception:
        pass


def cache_invalidate_pattern(pattern: str) -> None:
    """Invalidate all keys matching a glob pattern, e.g. 'analytics:*'."""
    r = _get_redis()
    if not r:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
    except Exception:
        pass
