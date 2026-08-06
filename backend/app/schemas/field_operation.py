from pydantic import BaseModel


class FieldOperationCreate(BaseModel):
    disaster_id: int
    zone_id: int
    resource_type: str
    quantity: int


class FieldOperationResponse(FieldOperationCreate):
    id: int
    status: str

    class Config:
        from_attributes = True