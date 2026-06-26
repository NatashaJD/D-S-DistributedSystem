from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from app.auth.tokens import create_token, verify_token
from app.auth.users import authenticate, DEMO_USERS

router = APIRouter()
security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str
    password: str
    region: Optional[str] = None  # Regional manager selects their region at login


class LoginResponse(BaseModel):
    token: str
    username: str
    name: str
    role: str
    display_role: str
    avatar: str
    scope: str


class UserInfo(BaseModel):
    username: str
    name: str
    role: str
    display_role: str
    avatar: str
    scope: str


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Dependency — returns user dict or None (endpoints decide if auth is required)."""
    if not credentials:
        return None
    payload = verify_token(credentials.credentials)
    if not payload:
        return None
    return {
        "username": payload["u"],
        "role": payload["r"],
        "name": payload["n"],
    }


def require_auth(user=Depends(get_current_user)):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    user = authenticate(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    scope = user["scope"]
    display_role = user["display_role"]

    # Regional manager: inject the chosen region as their scope
    if user["role"] == "regional_manager" and body.region:
        scope = body.region
        display_role = f"{body.region} Regional Manager"

    token = create_token(body.username, user["role"], user["name"])
    return LoginResponse(
        token=token,
        username=body.username,
        name=user["name"],
        role=user["role"],
        display_role=display_role,
        avatar=user["avatar"],
        scope=scope,
    )


@router.get("/me", response_model=UserInfo)
def me(user: dict = Depends(require_auth)):
    meta = DEMO_USERS.get(user["username"], {})
    return UserInfo(
        username=user["username"],
        name=user["name"],
        role=user["role"],
        display_role=meta.get("display_role", user["role"]),
        avatar=meta.get("avatar", "👤"),
        scope=meta.get("scope", "all"),
    )


@router.post("/logout")
def logout():
    # Stateless: client discards the token on logout
    return {"message": "Logged out successfully"}


@router.get("/demo-users")
def list_demo_users():
    """Return demo credentials for the login screen."""
    return [
        {
            "username": uname,
            "name": u["name"],
            "display_role": u["display_role"],
            "avatar": u["avatar"],
            "hint": f"Password: {u['password']}",
            "scope": u["scope"],
        }
        for uname, u in DEMO_USERS.items()
    ]
