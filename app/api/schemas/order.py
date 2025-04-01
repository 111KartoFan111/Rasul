from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class OrderItemBase(BaseModel):
    name: str
    price: float
    quantity: int
    subtotal: Optional[float] = None

class OrderItem(OrderItemBase):
    id: str

class OrderBase(BaseModel):
    customer_id: int
    restaurant_id: int
    driver_id: Optional[int] = None
    items: Union[str, List[Dict[str, Any]]]  # Может быть JSON-строкой или списком объектов
    total_amount: float
    status: str = "new"
    customer_name: Optional[str] = None
    restaurant_name: Optional[str] = None
    driver_name: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_coordinates: Optional[Union[str, List[float]]] = None  # Может быть JSON-строкой или списком координат

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    driver_id: Optional[int] = None
    driver_name: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class OrderDriverAssign(BaseModel):
    driver_id: int
    driver_name: str

class OrderResponse(OrderBase):
    id: int
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    prepared_at: Optional[datetime] = None
    in_transit_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    class Config:
        orm_mode = True