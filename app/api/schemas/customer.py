from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class CustomerAddress(BaseModel):
    address: str
    is_default: Optional[bool] = False

class CustomerBase(BaseModel):
    name: str
    addresses: Union[str, List[Dict[str, Any]]]  # Может быть JSON-строкой или списком объектов адресов

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    addresses: Optional[Union[str, List[Dict[str, Any]]]] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True