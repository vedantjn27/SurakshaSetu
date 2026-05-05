from pydantic import BaseModel
from typing import Optional


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class UserResponse(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None
    email: Optional[str] = None
