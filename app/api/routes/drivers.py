from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...database import get_db, Driver
from ...auth import get_current_user, User
from ..schemas.driver import DriverCreate, DriverResponse, DriverUpdate

router = APIRouter()

@router.get("/", response_model=List[DriverResponse])
async def get_drivers(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить список всех водителей с возможностью фильтрации по статусу
    """
    query = db.query(Driver)
    
    if status and status != "all":
        query = query.filter(Driver.status == status)
    
    drivers = query.offset(skip).limit(limit).all()
    return drivers

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    driver: DriverCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать нового водителя
    """
    db_driver = Driver(**driver.dict())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить водителя по ID
    """
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: int,
    driver_update: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить данные водителя
    """
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Обновляем поля, если они предоставлены
    update_data = driver_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(driver, key, value)
    
    db.commit()
    db.refresh(driver)
    return driver

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить водителя
    """
    # Проверяем права доступа (только администратор может удалять водителей)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    db.delete(driver)
    db.commit()