from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ...database import get_db, Restaurant
from ...auth import get_current_user, User
from ..schemas.restaurant import RestaurantCreate, RestaurantResponse, RestaurantUpdate

router = APIRouter()

@router.get("/", response_model=List[RestaurantResponse])
async def get_restaurants(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить список всех ресторанов
    """
    restaurants = db.query(Restaurant).offset(skip).limit(limit).all()
    return restaurants

@router.post("/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
async def create_restaurant(
    restaurant: RestaurantCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать новый ресторан
    """
    # Проверяем на дубликаты
    existing = db.query(Restaurant).filter(
        Restaurant.name == restaurant.name, 
        Restaurant.address == restaurant.address
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Restaurant with this name and address already exists")
    
    # Подготавливаем координаты
    coordinates = restaurant.coordinates
    if isinstance(coordinates, list):
        coordinates = json.dumps(coordinates)
    
    # Создаем ресторан
    db_restaurant = Restaurant(
        name=restaurant.name,
        address=restaurant.address,
        cuisine_type=restaurant.cuisine_type,
        coordinates=coordinates
    )
    
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить ресторан по ID
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@router.put("/{restaurant_id}", response_model=RestaurantResponse)
async def update_restaurant(
    restaurant_id: int,
    restaurant_update: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить данные ресторана
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Подготавливаем данные для обновления
    update_data = restaurant_update.dict(exclude_unset=True)
    
    # Преобразуем координаты, если они есть
    if "coordinates" in update_data and isinstance(update_data["coordinates"], list):
        update_data["coordinates"] = json.dumps(update_data["coordinates"])
    
    # Обновляем поля
    for key, value in update_data.items():
        setattr(restaurant, key, value)
    
    db.commit()
    db.refresh(restaurant)
    return restaurant

@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить ресторан
    """
    # Проверяем права доступа (только администратор может удалять рестораны)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    db.delete(restaurant)
    db.commit()