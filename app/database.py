from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os
from typing import Dict, List, Any, Optional
import json

# Создаем SQLite базу данных
SQLALCHEMY_DATABASE_URL = "sqlite:///./foodrush.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Модели SQLAlchemy
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="available")  # available, busy, offline
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Отношение один-ко-многим с заказами
    orders = relationship("Order", back_populates="driver")

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    cuisine_type = Column(String, nullable=True)
    coordinates = Column(JSON, nullable=True)  # Координаты для карты
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Отношение один-ко-многим с заказами
    orders = relationship("Order", back_populates="restaurant")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    addresses = Column(JSON)  # JSON для хранения массива адресов
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Отношение один-ко-многим с заказами
    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    items = Column(JSON)  # JSON для хранения элементов заказа
    total_amount = Column(Float)
    status = Column(String, default="new")  # new, assigned, preparing, in-transit, delivered, cancelled
    customer_name = Column(String, nullable=True)
    restaurant_name = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    delivery_address = Column(String)
    delivery_coordinates = Column(JSON, nullable=True)  # Координаты доставки для карты
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    prepared_at = Column(DateTime, nullable=True)
    in_transit_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Связи для отношений
    customer = relationship("Customer", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    driver = relationship("Driver", back_populates="orders")
    
    # Конвертация строки JSON в объект Python при получении
    @property
    def items_as_list(self) -> List[Dict[str, Any]]:
        if isinstance(self.items, str):
            return json.loads(self.items)
        return self.items
    
    # Конвертация координат JSON в список
    @property
    def coordinates_as_list(self) -> Optional[List[float]]:
        if self.delivery_coordinates:
            if isinstance(self.delivery_coordinates, str):
                return json.loads(self.delivery_coordinates)
            return self.delivery_coordinates
        return None

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True, default=1)
    platform_name = Column(String, default="FoodRush")
    contact_email = Column(String, default="contact@foodrush.com")
    support_phone = Column(String, default="+7 (777) 123-4567")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)