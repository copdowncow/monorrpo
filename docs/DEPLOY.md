# Деплой Taj Paintball (монорепо)

Один сервис — один деплой. Express запускает и API, и Next.js фронтенд.

## 1. Supabase
1. supabase.com → New project
2. SQL Editor → выполнить `supabase/migrations/001_init.sql`
3. SQL Editor → выполнить `supabase/seed/seed.sql`
4. Скопировать: Project URL, anon key, service_role key

## 2. Telegram Bot
1. @BotFather → /newbot → получить токен
2. @userinfobot → получить свой chat_id

## 3. Railway (один сервис)
1. railway.app → New Project → Deploy from GitHub / upload ZIP
2. Settings → добавить переменные из .env.example:
   - PORT (Railway подставит автоматически)
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_ADMIN_CHAT_ID
   - JWT_SECRET
   - ADMIN_LOGIN
   - ADMIN_PASSWORD
   - NODE_ENV=production
3. Deploy → Railway сам запустит `npm run build && npm run start`

## 4. Создать администратора (один раз)
В Railway → New Service → выполнить команду:
  npm run create-admin

Или временно поменять startCommand на `npm run create-admin`, задеплоить, потом вернуть.

## 5. Готово
Сайт: https://ваш-проект.railway.app
Админка: https://ваш-проект.railway.app/admin
API: https://ваш-проект.railway.app/api/...

## Локальный запуск
cp .env.example .env
# заполнить .env
npm install
npm run dev
# Открыть http://localhost:4000
