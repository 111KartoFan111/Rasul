from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime

class RestaurantBase(BaseModel):
    name: str
    address: str
    cuisine_type: Optional[str] = None
    coordinates: Optional[Union[str, List[float]]] = None  # Координаты ресторана для карты

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    cuisine_type: Optional[str] = None
    coordinates: Optional[Union[str, List[float]]] = None

class RestaurantResponse(RestaurantBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True