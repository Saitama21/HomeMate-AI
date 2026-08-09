# HomeMate AI v0.1.0 Foundation

Первый самостоятельный репозиторий HomeMate AI.

## Уже реализовано
- Liquid Glass UI, light/dark, изменяемый accent color
- адаптация smartphone / tablet / desktop
- 3 языка: українська / русский / English
- каталог растений, симптомов/проблем, ингредиентов и рецептов
- текстовая диагностика растений + загрузка фото
- поиск рецептов
- AI Chef MVP: подбор блюда по выбранным продуктам
- холодильник с количеством и сроком
- SQLite foundation
- FastAPI API + `/api/health`
- Railway-ready Procfile

## Локальный запуск
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Railway
Подключить GitHub-репозиторий. Start command берётся из Procfile.

## Важно
Фото-диагностика в v0.1.0 принимает изображение и сохраняет поток UX, но полноценное CV/LLM vision-распознавание будет подключаться отдельным AI-провайдером/API в следующем этапе. Текущая диагностика использует локальную symptom knowledge base.
