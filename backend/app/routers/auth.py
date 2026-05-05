from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone
from app.models.user import User
from app.core.auth import verify_password, create_access_token, get_current_user
from app.schemas.auth import TokenResponse, UserResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.username == form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    user.last_login = datetime.now(timezone.utc)
    await user.save()

    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token, token_type="bearer", role=user.role)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        username=current_user.username,
        role=current_user.role,
        full_name=current_user.full_name,
        email=current_user.email,
    )
