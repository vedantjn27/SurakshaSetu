from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class UserResponse(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None
    email: Optional[str] = None


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: Literal["admin", "reviewer", "analyst"] = "analyst"
    full_name: Optional[str] = None
    email: Optional[str] = None


class RegisterResponse(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    message: str = "Account created successfully"
