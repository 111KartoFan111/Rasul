from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from ...database import get_db, Order, Customer, Restaurant, Driver
from ...auth import get_current_user, User
from ..schemas.order import OrderCreate, OrderResponse, OrderUpdate, OrderStatusUpdate, OrderDriverAssign

router = APIRouter()

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить все заказы с возможностью фильтрации по статусу
    """
    query = db.query(Order)
    
    if status and status != "all":
        query = query.filter(Order.status == status)
    
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: OrderCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать новый заказ
    """
    # Проверяем существование клиента
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Проверяем существование ресторана
    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Проверяем существование водителя, если он указан
    if order.driver_id:
        driver = db.query(Driver).filter(Driver.id == order.driver_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
    
    # Подготавливаем данные элементов заказа
    items_data = order.items
    if isinstance(items_data, list):
        items_data = json.dumps(items_data)
    
    # Подготавливаем координаты доставки
    delivery_coordinates = order.delivery_coordinates
    if isinstance(delivery_coordinates, list):
        delivery_coordinates = json.dumps(delivery_coordinates)
    
    # Создаем новый заказ
    db_order = Order(
        customer_id=order.customer_id,
        restaurant_id=order.restaurant_id,
        driver_id=order.driver_id,
        items=items_data,
        total_amount=order.total_amount,
        status=order.status,
        customer_name=order.customer_name or customer.name,
        restaurant_name=order.restaurant_name or restaurant.name,
        driver_name=order.driver_name,
        delivery_address=order.delivery_address,
        delivery_coordinates=delivery_coordinates
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить заказ по ID
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить статус заказа
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Обновляем статус и соответствующие временные метки
    order.status = status_update.status
    
    # Устанавливаем соответствующую временную метку
    now = datetime.utcnow()
    if status_update.status == "assigned":
        # Статус обновляется, но временная метка не меняется
        pass
    elif status_update.status == "preparing":
        order.confirmed_at = now
    elif status_update.status == "in-transit":
        order.in_transit_at = now
    elif status_update.status == "delivered":
        order.delivered_at = now
    elif status_update.status == "cancelled":
        order.cancelled_at = now
    
    db.commit()
    db.refresh(order)
    return order

@router.put("/{order_id}/assign-driver", response_model=OrderResponse)
async def assign_driver_to_order(
    order_id: int,
    driver_assign: OrderDriverAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Назначить водителя на заказ
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Проверяем существование водителя
    driver = db.query(Driver).filter(Driver.id == driver_assign.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Обновляем заказ
    order.driver_id = driver_assign.driver_id
    order.driver_name = driver_assign.driver_name
    order.status = "assigned"  # Автоматически меняем статус на "назначен"
    
    # Обновляем статус водителя на "занят"
    driver.status = "busy"
    
    db.commit()
    db.refresh(order)
    return order