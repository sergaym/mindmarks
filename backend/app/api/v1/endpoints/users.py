from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.core.security import get_current_active_superuser, get_current_user
from app.api.v1.schemas.user import UserRead, UserUpdate
from app.services.user_service import UserService
from app.core.security import get_password_hash
from app.db.async_base import AsyncDBSession
from app.db.models import User

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Get current user
    No database call needed since user is already authenticated
    """
    # Convert User model to UserRead schema
    return UserRead.from_orm(current_user)


@router.patch("/me", response_model=UserRead)
async def update_user_me(
    user_in: UserUpdate,
    db: AsyncDBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Update own user information
    True async implementation with AsyncSession for maximum performance
    
    Using PATCH is more appropriate here than PUT because:
    1. We're allowing partial updates to the user resource
    2. Only the provided fields are updated, not the entire resource
    3. It follows HTTP semantics where PATCH is for partial updates
    """
    # Extract fields to update
    update_data = user_in.dict(exclude_unset=True)
    
    # Handle password separately
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Create user service
    user_svc = UserService(db)
    
    # Check if email already exists for another user
    if "email" in update_data:
        existing_user = await user_svc.get_user_by_email(update_data["email"])
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
    
    # Only update if there are changes
    if update_data:
        # Pass the dictionary directly
        updated_user = await user_svc.update_user(UUID(current_user.id), update_data)
        if updated_user:
            return UserRead.from_orm(updated_user)
    
    # If no changes or update failed, return current user
    return UserRead.from_orm(current_user)


@router.get("", response_model=List[UserRead])
async def read_users(
    db: AsyncDBSession,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Retrieve all users - superuser only
    True async implementation with AsyncSession for maximum performance
    """
    user_svc = UserService(db)
    users = await user_svc.get_users(skip, limit)
    return [UserRead.from_orm(user) for user in users]


@router.get("/{user_id}", response_model=UserRead)
async def read_user_by_id(
    user_id: UUID,
    db: AsyncDBSession,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get a specific user by id - superuser only
    True async implementation with AsyncSession for maximum performance
    """
    user_svc = UserService(db)
    user = await user_svc.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    
    return UserRead.from_orm(user)


