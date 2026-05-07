from beanie import Document
from pydantic import Field, EmailStr
from typing import Optional
from datetime import datetime, timezone


class User(Document):
    username: str
    email: Optional[str] = None
    hashed_password: str
    role: str = "analyst"           # admin | reviewer | analyst
    is_active: bool = True
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = ["username", "email", "role"]
