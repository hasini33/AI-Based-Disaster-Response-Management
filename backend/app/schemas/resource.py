from typing import Optional

from pydantic import BaseModel, Field, field_validator


VALID_RESOURCE_TYPES = {
    "water",
    "food",
    "medical_kits",
    "shelter",
    "ambulance",
    "hospital",
    "relief_center",
    "other",
}

VALID_STATUSES = {
    "available",
    "unavailable",
    "active",
    "maintenance",
}


def normalize_resource_type(value: str) -> str:
    value = value.strip().lower()

    aliases = {
        "medical kit": "medical_kits",
        "medical kits": "medical_kits",
        "medical_kit": "medical_kits",
        "water": "water",
        "food": "food",
        "shelter": "shelter",
        "ambulance": "ambulance",
        "hospital": "hospital",
        "relief center": "relief_center",
        "relief centre": "relief_center",
    }

    value = aliases.get(value, value)

    if value not in VALID_RESOURCE_TYPES:
        raise ValueError(
            f"Invalid resource_type. "
            f"Allowed values: {sorted(VALID_RESOURCE_TYPES)}"
        )

    return value


def normalize_status(value: str) -> str:
    value = value.strip().lower()

    if value not in VALID_STATUSES:
        raise ValueError(
            f"Invalid status. "
            f"Allowed values: {sorted(VALID_STATUSES)}"
        )

    return value


class ResourceCreate(BaseModel):
    resource_name: str = Field(min_length=1)
    resource_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int = Field(ge=0)
    status: str = "available"

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, value):
        return normalize_resource_type(value)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):
        return normalize_status(value)

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, value):
        if value is not None and not -90 <= value <= 90:
            raise ValueError("Latitude must be between -90 and 90")
        return value

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, value):
        if value is not None and not -180 <= value <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return value


class ResourceUpdate(BaseModel):
    resource_name: Optional[str] = Field(
        default=None,
        min_length=1
    )

    resource_type: Optional[str] = None

    latitude: Optional[float] = None

    longitude: Optional[float] = None

    capacity: Optional[int] = Field(
        default=None,
        ge=0
    )

    status: Optional[str] = None

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, value):
        if value is None:
            return value

        return normalize_resource_type(value)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):
        if value is None:
            return value

        return normalize_status(value)

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, value):
        if value is not None and not -90 <= value <= 90:
            raise ValueError("Latitude must be between -90 and 90")
        return value

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, value):
        if value is not None and not -180 <= value <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return value


class ResourceResponse(BaseModel):
    id: int
    resource_name: str
    resource_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int
    status: str

    class Config:
        from_attributes = True