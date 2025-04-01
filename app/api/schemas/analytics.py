from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class TimeFilterParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    period: str = "all"  # all, today, week, month, custom

class DriverPerformanceItem(BaseModel):
    id: int
    name: str
    deliveries: int
    avg_delivery_time: Optional[int] = None  # в минутах

class RestaurantPerformanceItem(BaseModel):
    id: int
    name: str
    sales: float
    orders: int

class OrderStatusStats(BaseModel):
    new: int = 0
    assigned: int = 0
    preparing: int = 0
    in_transit: int = 0
    delivered: int = 0
    cancelled: int = 0

class AnalyticsSummary(BaseModel):
    total_orders: int
    total_sales: float
    avg_order_value: float
    avg_delivery_time: int  # в минутах
    completion_rate: float  # процент завершенных заказов
    order_statuses: OrderStatusStats
    top_drivers: List[DriverPerformanceItem] = []
    top_restaurants: List[RestaurantPerformanceItem] = []

class TimeSeriesItem(BaseModel):
    date: str
    orders: int
    sales: float

class SalesAnalytics(BaseModel):
    summary: AnalyticsSummary
    time_series: List[TimeSeriesItem] = []