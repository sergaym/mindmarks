"""
Pydantic schemas for password reset functionality
"""
from pydantic import BaseModel, EmailStr, Field


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request"""
    email: EmailStr = Field(..., description="Email address to send reset link to")


class ForgotPasswordResponse(BaseModel):
    """Schema for forgot password response"""
    message: str = Field(..., description="Status message")


class ResetPasswordRequest(BaseModel):
    """Schema for reset password request"""
    token: str = Field(..., min_length=1, description="Password reset token from email")
    password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")


class ResetPasswordResponse(BaseModel):
    """Schema for reset password response"""
    message: str = Field(..., description="Status message") 