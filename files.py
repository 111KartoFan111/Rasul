import os

def create_files_and_folders(base_path, structure):
    for path in structure:
        full_path = os.path.join(base_path, path)
        if path.endswith("/"):
            os.makedirs(full_path, exist_ok=True)
        else:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w") as f:
                f.write("# " + path)

project_structure = [
    "app/__init__.py",
    "app/main.py",
    "app/database.py",
    "app/auth.py",
    "app/api/__init__.py",
    "app/api/routes/__init__.py",
    "app/api/routes/auth.py",
    "app/api/routes/orders.py",
    "app/api/routes/drivers.py",
    "app/api/routes/restaurants.py",
    "app/api/routes/customers.py",
    "app/api/routes/analytics.py",
    "app/api/routes/settings.py",
    "app/api/models/__init__.py",
    "app/api/models/user.py",
    "app/api/models/order.py",
    "app/api/models/driver.py",
    "app/api/models/restaurant.py",
    "app/api/models/customer.py",
    "app/api/models/settings.py",
    "app/api/schemas/__init__.py",
    "app/api/schemas/auth.py",
    "app/api/schemas/order.py",
    "app/api/schemas/driver.py",
    "app/api/schemas/restaurant.py",
    "app/api/schemas/customer.py",
    "app/api/schemas/analytics.py",
    "app/api/schemas/settings.py",
]

create_files_and_folders(".", project_structure)
print("Проектная структура создана.")