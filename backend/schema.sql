-- TrailTech Database Schema for PostgreSQL
-- Создание всех таблиц для интернет-магазина TrailTech

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    role VARCHAR(20) DEFAULT 'user',
    telegram_id BIGINT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2),
    image VARCHAR(500),
    images JSONB,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_new BOOLEAN DEFAULT FALSE,
    is_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для товаров
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_is_hit ON products(is_hit);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_method VARCHAR(50) DEFAULT 'pickup',
    delivery_address TEXT,
    payment_method VARCHAR(50) DEFAULT 'card',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для заказов
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Таблица элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Индексы для элементов заказа
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Таблица корзины
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Индексы для корзины
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);

-- Таблица избранного
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Индексы для избранного
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Индексы для отзывов
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ==================== ОТЧЕТЫ (VIEW) ====================

DROP VIEW IF EXISTS report_classroom_usage;
DROP VIEW IF EXISTS report_discipline_stats;
DROP VIEW IF EXISTS report_excellent_students;
DROP VIEW IF EXISTS report_group_performance;
DROP VIEW IF EXISTS report_student_performance;
DROP VIEW IF EXISTS report_teacher_load;

DROP VIEW IF EXISTS report_sales_by_category;
CREATE VIEW report_sales_by_category AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    COALESCE(SUM(oi.quantity), 0)::int AS total_units_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0)::decimal(12,2) AS total_revenue
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY c.id, c.name
ORDER BY total_revenue DESC, total_units_sold DESC;

DROP VIEW IF EXISTS report_orders_by_status;
CREATE VIEW report_orders_by_status AS
SELECT
    status,
    COUNT(*)::int AS orders_count,
    COALESCE(SUM(total_amount), 0)::decimal(12,2) AS total_amount
FROM orders
GROUP BY status
ORDER BY orders_count DESC, total_amount DESC;

DROP VIEW IF EXISTS report_top_customers;
CREATE VIEW report_top_customers AS
SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    COUNT(o.id)::int AS orders_count,
    COALESCE(SUM(o.total_amount), 0)::decimal(12,2) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC, orders_count DESC;

DROP VIEW IF EXISTS report_inventory_by_category;
CREATE VIEW report_inventory_by_category AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    COUNT(DISTINCT p.id)::int AS products_count,
    COALESCE(AVG(p.rating), 0)::decimal(4,2) AS avg_rating,
    COALESCE(SUM(p.stock), 0)::int AS total_stock
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY avg_rating DESC, products_count DESC;

DROP VIEW IF EXISTS report_top_products;
CREATE VIEW report_top_products AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    c.name AS category_name,
    COALESCE(SUM(oi.quantity), 0)::int AS sold_units,
    COALESCE(SUM(oi.quantity * oi.price), 0)::decimal(12,2) AS revenue,
    COALESCE(AVG(r.rating), 0)::decimal(4,2) AS avg_review_rating
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, p.name, c.name
ORDER BY revenue DESC, sold_units DESC;

DROP VIEW IF EXISTS report_daily_sales;
CREATE VIEW report_daily_sales AS
SELECT
    DATE_TRUNC('day', created_at)::date AS report_date,
    COUNT(*)::int AS orders_created,
    COALESCE(SUM(total_amount), 0)::decimal(12,2) AS orders_total
FROM orders
GROUP BY DATE_TRUNC('day', created_at)::date
ORDER BY report_date DESC;

-- ==================== НАЧАЛЬНЫЕ ДАННЫЕ ====================

