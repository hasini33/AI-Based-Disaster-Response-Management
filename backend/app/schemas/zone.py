from pydantic import BaseModel


class ZoneBase(BaseModel):
    zone_name: str
    geometry:str


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(ZoneBase):
    pass


class ZoneResponse(ZoneBase):
    id: int

    class Config:
        from_attributes = True