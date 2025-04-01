from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ...database import get_db, Settings
from ...auth import get_current_user, User
from ..schemas.settings import SettingsUpdate, SettingsResponse

router = APIRouter()

@router.get("/", response_model=SettingsResponse)
async def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить настройки системы
    """
    settings = db.query(Settings).first()
    if not settings:
        # Если настройки еще не созданы, создаем их с дефолтными значениями
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings

@router.post("/", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить настройки системы
    """
    # Проверяем права доступа (только администратор может обновлять настройки)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    settings = db.query(Settings).first()
    if not settings:
        # Если настройки еще не созданы, создаем их
        settings = Settings()
        db.add(settings)
    
    # Обновляем поля, если они предоставлены
    update_data = settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings