"""
Demo user store — Davis & Shirtliff 1000 Eyes platform.
No personal names used; all identities are functional role titles.
In production this would be backed by a users DB table with hashed passwords.
"""

DEMO_USERS = {
    # ── Leadership ────────────────────────────────────────────────────────────
    "ceo": {
        "password": "dayliff2024",
        "role": "executive",
        "name": "CEO | Board View",
        "display_role": "Chief Executive Officer",
        "avatar": "CE",
        "scope": "all",
    },
    "coo": {
        "password": "ops2024",
        "role": "ops_manager",
        "name": "Operations Manager",
        "display_role": "Chief Operations Officer",
        "avatar": "CO",
        "scope": "all",
    },

    # ── Regional (scope is set dynamically at login) ───────────────────────────
    "regional_manager": {
        "password": "region2024",
        "role": "regional_manager",
        "name": "Regional Manager",
        "display_role": "Regional Manager",
        "avatar": "RM",
        "scope": "all",          # overridden by the chosen region at login
    },

    # ── Department heads ──────────────────────────────────────────────────────
    "sales_head": {
        "password": "sales2024",
        "role": "sales_engineer",
        "name": "Head of Sales",
        "display_role": "Head of Sales",
        "avatar": "HS",
        "scope": "Sales",
    },
    "engineering_head": {
        "password": "eng2024",
        "role": "engineering_officer",
        "name": "Head of Engineering",
        "display_role": "Head of Engineering",
        "avatar": "HE",
        "scope": "Engineering",
    },
    "logistics_head": {
        "password": "dispatch2024",
        "role": "logistics_officer",
        "name": "Head of Logistics",
        "display_role": "Head of Logistics",
        "avatar": "HL",
        "scope": "Logistics",
    },
    "aftersales_head": {
        "password": "service2024",
        "role": "aftersales_officer",
        "name": "Head of After Sales",
        "display_role": "Head of After Sales",
        "avatar": "HA",
        "scope": "After Sales",
    },
    "finance_head": {
        "password": "finance2024",
        "role": "finance_officer",
        "name": "Head of Finance",
        "display_role": "Head of Finance",
        "avatar": "HF",
        "scope": "Finance",
    },
}


def authenticate(username: str, password: str) -> dict | None:
    user = DEMO_USERS.get(username)
    if user and user["password"] == password:
        return user
    return None
