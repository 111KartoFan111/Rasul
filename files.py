import jwt
import datetime

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

def generate_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

# Пример использования
print(generate_token(1))
