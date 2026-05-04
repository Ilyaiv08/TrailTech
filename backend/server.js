import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'trailtech-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/img', express.static(join(__dirname, '../asets/img')));

// Создание папки для загрузок
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Проверка подключения
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
  } else {
    console.log('✅ Подключение к PostgreSQL установлено');
    release();
  }
});

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный токен' });
    }
    req.user = user;
    next();
  });
};

// Middleware для проверки администратора
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await pool.query(`
      INSERT INTO users (email, password, name, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role
    `, [email, hashedPassword, name, phone || null]);

    const user = result.rows[0];
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Регистрация успешна',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Вход выполнен',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение текущего пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, address, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    await pool.query(`
      UPDATE users SET name = $1, phone = $2, address = $3
      WHERE id = $4
    `, [name, phone, address, req.user.id]);

    res.json({ message: 'Профиль обновлен' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== CATEGORIES ROUTES ====================

// Получить все категории
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id)::int as products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== PRODUCTS ROUTES ====================

// Получить все товары с фильтрацией
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort, new: isNew, hit } = req.query;

    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isNew === 'true') {
      query += ' AND p.is_new = TRUE';
    }

    if (hit === 'true') {
      query += ' AND p.is_hit = TRUE';
    }

    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY p.price DESC';
        break;
      case 'rating':
        query += ' ORDER BY p.rating DESC';
        break;
      case 'newest':
        query += ' ORDER BY p.created_at DESC';
        break;
      default:
        query += ' ORDER BY p.created_at DESC';
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить один товар
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== CART ROUTES ====================

// Получить корзину
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name, p.price, p.image, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    const items = result.rows;
    const total = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    res.json({ items, total });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить в корзину
