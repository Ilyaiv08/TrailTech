# TrailTech — Интернет-магазин техники для активного образа жизни

## 📋 Описание

Полнофункциональный интернет-магазин TrailTech с:
- 🔹 REST API на Node.js + Express
- 🔹 PostgreSQL база данных
- 🔹 React фронтенд
- 🔹 Telegram-бот TrailTech_Bot
- 🔹 JWT аутентификация

## 🚀 Функционал

### Для пользователей:
- ✅ Регистрация и авторизация (JWT)
- ✅ Просмотр каталога товаров
- ✅ Поиск и фильтрация товаров
- ✅ Корзина покупок
- ✅ Оформление заказа
- ✅ Личный кабинет
- ✅ История заказов
- ✅ Избранное
- ✅ Отзывы о товарах
- ✅ Telegram-бот

- Сайт: https://th.aleskysha.online
- Бот:  https://t.me/TrailTech_Bot
- Сайт и бот находятся на сервере так что их запускать не надо

## 🛠️ Технологии

**Backend:**
- Node.js + Express
- PostgreSQL (pg)
- JWT аутентификация
- REST API
- Multer (загрузка файлов)

**Frontend:**
- React 18
- React Router v6
- Bootstrap 5
- Axios

**Telegram-бот:**
- Telegraf
- PostgreSQL

## 📦 Установка и запуск

### 1. Требования

- Node.js 16+
- PostgreSQL 12+
- pgAdmin (опционально)

### 2. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Настройка PostgreSQL

Создайте базу данных:

```sql
CREATE DATABASE trailtech;
```

Или через pgAdmin:
1. Откройте pgAdmin
2. Создайте базу данных `trailtech`

### 4. Настройка переменных окружения

Создайте файл `backend/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:ваш_пароль@localhost:5432/trailtech"
JWT_SECRET=ваш_secret_ключ
NODE_ENV=development
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
```

### 5. Инициализация базы данных

```bash
cd backend
npm run init-db:postgres
```

Будет создано:
- 7 таблиц PostgreSQL
- 6 категорий товаров
- 18 товаров
- Администратор: `admin@trailtech.ru` / `admin123`

### 6. Запуск приложения

```bash
# Терминал 1 - Backend (API)
cd backend
npm run dev

# Терминал 2 - Telegram-бот (опционально)
cd backend
npm run bot:dev

# Терминал 3 - Frontend
cd frontend
npm run dev
```

## 📁 Структура проекта

```
TrailTech/
├── backend/
│   ├── server.js              # REST API сервер
│   ├── bot.js                 # Telegram-бот
│   ├── schema.sql             # SQL-схема PostgreSQL
│   ├── init-db-postgres.js    # Инициализация БД
│   ├── .env                   # Переменные окружения
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   ├── pages/             # Страницы
│   │   ├── context/           # React Context
│   │   ├── api.js             # API клиент
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── asets/
│   └── img/                   # Изображения товаров
│
└── README.md
```

## 📡 API Endpoints

### Аутентификация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |
| PUT | `/api/auth/profile` | Обновление профиля |

### Товары
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/products` | Список товаров |
| GET | `/api/products/:id` | Детали товара |
| POST | `/api/admin/products` | Добавить товар (admin) |
| PUT | `/api/admin/products/:id` | Обновить товар (admin) |
| DELETE | `/api/admin/products/:id` | Удалить товар (admin) |

### Категории
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/categories` | Список категорий |

### Корзина
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/cart` | Получить корзину |
| POST | `/api/cart` | Добавить в корзину |
| PUT | `/api/cart/:id` | Обновить количество |
| DELETE | `/api/cart/:id` | Удалить из корзины |
| DELETE | `/api/cart` | Очистить корзину |

### Заказы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/orders` | Создать заказ |
| GET | `/api/orders` | Мои заказы |
| GET | `/api/orders/:id` | Детали заказа |

### Избранное
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/favorites` | Список избранного |
| POST | `/api/favorites` | Добавить в избранное |
| DELETE | `/api/favorites/:product_id` | Удалить |

### Отзывы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/reviews` | Добавить отзыв |
| GET | `/api/reviews/:product_id` | Отзывы товара |

### Админка
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/admin/orders` | Все заказы |
| PUT | `/api/admin/orders/:id/status` | Статус заказа |
| GET | `/api/admin/stats` | Статистика |


## 🤖 Telegram-бот

**Username:** [@TrailTech_Bot](https://t.me/TrailTech_Bot)

### Команды бота:
- `/start` — Главное меню
- `/help` — Справка
- `/admin` — Админ-панель

### Функции бота:
- 🛍️ Просмотр каталога
- 🔥 Акции и скидки
- 🛒 Корзина и заказы
- ❤️ Избранное
- 👤 Профиль
- 📞 Контакты

### Запуск бота:
```bash
cd backend
npm run bot:dev
```

## 🗄️ База данных (PostgreSQL)

### Таблицы:
1. **users** — пользователи (id, email, password, name, phone, address, role, telegram_id)
2. **categories** — категории (id, name, description, image)
3. **products** — товары (id, name, description, price, old_price, image, category_id, stock, rating, is_new, is_hit)
4. **orders** — заказы (id, user_id, status, total_amount, delivery_method, delivery_address, payment_method)
5. **order_items** — элементы заказов (id, order_id, product_id, quantity, price)
6. **cart** — корзина (id, user_id, product_id, quantity)
7. **favorites** — избранное (id, user_id, product_id)
8. **reviews** — отзывы (id, product_id, user_id, rating, comment)

### Скрипты:
```bash
# Инициализация PostgreSQL
npm run init-db:postgres
```

## 📝 Команды npm

### Backend:
```bash
npm run start          # Запуск сервера
npm run dev            # Запуск с nodemon
npm run bot            # Запуск бота
npm run bot:dev        # Запуск бота с nodemon
npm run init-db:postgres  # Инициализация БД
```

### Frontend:
```bash
npm run dev            # Запуск dev-сервера
npm run build          # Сборка для продакшена
npm run preview        # Предпросмотр сборки
```

## 🔐 Безопасность

- Пароли хешируются с помощью bcryptjs
- API защищено JWT токенами
- Ролевая модель (user, admin)
- Валидация данных на клиенте и сервере

## 📊 Синхронизация

Все данные синхронизированы между:
- 🌐 Веб-сайтом
- 🤖 Telegram-ботом
- 📱 Мобильными устройствами

Одна база данных PostgreSQL обеспечивает консистентность данных.

## 🐛 Решение проблем

### Ошибка подключения к PostgreSQL
```bash
# Проверьте, что PostgreSQL запущен
# Проверьте DATABASE_URL в .env
# Убедитесь, что база данных trailtech создана
```

### Бот не отвечает
```bash
# Проверьте TELEGRAM_BOT_TOKEN в .env
# Убедитесь, что сервер запущен
# Проверьте логи ошибок
```

### Ошибки компиляции
```bash
# Очистите кеш
npm cache clean --force

# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

## 📞 Контакты

- **Email:** info@trailtech.ru
- **Телефон:** +7 (999) 123-45-67
- **Адрес:** Москва, ул. Примерная, 10, офис 5
- **Telegram:** [@TrailTech_Bot](https://t.me/TrailTech_Bot)

## 📄 Лицензия

© 2024 TrailTech. Все права защищены.

---

**Для учебной практики**

Этот проект демонстрирует:
- Работу с PostgreSQL
- REST API архитектуру
- React с хуками и контекстом
- Telegram-боты на Telegraf
- Аутентификацию и авторизацию
- Синхронизацию данных между платформами
