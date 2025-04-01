import uvicorn
import os
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

if __name__ == "__main__":
    # Получаем настройки из переменных окружения
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("DEBUG", "True").lower() == "true"

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=debug
    )