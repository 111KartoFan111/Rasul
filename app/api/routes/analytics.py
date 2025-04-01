from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json

from ...database import get_db, Order, Restaurant, Driver, Customer
from ...auth import get_current_user, User
from ..schemas.analytics import (
    TimeFilterParams, 
    AnalyticsSummary, 
    OrderStatusStats, 
    DriverPerformanceItem, 
    RestaurantPerformanceItem,
    TimeSeriesItem,
    SalesAnalytics
)

router = APIRouter()

@router.post("/sales", response_model=SalesAnalytics)
async def get_sales_analytics(
    params: TimeFilterParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить аналитику продаж
    """
    # Применяем фильтр по датам
    date_filter = get_date_filter(params)
    query = db.query(Order)
    
    if date_filter:
        query = query.filter(date_filter)
    
    # Получаем все заказы для статистики
    orders = query.all()
    
    # Расчет общих метрик
    total_orders = len(orders)
    total_sales = sum(order.total_amount for order in orders)
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    # Расчет статистики по статусам
    status_stats = OrderStatusStats(
        new=sum(1 for order in orders if order.status == "new"),
        assigned=sum(1 for order in orders if order.status == "assigned"),
        preparing=sum(1 for order in orders if order.status == "preparing"),
        in_transit=sum(1 for order in orders if order.status == "in-transit"),
        delivered=sum(1 for order in orders if order.status == "delivered"),
        cancelled=sum(1 for order in orders if order.status == "cancelled")
    )
    
    # Расчет среднего времени доставки
    completed_orders = [order for order in orders if order.status == "delivered" and order.confirmed_at and order.delivered_at]
    total_delivery_time = sum((order.delivered_at - order.confirmed_at).total_seconds() for order in completed_orders)
    avg_delivery_time = int(total_delivery_time / len(completed_orders) / 60) if completed_orders else 0  # в минутах
    
    # Расчет процента завершенных заказов
    total_excluding_new = sum(1 for order in orders if order.status != "new")
    completion_rate = status_stats.delivered / total_excluding_new * 100 if total_excluding_new > 0 else 0
    
    # Получаем топ водителей
    driver_stats = {}
    for order in orders:
        if order.driver_id and order.status == "delivered":
            if order.driver_id not in driver_stats:
                driver_stats[order.driver_id] = {
                    "deliveries": 0,
                    "total_time": 0,
                    "name": order.driver_name or "Unknown"
                }
            driver_stats[order.driver_id]["deliveries"] += 1
            if order.confirmed_at and order.delivered_at:
                delivery_time = (order.delivered_at - order.confirmed_at).total_seconds() / 60  # в минутах
                driver_stats[order.driver_id]["total_time"] += delivery_time
    
    top_drivers = []
    for driver_id, stats in driver_stats.items():
        avg_time = stats["total_time"] / stats["deliveries"] if stats["deliveries"] > 0 else 0
        top_drivers.append(DriverPerformanceItem(
            id=driver_id,
            name=stats["name"],
            deliveries=stats["deliveries"],
            avg_delivery_time=int(avg_time)
        ))
    
    # Сортируем водителей по количеству доставок
    top_drivers.sort(key=lambda x: x.deliveries, reverse=True)
    top_drivers = top_drivers[:5]  # Берем топ-5
    
    # Получаем топ ресторанов
    restaurant_stats = {}
    for order in orders:
        if order.restaurant_id:
            if order.restaurant_id not in restaurant_stats:
                restaurant_stats[order.restaurant_id] = {
                    "sales": 0,
                    "orders": 0,
                    "name": order.restaurant_name or "Unknown"
                }
            restaurant_stats[order.restaurant_id]["sales"] += order.total_amount
            restaurant_stats[order.restaurant_id]["orders"] += 1
    
    top_restaurants = []
    for restaurant_id, stats in restaurant_stats.items():
        top_restaurants.append(RestaurantPerformanceItem(
            id=restaurant_id,
            name=stats["name"],
            sales=stats["sales"],
            orders=stats["orders"]
        ))
    
    # Сортируем рестораны по объему продаж
    top_restaurants.sort(key=lambda x: x.sales, reverse=True)
    top_restaurants = top_restaurants[:5]  # Берем топ-5
    
    # Создаем сводку аналитики
    summary = AnalyticsSummary(
        total_orders=total_orders,
        total_sales=total_sales,
        avg_order_value=avg_order_value,
        avg_delivery_time=avg_delivery_time,
        completion_rate=completion_rate,
        order_statuses=status_stats,
        top_drivers=top_drivers,
        top_restaurants=top_restaurants
    )
    
    # Построение временного ряда (daily)
    time_series = []
    if orders:
        # Получаем дневную статистику
        daily_stats = db.query(
            cast(Order.created_at, Date).label('date'),
            func.count(Order.id).label('orders'),
            func.sum(Order.total_amount).label('sales')
        )
        
        if date_filter:
            daily_stats = daily_stats.filter(date_filter)
        
        daily_stats = daily_stats.group_by(cast(Order.created_at, Date)) \
                               .order_by(cast(Order.created_at, Date)) \
                               .all()
        
        for stat in daily_stats:
            time_series.append(TimeSeriesItem(
                date=stat.date.isoformat(),
                orders=stat.orders,
                sales=stat.sales
            ))
    
    # Формируем и возвращаем полную аналитику
    return SalesAnalytics(
        summary=summary,
        time_series=time_series
    )

@router.get("/dashboard", response_model=AnalyticsSummary)
async def get_dashboard_analytics(
    period: str = "week",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить дашборд с основными метриками для главной страницы
    """
    # Создаем параметры фильтрации
    params = TimeFilterParams(period=period)
    date_filter = get_date_filter(params)
    
    # Базовый запрос
    query = db.query(Order)
    if date_filter:
        query = query.filter(date_filter)
    
    # Получаем заказы
    orders = query.all()
    
    # Расчет общих метрик
    total_orders = len(orders)
    total_sales = sum(order.total_amount for order in orders)
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    # Статистика по статусам
    status_stats = OrderStatusStats(
        new=sum(1 for order in orders if order.status == "new"),
        assigned=sum(1 for order in orders if order.status == "assigned"),
        preparing=sum(1 for order in orders if order.status == "preparing"),
        in_transit=sum(1 for order in orders if order.status == "in-transit"),
        delivered=sum(1 for order in orders if order.status == "delivered"),
        cancelled=sum(1 for order in orders if order.status == "cancelled")
    )
    
    # Среднее время доставки
    completed_orders = [order for order in orders if order.status == "delivered" and order.confirmed_at and order.delivered_at]
    total_delivery_time = sum((order.delivered_at - order.confirmed_at).total_seconds() for order in completed_orders)
    avg_delivery_time = int(total_delivery_time / len(completed_orders) / 60) if completed_orders else 0
    
    # Процент завершенных заказов
    total_excluding_new = sum(1 for order in orders if order.status != "new")
    completion_rate = status_stats.delivered / total_excluding_new * 100 if total_excluding_new > 0 else 0
    
    # Упрощенная версия для дашборда - только общие метрики без детализации
    return AnalyticsSummary(
        total_orders=total_orders,
        total_sales=total_sales,
        avg_order_value=avg_order_value,
        avg_delivery_time=avg_delivery_time,
        completion_rate=completion_rate,
        order_statuses=status_stats,
        top_drivers=[],  # Упрощенная версия без детализации
        top_restaurants=[]  # Упрощенная версия без детализации
    )
    now = datetime.utcnow()
    
    if params.period == "today":
        # Сегодняшний день
        start_date = datetime(now.year, now.month, now.day)
        end_date = start_date + timedelta(days=1)
    elif params.period == "week":
        # Последние 7 дней
        start_date = now - timedelta(days=7)
        end_date = now
    elif params.period == "month":
        # Последние 30 дней
        start_date = now - timedelta(days=30)
        end_date = now
    elif params.period == "custom" and params.start_date and params.end_date:
        # Пользовательский период
        start_date = params.start_date
        end_date = params.end_date
    else:
        # По умолчанию - все время
        return None
    
    return Order.created_at.between(start_date, end_date)