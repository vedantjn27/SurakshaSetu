"""
scripts/seed_users.py
Creates default admin, reviewer, and analyst users.
Run once after starting the API: python scripts/seed_users.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.core.auth import hash_password
from app.config import get_settings


DEFAULT_USERS = [
    {"username": "admin",    "password": "admin123",    "role": "admin",    "full_name": "System Administrator"},
    {"username": "reviewer", "password": "review123",   "role": "reviewer", "full_name": "Data Reviewer"},
    {"username": "analyst",  "password": "analyst123",  "role": "analyst",  "full_name": "KCI Analyst"},
]


async def seed():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(database=client[settings.mongodb_db_name], document_models=[User])

    for u in DEFAULT_USERS:
        existing = await User.find_one(User.username == u["username"])
        if existing:
            print(f"  [SKIP] User '{u['username']}' already exists")
            continue
        await User(
            username=u["username"],
            hashed_password=hash_password(u["password"]),
            role=u["role"],
            full_name=u["full_name"],
        ).insert()
        print(f"  [OK]   Created user '{u['username']}' (role={u['role']})")

    client.close()
    print("\nDone. Login at POST /api/v1/auth/login")
    print("Default credentials:")
    for u in DEFAULT_USERS:
        print(f"  {u['username']} / {u['password']}  [{u['role']}]")


if __name__ == "__main__":
    asyncio.run(seed())
