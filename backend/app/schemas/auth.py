from pydantic import BaseModel


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str


class UpdateProfileRequest(BaseModel):
    name: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str