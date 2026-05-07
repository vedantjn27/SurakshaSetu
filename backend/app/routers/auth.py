from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone
from app.models.user import User
from app.core.auth import verify_password, create_access_token, get_current_user, hash_password, require_role
from app.schemas.auth import TokenResponse, UserResponse, RegisterRequest, RegisterResponse

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

@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest):
    """Register a new user account.
    
    - Anyone can register with the 'analyst' role (read-only access).
    - Creating 'admin' or 'reviewer' accounts requires an existing admin token
      (enforced in a separate admin-guarded endpoint; here we allow open signup
      only for the 'analyst' role for self-service use).
    """
    # Open self-registration is restricted to the analyst role only
    if payload.role in ("admin", "reviewer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only 'analyst' accounts can be self-registered. Contact your administrator to create admin/reviewer accounts.",
        )

    # Check username is unique
    existing = await User.find_one(User.username == payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{payload.username}' is already taken.",
        )

    # Check email uniqueness if provided
    if payload.email:
        existing_email = await User.find_one(User.email == payload.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

    new_user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
        email=payload.email,
    )
    await new_user.insert()

    return RegisterResponse(
        username=new_user.username,
        role=new_user.role,
        full_name=new_user.full_name,
        email=new_user.email,
        message="Account created successfully! You can now sign in.",
    )


@router.post("/admin/register", response_model=RegisterResponse, status_code=201)
async def admin_register(
    payload: RegisterRequest,
    _=Depends(require_role("admin")),
):
    """Admin-only endpoint to create reviewer or admin accounts."""
    existing = await User.find_one(User.username == payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{payload.username}' is already taken.",
        )

    if payload.email:
        existing_email = await User.find_one(User.email == payload.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

    new_user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
        email=payload.email,
    )
    await new_user.insert()

    return RegisterResponse(
        username=new_user.username,
        role=new_user.role,
        full_name=new_user.full_name,
        email=new_user.email,
        message=f"{payload.role.capitalize()} account created successfully.",
    )
