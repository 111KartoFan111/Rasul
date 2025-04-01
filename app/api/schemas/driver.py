from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DriverBase(BaseModel):
    name: str
    status: str = "available"  # available, busy, offline

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class DriverResponse(DriverBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True