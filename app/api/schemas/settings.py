from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SettingsBase(BaseModel):
    platform_name: Optional[str] = None
    contact_email: Optional[str] = None
    support_phone: Optional[str] = None

class SettingsUpdate(SettingsBase):
    pass

class SettingsResponse(SettingsBase):
    id: int
    updated_at: datetime

    class Config:
        orm_mode = True