-- Администратор (пароль: admin123)
INSERT INTO users (email, password, name, role)
VALUES ('admin@trailtech.ru', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Администратор', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Категории
INSERT INTO categories (name, description, image) VALUES
    ('Умные часы', 'Современные смарт-часы для активного образа жизни', '/img/smartwatch.jpg'),
    ('Power Bank', 'Портативные зарядные устройства большой емкости', '/img/powerbank.jpg'),
    ('Солнечные зарядки', 'Экологичные зарядные устройства на солнечных батареях', '/img/solar-charger.jpg'),
    ('Фонари', 'Надежные фонари для походов и экспедиций', '/img/headlamp.jpg'),
    ('Наборы выживания', 'Все необходимое для выживания в дикой природе', '/img/survival-kit.jpg'),
    ('GPS-трекеры', 'Устройства для отслеживания местоположения', '/img/gps-tracker.jpg')
ON CONFLICT (name) DO NOTHING;

-- Товары
INSERT INTO products (name, description, price, old_price, image, category_id, stock, rating, reviews_count, is_new, is_hit) VALUES
    -- Умные часы (category_id: 1)
    ('SmartWatch Pro X1', 'Флагманские умные часы с расширенным функционалом для спорта и путешествий. Встроенный GPS, мониторинг здоровья, водонепроницаемость до 50м.', 15990, 19990, '/img/SmartWatch Pro X1.webp', 1, 25, 4.8, 42, TRUE, TRUE),
    ('SmartWatch Sport Elite', 'Спортивные умные часы с мониторингом пульса, сна и активности. Водонепроницаемость IP68, автономность до 14 дней.', 12990, 16990, '/img/SmartWatch Sport Elite.jpg', 1, 30, 4.6, 35, TRUE, FALSE),
    ('SmartWatch Classic', 'Классический дизайн умных часов с AMOLED дисплеем. Уведомления, музыка, оплата NFC. Идеальны для города.', 18990, NULL, '/img/SmartWatch Classic.webp', 1, 20, 4.7, 28, FALSE, TRUE),
    
    -- Power Bank (category_id: 2)
    ('PowerBank Ultra 30000', 'Мощный пауэрбанк на 30000 мАч с быстрой зарядкой PD 65W. Заряжает ноутбуки, планшеты и смартфоны. Идеален для путешествий.', 7990, 9990, '/img/PowerBank Ultra 30000.jpg', 2, 40, 4.7, 38, FALSE, TRUE),
    ('PowerBank Slim 10000', 'Тонкий и легкий пауэрбанк на 10000 мАч. Быстрая зарядка QC 3.0. Помещается в карман.', 3490, 4490, '/img/PowerBank Slim 10000.webp', 2, 50, 4.5, 52, FALSE, FALSE),
    ('PowerBank Magnetic 5000', 'Магнитный пауэрбанк для смартфонов с MagSafe. Компактный, с подставкой. Зарядка без проводов.', 4990, NULL, '/img/PowerBank Magnetic 5000.jpg', 2, 35, 4.4, 21, TRUE, FALSE),
    
    -- Солнечные зарядки (category_id: 3)
    ('Solar Charger 25W', 'Солнечная панель мощностью 25W с USB-C и USB-A портами. Складная конструкция, водонепроницаемая. Заряжает устройства даже в пасмурную погоду.', 5490, NULL, '/img/Solar Charger 25W.jpg', 3, 15, 4.5, 24, TRUE, FALSE),
    ('Solar Panel 60W', 'Мощная солнечная панель 60W для зарядки ноутбуков и портативных станций. Высокий КПД, прочная конструкция.', 12990, 15990, '/img/Solar Panel 60W.jpg', 3, 10, 4.8, 15, FALSE, TRUE),
    ('Solar Power Bank 20000', 'Пауэрбанк с солнечной панелью на 20000 мАч. Беспроводная зарядка, фонарик, компас. Для кемпинга и походов.', 4290, NULL, '/img/Solar Power Bank 20000.jpg', 3, 25, 4.3, 33, FALSE, FALSE),
    
    -- Фонари (category_id: 4)
    ('Headlamp Tactical 5000', 'Тактический фонарь налобный с яркостью 5000 люмен. 5 режимов работы, водонепроницаемый, работает до 20 часов.', 3290, 4490, '/img/Headlamp Tactical 5000.jpeg', 4, 50, 4.9, 67, FALSE, FALSE),
    ('Headlamp LED Pro', 'Светодиодный налобный фонарь с зумом. Яркость 1200 люмен, 3 режима. Легкий и удобный.', 1990, 2990, '/img/Headlamp LED Pro.webp', 4, 60, 4.6, 45, FALSE, FALSE),
    ('Flashlight Xenon 3000', 'Ручной ксеноновый фонарь с яркостью 3000 люмен. Дальность луча до 500м. Ударопрочный корпус.', 2790, NULL, '/img/Flashlight Xenon 3000.jpg', 4, 40, 4.7, 38, TRUE, FALSE),
    
    -- Наборы выживания (category_id: 5)
    ('Survival Kit Pro', 'Профессиональный набор выживания: мультитул, огниво, компас, свисток, нож, паракорд, термоодеяло и многое другое в компактном кейсе.', 8990, NULL, '/img/Survival Kit Pro.jpg', 5, 20, 4.6, 31, TRUE, FALSE),
    ('Survival Kit Basic', 'Базовый набор выживания: нож, мультитул, огниво, бинт, жгут. Компактная сумка.', 4990, 6490, '/img/Survival Kit Basic.webp', 5, 30, 4.4, 22, FALSE, FALSE),
    ('Survival Kit Ultimate', 'Максимальный набор для выживания: топор, пила, нож, мультитул, огниво, набор для розжига, посуда. Рюкзак в комплекте.', 14990, NULL, '/img/Survival Kit Ultimate.webp', 5, 15, 4.8, 19, FALSE, TRUE),
    
    -- GPS-трекеры (category_id: 6)
    ('GPS Tracker Mini', 'Компактный GPS-трекер с точностью до 2 метров. Работает до 30 дней без подзарядки. Водонепроницаемый корпус.', 4990, 6490, '/img/GPS Tracker Mini.jpeg', 6, 35, 4.4, 19, FALSE, FALSE),
    ('GPS Navigator Pro', 'Профессиональный GPS-навигатор с картой России. Диагональ 5 дюймов, поддержка ГЛОНАСС.', 11990, 14990, '/img/GPS Navigator Pro.webp', 6, 20, 4.7, 26, FALSE, TRUE),
    ('GPS Watch Outdoor', 'GPS-часы для туризма и спорта. Маршруты, треки, барометр, альтиметр. Защита MIL-STD.', 24990, NULL, '/img/GPS Watch Outdoor.jpeg', 6, 12, 4.9, 17, TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

-- Тестовые пользователи для отчетов
INSERT INTO users (email, password, name, role)
VALUES
    ('anna@trailtech.ru', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Анна Смирнова', 'user'),
    ('max@trailtech.ru', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Максим Ковалев', 'user'),
    ('olga@trailtech.ru', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Ольга Петрова', 'user'),
    ('ivan@trailtech.ru', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Иван Орлов', 'user')
ON CONFLICT (email) DO NOTHING;

-- Тестовые заказы и позиции для отчетов (минимум 4 записи)
INSERT INTO orders (user_id, status, total_amount, delivery_method, payment_method, phone, email, name, created_at)
SELECT u.id, 'pending', 28980, 'delivery', 'card', '+79990000001', u.email, u.name, NOW() - INTERVAL '4 days'
FROM users u WHERE u.email = 'anna@trailtech.ru'
AND NOT EXISTS (SELECT 1 FROM orders);

INSERT INTO orders (user_id, status, total_amount, delivery_method, payment_method, phone, email, name, created_at)
SELECT u.id, 'confirmed', 15980, 'pickup', 'card', '+79990000002', u.email, u.name, NOW() - INTERVAL '3 days'
FROM users u WHERE u.email = 'max@trailtech.ru'
AND EXISTS (SELECT 1 FROM orders)
AND (SELECT COUNT(*) FROM orders) = 1;

INSERT INTO orders (user_id, status, total_amount, delivery_method, payment_method, phone, email, name, created_at)
SELECT u.id, 'shipped', 17880, 'delivery', 'cash', '+79990000003', u.email, u.name, NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'olga@trailtech.ru'
AND (SELECT COUNT(*) FROM orders) = 2;

INSERT INTO orders (user_id, status, total_amount, delivery_method, payment_method, phone, email, name, created_at)
SELECT u.id, 'delivered', 12490, 'pickup', 'card', '+79990000004', u.email, u.name, NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'ivan@trailtech.ru'
AND (SELECT COUNT(*) FROM orders) = 3;

INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 1, 1, 15990 FROM orders o
WHERE o.email = 'anna@trailtech.ru' AND NOT EXISTS (SELECT 1 FROM order_items);
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 4, 1, 7990 FROM orders o
WHERE o.email = 'anna@trailtech.ru' AND (SELECT COUNT(*) FROM order_items) = 1;
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 2, 1, 12990 FROM orders o
WHERE o.email = 'max@trailtech.ru' AND (SELECT COUNT(*) FROM order_items) = 2;
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 5, 1, 3490 FROM orders o
WHERE o.email = 'max@trailtech.ru' AND (SELECT COUNT(*) FROM order_items) = 3;
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 10, 2, 1990 FROM orders o
WHERE o.email = 'olga@trailtech.ru' AND (SELECT COUNT(*) FROM order_items) = 4;
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 13, 1, 8990 FROM orders o
WHERE o.email = 'olga@trailtech.ru' AND (SELECT COUNT(*) FROM order_items) = 5;
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 17, 1, 11990 FROM orders o
WHERE o.email = 'ivan@trailtech.ru' AND (SELECT COUNT(*) FROM order_items) = 6;
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, 11, 1, 2790 FROM orders o
WHERE o.email = 'ivan@trailtech.ru' AND (SELECT COUNT(*) FROM order_items) = 7;

-- Тестовые отзывы для report_top_products
INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
SELECT 1, u.id, 5, 'Отличные часы', NOW() - INTERVAL '4 days' FROM users u
WHERE u.email = 'anna@trailtech.ru'
AND NOT EXISTS (SELECT 1 FROM reviews);
INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
SELECT 4, u.id, 4, 'Мощный powerbank', NOW() - INTERVAL '3 days' FROM users u
WHERE u.email = 'max@trailtech.ru'
AND (SELECT COUNT(*) FROM reviews) = 1;
INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
SELECT 10, u.id, 5, 'Фонарь супер', NOW() - INTERVAL '2 days' FROM users u
WHERE u.email = 'olga@trailtech.ru'
AND (SELECT COUNT(*) FROM reviews) = 2;
INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
SELECT 17, u.id, 4, 'Навигатор точный', NOW() - INTERVAL '1 day' FROM users u
WHERE u.email = 'ivan@trailtech.ru'
AND (SELECT COUNT(*) FROM reviews) = 3;

-- Вывод информации о созданных таблицах
SELECT 'Tables created successfully!' as status;
