# Taj Paintball

Полная система онлайн-бронирования пейнтбольного клуба.

## Стек
- **Сервер**: Node.js + Express + TypeScript
- **Фронтенд**: Next.js 14 (обслуживается Express как custom server)
- **База данных**: Supabase (PostgreSQL)
- **Уведомления**: Telegram Bot
- **Деплой**: Railway (один сервис)

## Структура
```
/src          — бэкенд (Express API + Telegram Bot)
/frontend     — фронтенд (Next.js)
/supabase     — миграции и seed данные
```

## Запуск
```bash
cp .env.example .env   # заполнить переменные
npm install
npm run dev            # localhost:4000
```

## Деплой
См. docs/DEPLOY.md