app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Не указан товар' });
    }

    const productResult = await pool.query('SELECT id, stock FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    const product = productResult.rows[0];

    const existingItem = await pool.query('SELECT * FROM cart WHERE user_id = $1 AND product_id = $2', [req.user.id, product_id]);

    if (existingItem.rows.length > 0) {
      const newQuantity = existingItem.rows[0].quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: 'Недостаточно товара на складе' });
      }

      await pool.query('UPDATE cart SET quantity = $1 WHERE id = $2', [newQuantity, existingItem.rows[0].id]);
    } else {
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.id, product_id, Math.min(quantity, product.stock)]
      );
    }

    res.json({ message: 'Товар добавлен в корзину' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить количество в корзине
app.put('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    const cartItemResult = await pool.query(
      'SELECT * FROM cart WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Элемент не найден' });
    }

    if (quantity <= 0) {
      await pool.query('DELETE FROM cart WHERE id = $1', [req.params.id]);
    } else {
      const productResult = await pool.query('SELECT stock FROM products WHERE id = $1', [cartItemResult.rows[0].product_id]);
      if (quantity > productResult.rows[0].stock) {
        return res.status(400).json({ error: 'Недостаточно товара на складе' });
      }
      await pool.query('UPDATE cart SET quantity = $1 WHERE id = $2', [quantity, req.params.id]);
    }

    res.json({ message: 'Корзина обновлена' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить из корзины
app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Элемент не найден' });
    }

    res.json({ message: 'Товар удален из корзины' });
  } catch (error) {
    console.error('Delete from cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Очистить корзину
app.delete('/api/cart', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Корзина очищена' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== FAVORITES ROUTES ====================

// Получить избранное
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, p.name, p.price, p.image, p.rating, c.name as category_name
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить в избранное
app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Не указан товар' });
    }

    try {
      await pool.query(
        'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)',
        [req.user.id, product_id]
      );
    } catch (e) {
      // Уже в избранном
    }

    res.json({ message: 'Добавлено в избранное' });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить из избранного
app.delete('/api/favorites/:product_id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.product_id]
    );

    res.json({ message: 'Удалено из избранного' });
  } catch (error) {
    console.error('Delete from favorites error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== ORDERS ROUTES ====================

// Создать заказ
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { delivery_method, delivery_address, payment_method, phone, email, name, comment } = req.body;

    const cartResult = await pool.query(`
      SELECT c.*, p.price, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [req.user.id]);

    const cart = cartResult.rows;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    const orderResult = await pool.query(`
      INSERT INTO orders (user_id, total_amount, delivery_method, delivery_address, payment_method, phone, email, name, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      req.user.id,
      totalAmount,
      delivery_method || 'pickup',
      delivery_address || null,
      payment_method || 'card',
      phone || user.phone,
      email || user.email,
      name || user.name,
      comment || null
    ]);

    const orderId = orderResult.rows[0].id;

    // Добавляем элементы заказа
    for (const item of cart) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await pool.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    // Очищаем корзину
    await pool.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);

    res.json({
      message: 'Заказ оформлен',
      order_id: orderId,
      total: totalAmount
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить заказы пользователя
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const ordersResult = await pool.query(`
      SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC
    `, [req.user.id]);

    const orders = ordersResult.rows;

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const itemsResult = await pool.query(`
        SELECT oi.*, p.name, p.image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [order.id]);

      return { ...order, items: itemsResult.rows };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить один заказ
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(`
      SELECT oi.*, p.name, p.image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [order.id]);

    res.json({ ...order, items: itemsResult.rows });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== REVIEWS ROUTES ====================

// Добавить отзыв
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: 'Необходимо указать товар и оценку' });
    }

    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [product_id, req.user.id]
    );
    
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'Вы уже оставляли отзыв на этот товар' });
    }

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [product_id, req.user.id, rating, comment || null]
    );

    // Обновляем рейтинг товара
    const statsResult = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = $1',
      [product_id]
    );
    const stats = statsResult.rows[0];
    
    await pool.query(
      'UPDATE products SET rating = $1, reviews_count = $2 WHERE id = $3',
      [parseFloat(stats.avg_rating), parseInt(stats.count), product_id]
    );

    res.json({ message: 'Отзыв добавлен' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить отзывы товара
app.get('/api/reviews/:product_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.product_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== ADMIN ROUTES ====================

// Получить все товары (админ)
app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все заказы (админ)
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ordersResult = await pool.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    const orders = ordersResult.rows;

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const itemsResult = await pool.query(`
        SELECT oi.*, p.name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [order.id]);

      return { ...order, items: itemsResult.rows };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить статус заказа (админ)
app.put('/api/admin/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);

    res.json({ message: 'Статус обновлен' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить товар (админ)
app.post('/api/admin/products', authenticateToken, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, old_price, category_id, stock, is_new, is_hit } = req.body;

    const image = req.files && req.files[0] ? `/uploads/${req.files[0].filename}` : null;
    const images = req.files && req.files.length > 1
      ? JSON.stringify(req.files.map(f => `/uploads/${f.filename}`))
      : null;

    const result = await pool.query(`
      INSERT INTO products (name, description, price, old_price, image, images, category_id, stock, is_new, is_hit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      name,
      description,
      parseFloat(price),
      old_price ? parseFloat(old_price) : null,
      image,
      images,
      parseInt(category_id) || null,
      parseInt(stock) || 0,
      is_new === 'true',
      is_hit === 'true'
    ]);

    res.json({
      message: 'Товар добавлен',
      product_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить товар (админ)
app.put('/api/admin/products/:id', authenticateToken, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, old_price, category_id, stock, is_new, is_hit } = req.body;

    let image = null;
    let images = null;

    if (req.files && req.files.length > 0) {
      image = `/uploads/${req.files[0].filename}`;
      if (req.files.length > 1) {
        images = JSON.stringify(req.files.map(f => `/uploads/${f.filename}`));
      }
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name) { updates.push(`name = $${paramIndex}`); params.push(name); paramIndex++; }
    if (description !== undefined) { updates.push(`description = $${paramIndex}`); params.push(description); paramIndex++; }
    if (price) { updates.push(`price = $${paramIndex}`); params.push(parseFloat(price)); paramIndex++; }
    if (old_price !== undefined) { updates.push(`old_price = $${paramIndex}`); params.push(old_price ? parseFloat(old_price) : null); paramIndex++; }
    if (category_id) { updates.push(`category_id = $${paramIndex}`); params.push(parseInt(category_id)); paramIndex++; }
    if (stock !== undefined) { updates.push(`stock = $${paramIndex}`); params.push(parseInt(stock)); paramIndex++; }
    if (is_new !== undefined) { updates.push(`is_new = $${paramIndex}`); params.push(is_new === 'true'); paramIndex++; }
    if (is_hit !== undefined) { updates.push(`is_hit = $${paramIndex}`); params.push(is_hit === 'true'); paramIndex++; }
    if (image) { updates.push(`image = $${paramIndex}`); params.push(image); paramIndex++; }
    if (images) { updates.push(`images = $${paramIndex}`); params.push(images); paramIndex++; }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    params.push(req.params.id);

    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);

    res.json({ message: 'Товар обновлен' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить товар (админ)
app.delete('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Товар удален' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все категории (админ)
app.get('/api/admin/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id)::int AS products_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить категорию (админ)
app.post('/api/admin/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const result = await pool.query(`
      INSERT INTO categories (name, description, image)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name.trim(), description || null, image || null]);

    res.json({ message: 'Категория добавлена', category: result.rows[0] });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить категорию (админ)
app.put('/api/admin/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const result = await pool.query(`
      UPDATE categories
      SET name = $1, description = $2, image = $3
      WHERE id = $4
      RETURNING *
    `, [name.trim(), description || null, image || null, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json({ message: 'Категория обновлена', category: result.rows[0] });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить категорию (админ)
app.delete('/api/admin/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const inUse = await pool.query(
      'SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1',
      [req.params.id]
    );

    if (inUse.rows[0].count > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить категорию: в ней есть товары'
      });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить всех пользователей (админ)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, name, phone, address, role, telegram_id, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить пользователя (админ)
app.post('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email, password, name, phone, address, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, пароль и имя обязательны' });
    }

    const safeRole = role === 'admin' ? 'admin' : 'user';
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(`
      INSERT INTO users (email, password, name, phone, address, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, phone, address, role, telegram_id, created_at
    `, [
      email.trim(),
      hashedPassword,
      name.trim(),
      phone || null,
      address || null,
      safeRole
    ]);

    res.json({ message: 'Пользователь создан', user: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить пользователя (админ)
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email, password, name, phone, address, role } = req.body;
    const userId = parseInt(req.params.id);

    const existingUser = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (email) {
      const duplicate = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.trim(), userId]);
      if (duplicate.rows.length > 0) {
        return res.status(400).json({ error: 'Email уже используется другим пользователем' });
      }
    }

    if (role === 'user' && req.user.id === userId) {
      return res.status(400).json({ error: 'Нельзя снять роль admin у своего аккаунта' });
    }

    const updates = [];
    const params = [];
    let i = 1;

    if (email !== undefined) { updates.push(`email = $${i++}`); params.push(email.trim()); }
    if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name.trim()); }
    if (phone !== undefined) { updates.push(`phone = $${i++}`); params.push(phone || null); }
    if (address !== undefined) { updates.push(`address = $${i++}`); params.push(address || null); }
    if (role !== undefined) { updates.push(`role = $${i++}`); params.push(role === 'admin' ? 'admin' : 'user'); }
    if (password) { updates.push(`password = $${i++}`); params.push(bcrypt.hashSync(password, 10)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    params.push(userId);
    const result = await pool.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${i}
      RETURNING id, email, name, phone, address, role, telegram_id, created_at
    `, params);

    res.json({ message: 'Пользователь обновлен', user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить пользователя (админ)
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Нельзя удалить свой аккаунт' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить роль пользователя (админ)
app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role',
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Роль пользователя обновлена', user: result.rows[0] });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статистика (админ)
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalProductsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const totalOrdersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    const totalRevenueResult = await pool.query("SELECT SUM(total_amount) as sum FROM orders WHERE status != 'cancelled'");

    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    const totalProducts = parseInt(totalProductsResult.rows[0].count);
    const totalOrders = parseInt(totalOrdersResult.rows[0].count);
    const totalRevenue = parseFloat(totalRevenueResult.rows[0].sum) || 0;

    const recentOrdersResult = await pool.query(`
      SELECT o.*, u.name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders: recentOrdersResult.rows
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отчеты (админ)
app.get('/api/admin/reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [
      salesByCategory,
      ordersByStatus,
      topCustomers,
      inventoryByCategory,
      topProducts,
      dailySales
    ] = await Promise.all([
      pool.query('SELECT * FROM report_sales_by_category LIMIT 100'),
      pool.query('SELECT * FROM report_orders_by_status LIMIT 100'),
      pool.query('SELECT * FROM report_top_customers LIMIT 100'),
      pool.query('SELECT * FROM report_inventory_by_category LIMIT 100'),
      pool.query('SELECT * FROM report_top_products LIMIT 100'),
      pool.query('SELECT * FROM report_daily_sales LIMIT 100')
    ]);

    res.json({
      report_sales_by_category: salesByCategory.rows,
      report_orders_by_status: ordersByStatus.rows,
      report_top_customers: topCustomers.rows,
      report_inventory_by_category: inventoryByCategory.rows,
      report_top_products: topProducts.rows,
      report_daily_sales: dailySales.rows
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Ошибка загрузки отчетов' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Картинки: http://localhost:${PORT}/img/`);
  console.log(`===========================================`);
});
