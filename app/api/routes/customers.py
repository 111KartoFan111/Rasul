from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from ...database import get_db, Customer
from ...auth import get_current_user, User
from ..schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
async def get_customers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить список всех клиентов
    """
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать нового клиента
    """
    # Подготавливаем адреса
    addresses = customer.addresses
    if isinstance(addresses, list):
        addresses = json.dumps(addresses)
    
    # Создаем клиента
    db_customer = Customer(
        name=customer.name,
        addresses=addresses
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить клиента по ID
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить данные клиента
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Подготавливаем данные для обновления
    update_data = customer_update.dict(exclude_unset=True)
    
    # Преобразуем адреса, если они есть
    if "addresses" in update_data and isinstance(update_data["addresses"], list):
        update_data["addresses"] = json.dumps(update_data["addresses"])
    
    # Обновляем поля
    for key, value in update_data.items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить клиента
    """
    # Проверяем права доступа (только администратор может удалять клиентов)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()