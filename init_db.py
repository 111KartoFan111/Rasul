import json
from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.database import User, Driver, Restaurant, Customer, Order, Settings
from app.auth import get_password_hash

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

# Получаем сессию БД
db = SessionLocal()

# Функция для инициализации тестовых данных
def init_db():
    try:
        # Проверяем, есть ли уже данные в таблицах
        if db.query(User).count() > 0:
            print("База данных уже содержит данные. Инициализация пропущена.")
            return
        
        print("Инициализация базы данных...")
        
        # Создаем администратора
        admin = User(
            username="admin",
            email="admin@foodrush.com",
            hashed_password=get_password_hash("admin"),
            role="admin"
        )
        db.add(admin)
        
        # Создаем тестовых водителей
        drivers = [
            Driver(name="Иван Петров", status="available"),
            Driver(name="Мария Иванова", status="busy"),
            Driver(name="Алексей Смирнов", status="available"),
            Driver(name="Елена Козлова", status="offline"),
            Driver(name="Дмитрий Новиков", status="available")
        ]
        db.add_all(drivers)
        
        # Создаем тестовые рестораны
        restaurants = [
            Restaurant(
                name="Пиццерия 'Маргарита'", 
                address="ул. Кунаева 10, Астана",
                cuisine_type="Итальянская",
                coordinates=json.dumps([71.433783, 51.158894])
            ),
            Restaurant(
                name="Суши-бар 'Сакура'", 
                address="пр. Республики 24, Астана",
                cuisine_type="Японская",
                coordinates=json.dumps([71.443783, 51.168894])
            ),
            Restaurant(
                name="Кафе 'Здоровая еда'", 
                address="ул. Сыганак 15, Астана",
                cuisine_type="Вегетарианская",
                coordinates=json.dumps([71.453783, 51.178894])
            ),
            Restaurant(
                name="Бургерная 'Мясоед'", 
                address="пр. Туран 37, Астана",
                cuisine_type="Фастфуд",
                coordinates=json.dumps([71.463783, 51.188894])
            ),
            Restaurant(
                name="Ресторан 'Восточный'", 
                address="ул. Достык 5, Астана",
                cuisine_type="Азиатская",
                coordinates=json.dumps([71.473783, 51.198894])
            )
        ]
        db.add_all(restaurants)
        
        # Создаем тестовых клиентов
        customers = [
            Customer(
                name="Анна Сидорова",
                addresses=json.dumps([{"address": "ул. Кунаева 10, Астана", "is_default": True}])
            ),
            Customer(
                name="Владимир Петров",
                addresses=json.dumps([{"address": "пр. Республики 24, Астана", "is_default": True}])
            ),
            Customer(
                name="Светлана Кузнецова",
                addresses=json.dumps([{"address": "ул. Сыганак 15, Астана", "is_default": True}])
            ),
            Customer(
                name="Николай Иванов",
                addresses=json.dumps([
                    {"address": "пр. Туран 37, Астана", "is_default": True},
                    {"address": "ул. Достык 5, Астана", "is_default": False}
                ])
            ),
            Customer(
                name="Ольга Смирнова",
                addresses=json.dumps([{"address": "ул. Достык 5, Астана", "is_default": True}])
            )
        ]
        db.add_all(customers)
        
        # Коммитим, чтобы получить ID для созданных объектов
        db.commit()
        
        # Создаем тестовые заказы
        now = datetime.utcnow()
        orders = [
            Order(
                customer_id=1,
                restaurant_id=1,
                driver_id=1,
                items=json.dumps([
                    {"id": "item-1", "name": "Пицца 'Маргарита'", "price": 1500, "quantity": 2, "subtotal": 3000},
                    {"id": "item-2", "name": "Кола", "price": 300, "quantity": 2, "subtotal": 600}
                ]),
                total_amount=3600,
                status="delivered",
                customer_name="Анна Сидорова",
                restaurant_name="Пиццерия 'Маргарита'",
                driver_name="Иван Петров",
                delivery_address="ул. Кунаева 10, Астана",
                delivery_coordinates=json.dumps([71.433783, 51.158894]),
                created_at=now - timedelta(days=1, hours=3),
                confirmed_at=now - timedelta(days=1, hours=2, minutes=45),
                prepared_at=now - timedelta(days=1, hours=2, minutes=15),
                in_transit_at=now - timedelta(days=1, hours=1, minutes=45),
                delivered_at=now - timedelta(days=1, hours=1)
            ),
            Order(
                customer_id=2,
                restaurant_id=2,
                driver_id=3,
                items=json.dumps([
                    {"id": "item-3", "name": "Суши-сет 'Филадельфия'", "price": 4500, "quantity": 1, "subtotal": 4500},
                    {"id": "item-4", "name": "Мисо-суп", "price": 800, "quantity": 2, "subtotal": 1600}
                ]),
                total_amount=6100,
                status="in-transit",
                customer_name="Владимир Петров",
                restaurant_name="Суши-бар 'Сакура'",
                driver_name="Алексей Смирнов",
                delivery_address="пр. Республики 24, Астана",
                delivery_coordinates=json.dumps([71.443783, 51.168894]),
                created_at=now - timedelta(hours=2),
                confirmed_at=now - timedelta(hours=1, minutes=45),
                prepared_at=now - timedelta(hours=1, minutes=15),
                in_transit_at=now - timedelta(minutes=30)
            ),
            Order(
                customer_id=3,
                restaurant_id=3,
                items=json.dumps([
                    {"id": "item-5", "name": "Салат 'Греческий'", "price": 1200, "quantity": 1, "subtotal": 1200},
                    {"id": "item-6", "name": "Смузи 'Зеленый'", "price": 900, "quantity": 1, "subtotal": 900}
                ]),
                total_amount=2100,
                status="preparing",
                customer_name="Светлана Кузнецова",
                restaurant_name="Кафе 'Здоровая еда'",
                delivery_address="ул. Сыганак 15, Астана",
                delivery_coordinates=json.dumps([71.453783, 51.178894]),
                created_at=now - timedelta(minutes=45),
                confirmed_at=now - timedelta(minutes=30)
            ),
            Order(
                customer_id=4,
                restaurant_id=4,
                items=json.dumps([
                    {"id": "item-7", "name": "Бургер 'Двойной чизбургер'", "price": 1800, "quantity": 2, "subtotal": 3600},
                    {"id": "item-8", "name": "Картофель фри", "price": 600, "quantity": 2, "subtotal": 1200},
                    {"id": "item-9", "name": "Молочный коктейль", "price": 800, "quantity": 2, "subtotal": 1600}
                ]),
                total_amount=6400,
                status="new",
                customer_name="Николай Иванов",
                restaurant_name="Бургерная 'Мясоед'",
                delivery_address="пр. Туран 37, Астана",
                delivery_coordinates=json.dumps([71.463783, 51.188894]),
                created_at=now - timedelta(minutes=15)
            ),
            Order(
                customer_id=5,
                restaurant_id=5,
                driver_id=2,
                items=json.dumps([
                    {"id": "item-10", "name": "Плов", "price": 1700, "quantity": 1, "subtotal": 1700},
                    {"id": "item-11", "name": "Самса", "price": 500, "quantity": 3, "subtotal": 1500},
                    {"id": "item-12", "name": "Чай", "price": 300, "quantity": 1, "subtotal": 300}
                ]),
                total_amount=3500,
                status="cancelled",
                customer_name="Ольга Смирнова",
                restaurant_name="Ресторан 'Восточный'",
                driver_name="Мария Иванова",
                delivery_address="ул. Достык 5, Астана",
                delivery_coordinates=json.dumps([71.473783, 51.198894]),
                created_at=now - timedelta(hours=5),
                confirmed_at=now - timedelta(hours=4, minutes=45),
                cancelled_at=now - timedelta(hours=4, minutes=30)
            )
        ]
        db.add_all(orders)
        
        # Создаем настройки системы
        settings = Settings(
            platform_name="FoodRush",
            contact_email="contact@foodrush.com",
            support_phone="+7 (777) 123-4567"
        )
        db.add(settings)
        
        # Коммитим все изменения
        db.commit()
        
        print("База данных успешно инициализирована!")
    except Exception as e:
        print(f"Ошибка при инициализации базы данных: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()