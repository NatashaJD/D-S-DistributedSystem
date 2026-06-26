"""
Token auth using stdlib HMAC-SHA256 — no external JWT library required.
Token format: base64(payload_json).hexdigest_signature
"""
import hmac
import hashlib
import base64
import time
import json
from typing import Optional

from app.config import settings


def _sign(payload_b64: str) -> str:
    return hmac.new(
        settings.secret_key.encode(),
        payload_b64.encode(),
        hashlib.sha256,
    ).hexdigest()


def create_token(username: str, role: str, name: str, expires_in: int = 28800) -> str:
    """Create a signed token valid for 8 hours by default."""
    payload = {
        "u": username,
        "r": role,
        "n": name,
        "exp": int(time.time()) + expires_in,
    }
    payload_b64 = base64.b64encode(json.dumps(payload).encode()).decode()
    sig = _sign(payload_b64)
    return f"{payload_b64}.{sig}"


def verify_token(token: str) -> Optional[dict]:
    """Return decoded payload dict or None if invalid/expired."""
    try:
        payload_b64, sig = token.rsplit(".", 1)
        expected = _sign(payload_b64)
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.b64decode(payload_b64.encode()).decode())
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None
