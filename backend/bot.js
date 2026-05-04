import { Telegraf, Markup } from 'telegraf';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = `http://localhost:${process.env.PORT || 5000}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'trailtech-secret-key-2024';
const PROXY_URL = process.env.TELEGRAM_PROXY;
const SITE_URL = 'https://th.aleskysha.online/';

// Проверка токена
if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле!');
  process.exit(1);
}

// Инициализация бота с прокси (если указан)
let botOptions = {};

if (PROXY_URL) {
  try {
    let proxyAgent;
    
    if (PROXY_URL.startsWith('socks')) {
      proxyAgent = new SocksProxyAgent(PROXY_URL);
      console.log('🔑 SOCKS прокси:', PROXY_URL);
    } else {
      proxyAgent = new HttpsProxyAgent(PROXY_URL);
      console.log('🔑 HTTP прокси:', PROXY_URL);
    }
    
    botOptions = {
      telegram: {
        agent: proxyAgent
      }
    };
  } catch (e) {
    console.log('⚠️ Ошибка прокси:', e.message);
  }
} else {
  console.log('⚠️ Прокси не указан. Если Telegram заблокирован, добавьте TELEGRAM_PROXY в .env');
}

const bot = new Telegraf(BOT_TOKEN, botOptions);

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Проверка подключения
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
  } else {
    console.log('✅ Бот: Подключение к PostgreSQL установлено');
    release();
  }
});

// ==================== КЛАВИАТУРЫ ====================

// Главное меню
const mainKeyboard = Markup.keyboard([
  ['🛍️ Каталог', '🔥 Акции'],
  ['🛒 Корзина', '📦 Заказы'],
  ['👤 Профиль', '❤️ Избранное'],
  ['📞 Контакты', '❓ Помощь'],
  ['🌐 Открыть сайт']
]).resize();

// Клавиатура с сайтом (inline)
const siteKeyboard = Markup.inlineKeyboard([
  [Markup.button.url('🌐 Открыть сайт', SITE_URL)]
]);

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Получение токена пользователя для API
async function getUserToken(userId) {
  try {
    let userResult = await pool.query('SELECT telegram_id, email, id FROM users WHERE telegram_id = $1', [userId]);
    let user = userResult.rows[0];
    
    if (!user) {
      // Создаем технического пользователя для Telegram
      const existingUser = await pool.query('SELECT id, email FROM users WHERE email = $1', [`telegram_${userId}@bot`]);
      
      if (existingUser.rows.length > 0) {
        await pool.query('UPDATE users SET telegram_id = $1 WHERE id = $2', [userId, existingUser.rows[0].id]);
        user = { id: existingUser.rows[0].id, email: existingUser.rows[0].email };
      } else {
        // Создаем нового пользователя
        const randomPassword = bcrypt.hashSync(Math.random().toString(36).slice(-8), 10);
        
        const result = await pool.query(`
          INSERT INTO users (email, password, name, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email
        `, [`telegram_${userId}@bot`, randomPassword, `Telegram User ${userId}`, 'user']);
        
        await pool.query('UPDATE users SET telegram_id = $1 WHERE id = $2', [userId, result.rows[0].id]);
        user = result.rows[0];
      }
    }
    
    return generateJWT(user.id, user.email);
  } catch (error) {
    console.error('getUserToken error:', error);
    throw error;
  }
}

// Генерация JWT токена
function generateJWT(userId, email) {
  return jwt.sign(
    { id: userId, email, role: 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// HTTP клиент для API
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}

// Форматирование цены
function formatPrice(price) {
  return `${parseFloat(price).toLocaleString('ru-RU')} ₽`;
}

// ==================== ОБРАБОТЧИКИ КОМАНД ====================

// Команда /start
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  
  try {
    // Получаем или создаем пользователя в БД
    await getUserToken(userId);
    
    await ctx.reply(
      `👋 Привет, ${ctx.from.first_name}!`,
      {
        ...mainKeyboard,
        parse_mode: 'HTML'
      }
    );
    
    await ctx.reply(
      '🏪 <b>TrailTech</b> — магазин техники для активного образа жизни!\n\n' +
      '🎯 <b>Что я умею:</b>\n' +
      '• Показывать каталог товаров\n' +
      '• Оформлять заказы\n' +
      '• Управлять корзиной\n' +
      '• Добавлять в избранное\n' +
      '• Отслеживать статусы заказов\n\n' +
      '🌐 <b>Наш сайт:</b> th.aleskysha.online\n\n' +
      '👇 Выберите действие в меню:',
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Error in /start:', error);
    await ctx.reply('😕 Произошла ошибка. Попробуйте позже.');
  }
});

// Команда /help
bot.help(async (ctx) => {
  await ctx.reply(
    '📖 <b>Помощь — TrailTech Bot</b>\n\n' +
    '🛍️ <b>Каталог</b> — просмотр всех товаров\n' +
    '🔥 <b>Акции</b> — товары со скидками\n' +
    '🛒 <b>Корзина</b> — управление корзиной\n' +
    '📦 <b>Заказы</b> — история заказов\n' +
    '👤 <b>Профиль</b> — личные данные\n' +
    '❤️ <b>Избранное</b> — избранные товары\n' +
    '📞 <b>Контакты</b> — информация о магазине\n\n' +
    '🔧 <b>Команды:</b>\n' +
    '/start — главное меню\n' +
    '/help — эта справка\n\n' +
    '🌐 <b>Сайт:</b> th.aleskysha.online\n\n' +
    '📍 <b>Мы находимся:</b>\n' +
    'Москва, ул. Примерная, 10\n' +
    '📞 +7 (999) 123-45-67\n' +
    '📧 info@trailtech.ru',
    { parse_mode: 'HTML', ...mainKeyboard }
  );
});

// ==================== ГЛАВНОЕ МЕНЮ ====================

bot.hears('🛍️ Каталог', async (ctx) => {
  try {
    const categories = await apiRequest('/categories');
    
    const keyboard = Markup.inlineKeyboard(
      categories.map(cat => 
        Markup.button.callback(`${cat.name} (${cat.products_count})`, `category_${cat.id}`)
      ),
      { columns: 1 }
    );
    
    await ctx.reply(
      '📂 <b>Категории товаров:</b>\n\nВыберите категорию:',
      { 
        parse_mode: 'HTML',
        ...keyboard
      }
    );
  } catch (error) {
    await ctx.reply('😕 Не удалось загрузить категории. Попробуйте позже.');
  }
});

bot.hears('🔥 Акции', async (ctx) => {
  try {
    const products = await apiRequest('/products?hit=true');
    
    if (products.length === 0) {
      await ctx.reply('🎁 Сейчас нет товаров по акции. Загляните позже!\n\n🌐 Посетите наш сайт: th.aleskysha.online', {
        parse_mode: 'HTML',
        ...mainKeyboard
      });
      return;
    }
    
    // Показываем только 3 товара, остальное на сайте
    const limitedProducts = products.slice(0, 3);
    
    let message = `🔥 <b>Акции — TrailTech</b>\n\n`;
    message += `📦 Товаров по акции: ${products.length}\n`;
    message += `🌐 <b>Полный каталог:</b> th.aleskysha.online\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    for (const product of limitedProducts) {
      const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
      
      message += `🔥 <b>${product.name}</b>\n`;
      message += `💰 <b>Цена:</b> <s>${formatPrice(product.old_price)}</s> <b>${formatPrice(product.price)}</b> (скидка ${discount}%)\n`;
      message += `⭐ <b>Рейтинг:</b> ${product.rating || 'Нет оценок'}\n`;
      message += `📦 <b>На складе:</b> ${product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}\n`;
      message += `📝 <i>${product.description}</i>\n`;
      message += `\n━━━━━━━━━━━━━━━━\n\n`;
    }
    
    message += `👀 <b>Это не всё!</b>\n\n`;
    message += `Ещё ${products.length - 3} товаров по акции доступно на нашем сайте.\n\n`;
    message += `🌐 <a href="${SITE_URL}">Открыть сайт и смотреть все акции</a>`;
    
    await ctx.reply(message, {
      parse_mode: 'HTML',
      ...siteKeyboard
    });
  } catch (error) {
    await ctx.reply('😕 Не удалось загрузить акции. Попробуйте позже.');
  }
});

bot.hears('🛒 Корзина', async (ctx) => {
  try {
    const token = await getUserToken(ctx.from.id);
    const cart = await apiRequest('/cart', 'GET', null, token);
    
    if (!cart.items || cart.items.length === 0) {
      await ctx.reply('🛒 Ваша корзина пуста.\n\nДобавьте товары из каталога!', {
        ...mainKeyboard
      });
      return;
    }
    
    let message = '🛒 <b>Ваша корзина:</b>\n\n';
    
    cart.items.forEach((item, index) => {
      message += `${index + 1}. <b>${item.name}</b>\n`;
      message += `   ${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `<b>Итого: ${formatPrice(cart.total)}</b>`;
    
    await ctx.reply(message, {
      parse_mode: 'HTML',
      ...cartKeyboard
    });
  } catch (error) {
    await ctx.reply('😕 Не удалось загрузить корзину. Попробуйте позже.');
  }
});

bot.hears('📦 Заказы', async (ctx) => {
  try {
    const token = await getUserToken(ctx.from.id);
    const orders = await apiRequest('/orders', 'GET', null, token);
    
    if (!orders || orders.length === 0) {
      await ctx.reply('📦 У вас пока нет заказов.\n\nСделайте первый заказ в каталоге!', {
        ...mainKeyboard
      });
      return;
    }
    
    const statusEmojis = {
      pending: '⏳',
      confirmed: '✅',
      shipped: '🚚',
      delivered: '📦',
      cancelled: '❌'
    };
    
    for (const order of orders.slice(0, 5)) {
      let message = `📦 <b>Заказ #${order.id}</b>\n\n`;
      message += `📅 <b>Дата:</b> ${new Date(order.created_at).toLocaleDateString('ru-RU')}\n`;
      message += `💰 <b>Сумма:</b> ${formatPrice(order.total_amount)}\n`;
      message += `📊 <b>Статус:</b> ${statusEmojis[order.status] || '📋'} ${getOrderStatusName(order.status)}\n\n`;
      
      message += `<b>Товары:</b>\n`;
      order.items.forEach(item => {
        message += `• ${item.name} x${item.quantity}\n`;
      });
      
      await ctx.reply(message, { parse_mode: 'HTML' });
    }
  } catch (error) {
    await ctx.reply('😕 Не удалось загрузить заказы. Попробуйте позже.');
  }
});

function getOrderStatusName(status) {
  const names = {
    pending: 'В обработке',
    confirmed: 'Подтверждён',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    cancelled: 'Отменён'
  };
  return names[status] || status;
}

bot.hears('👤 Профиль', async (ctx) => {
  try {
    const token = await getUserToken(ctx.from.id);
    const user = await apiRequest('/auth/me', 'GET', null, token);
    
    let message = `👤 <b>Ваш профиль</b>\n\n`;
    message += `📧 <b>Email:</b> ${user.user.email}\n`;
    message += `👤 <b>Имя:</b> ${user.user.name}\n`;
    message += `📞 <b>Телефон:</b> ${user.user.phone || 'Не указан'}\n`;
    message += `📍 <b>Адрес:</b> ${user.user.address || 'Не указан'}\n`;
    message += `📅 <b>Дата регистрации:</b> ${new Date(user.user.created_at).toLocaleDateString('ru-RU')}\n\n`;
    message += `<i>Для изменения данных используйте сайт или обратитесь к администратору.</i>`;
    
    await ctx.reply(message, {
      parse_mode: 'HTML',
      ...mainKeyboard
    });
  } catch (error) {
    await ctx.reply('😕 Не удалось загрузить профиль. Попробуйте позже.');
  }
});

bot.hears('❤️ Избранное', async (ctx) => {
  try {
    const token = await getUserToken(ctx.from.id);
    const favorites = await apiRequest('/favorites', 'GET', null, token);
    
    if (!favorites || favorites.length === 0) {
      await ctx.reply('❤️ Ваше избранное пусто.\n\nДобавляйте понравившиеся товары в избранное!\n\n🌐 Посетите наш сайт: th.aleskysha.online', {
        parse_mode: 'HTML',
        ...mainKeyboard
      });
      return;
    }
    
    // Показываем только 3 товара, остальное на сайте
    const limitedFavorites = favorites.slice(0, 3);
    
    let message = `❤️ <b>В избранном</b>\n\n`;
    message += `📦 Товаров: ${favorites.length}\n`;
    message += `🌐 <b>Полный список:</b> th.aleskysha.online\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    for (const item of limitedFavorites) {
      message += `🛍️ <b>${item.name}</b>\n`;
      message += `💰 <b>Цена:</b> ${formatPrice(item.price)}\n`;
      message += `⭐ <b>Рейтинг:</b> ${item.rating || 'Нет оценок'}\n`;
      message += `📂 <b>Категория:</b> ${item.category_name}\n`;
      message += `📝 <i>${item.description || ''}</i>\n`;
      message += `\n━━━━━━━━━━━━━━━━\n\n`;
    }
    
    if (favorites.length > 3) {
      message += `👀 <b>Это не всё!</b>\n\n`;
      message += `Ещё ${favorites.length - 3} товаров в избранном доступно на нашем сайте.\n\n`;
      message += `🌐 <a href="${SITE_URL}">Открыть сайт и смотреть всё избранное</a>`;
    }
    
    await ctx.reply(message, {
      parse_mode: 'HTML',
      ...siteKeyboard
    });
  } catch (error) {
    await ctx.reply('😕 Не удалось загрузить избранное. Попробуйте позже.');
  }
});

bot.hears('📞 Контакты', async (ctx) => {
  let message = '📞 <b>Контакты TrailTech</b>\n\n';
  message += '📍 <b>Адрес:</b> Москва, ул. Примерная, 10, офис 5\n';
  message += '📞 <b>Телефон:</b> +7 (999) 123-45-67\n';
  message += '📧 <b>Email:</b> info@trailtech.ru\n\n';
  message += '🕐 <b>Режим работы:</b>\n';
  message += 'Пн-Вс: 9:00 - 21:00\n\n';
  message += '🌐 <b>Сайт:</b> th.aleskysha.online\n';
  message += '✈️ <b>Telegram:</b> @TrailTech_Bot\n\n';
  message += '<i>Мы всегда на связи! Пишите, звоните, приходите в гости!</i>';
  
  await ctx.reply(message, {
    parse_mode: 'HTML',
    ...mainKeyboard
  });
});

bot.hears('🌐 Открыть сайт', async (ctx) => {
  await ctx.reply(
    `🌐 <b>Наш сайт:</b>\n\n` +
    `👉 <a href="${SITE_URL}">th.aleskysha.online</a>\n\n` +
    `Перейдите на сайт для полного каталога товаров и удобного шоппинга!`,
    {
      parse_mode: 'HTML',
      ...siteKeyboard
    }
  );
});

bot.hears('❓ Помощь', async (ctx) => {
  await ctx.reply(
    '❓ <b>Помощь</b>\n\n' +
    '🤖 <b>Я — Telegram-бот магазина TrailTech!</b>\n\n' +
    '🎯 <b>Что я умею:</b>\n' +
    '• 📂 <b>Показывать каталог</b> — все товары по категориям\n' +
    '• 🔥 <b>Акции</b> — товары со скидками\n' +
    '• 🛒 <b>Корзина</b> — добавление и управление\n' +
    '• 📦 <b>Заказы</b> — оформление и отслеживание\n' +
    '• ❤️ <b>Избранное</b> — сохранение понравившихся товаров\n' +
    '• 👤 <b>Профиль</b> — ваши данные и история\n' +
    '• 📞 <b>Контакты</b> — информация о магазине\n\n' +
    '💡 <b>Советы:</b>\n' +
    '• Используйте кнопки меню для навигации\n' +
    '• Товары можно добавлять в корзину и избранное\n' +
    '• Статусы заказов обновляются автоматически\n' +
    '• Все данные синхронизированы с сайтом\n\n' +
    '🔧 <b>Команды:</b>\n' +
    '/start — главное меню\n' +
    '/help — эта справка\n\n' +
    '🌐 <b>Сайт:</b> th.aleskysha.online\n\n' +
    '❓ <b>Вопросы?</b>\n' +
    'Свяжитесь с нами: info@trailtech.ru',
    { 
      parse_mode: 'HTML',
      ...mainKeyboard
    }
  );
});

// ==================== ОБРАБОТКА CALLBACK ====================

bot.action('main_menu', async (ctx) => {
  await ctx.editMessageText('Главное меню:', {
    ...mainKeyboard
  });
});

bot.action(/^category_(\d+)$/, async (ctx) => {
  try {
    const categoryId = ctx.match[1];
    const products = await apiRequest(`/products?category=${categoryId}`);
    
    if (products.length === 0) {
      await ctx.reply('📭 В этой категории пока нет товаров.\n\n🌐 Посетите наш сайт: th.aleskysha.online', {
        parse_mode: 'HTML',
        ...mainKeyboard
      });
      return;
    }
    
    // Показываем только 3 товара, остальное на сайте
    const limitedProducts = products.slice(0, 3);
    
    // Получаем название категории
    const categories = await apiRequest('/categories');
    const category = categories.find(c => c.id === parseInt(categoryId));
    const categoryName = category ? category.name : 'Категория';
    
    let message = `📂 <b>${categoryName}</b>\n\n`;
    message += `📦 Товаров в категории: ${products.length}\n`;
    message += `🌐 <b>Полный каталог:</b> th.aleskysha.online\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    for (const product of limitedProducts) {
      message += `🛍️ <b>${product.name}</b>\n`;
      message += `💰 <b>Цена:</b> ${formatPrice(product.price)}\n`;
      if (product.old_price) {
        const discount = Math.round((1 - product.price / product.old_price) * 100);
        message += `🔥 <b>Старая цена:</b> ${formatPrice(product.old_price)} (скидка ${discount}%)\n`;
      }
      message += `⭐ <b>Рейтинг:</b> ${product.rating || 'Нет оценок'}\n`;
      message += `📦 <b>На складе:</b> ${product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}\n`;
      message += `📝 <i>${product.description}</i>\n`;
      message += `\n━━━━━━━━━━━━━━━━\n\n`;
    }
    
    message += `👀 <b>Это не всё!</b>\n\n`;
    message += `Ещё ${products.length - 3} товаров в этой категории доступно на нашем сайте.\n\n`;
    message += `🌐 <a href="${SITE_URL}">Открыть сайт и смотреть все товары</a>`;
    
    await ctx.reply(message, {
      parse_mode: 'HTML',
      ...siteKeyboard
    });
  } catch (error) {
    await ctx.reply('😕 Ошибка загрузки товаров.');
  }
});

// ==================== АДМИН-ПАНЕЛЬ ====================

bot.command('admin', async (ctx) => {
  const userId = ctx.from.id;
  
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE telegram_id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user || user.role !== 'admin') {
      await ctx.reply('🚫 Доступ запрещён!');
      return;
    }
    
    await ctx.reply(
      '👨‍💼 <b>Админ-панель TrailTech</b>\n\n' +
      'Выберите действие:',
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📦 Заказы', 'admin_orders')],
          [Markup.button.callback('📊 Статистика', 'admin_stats')]
        ])
      }
    );
  } catch (error) {
    await ctx.reply('😕 Ошибка.');
  }
});

bot.action('admin_orders', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const userResult = await pool.query('SELECT id, email FROM users WHERE telegram_id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      await ctx.reply('🚫 Пользователь не найден!');
      return;
    }
    
    const token = generateJWT(user.id, user.email);
    const orders = await apiRequest('/admin/orders', 'GET', null, token);
    
    if (!orders || orders.length === 0) {
      await ctx.reply('📭 Заказов пока нет.');
      return;
    }
    
    for (const order of orders.slice(0, 10)) {
      let message = `📦 <b>Заказ #${order.id}</b>\n\n`;
      message += `👤 <b>Клиент:</b> ${order.user_name || order.name}\n`;
      message += `📧 <b>Email:</b> ${order.email}\n`;
      message += `📞 <b>Телефон:</b> ${order.phone}\n`;
      message += `💰 <b>Сумма:</b> ${formatPrice(order.total_amount)}\n`;
      message += `📊 <b>Статус:</b> ${order.status}\n`;
      message += `📍 <b>Адрес:</b> ${order.delivery_address || 'Самовывоз'}\n\n`;
      
      message += `<b>Товары:</b>\n`;
      order.items.forEach(item => {
        message += `• ${item.name} x${item.quantity}\n`;
      });
      
      await ctx.reply(message, {
        parse_mode: 'HTML',
        ...orderStatusKeyboard(order.id)
      });
    }
  } catch (error) {
    await ctx.reply('😕 Ошибка загрузки заказов.');
  }
});

bot.action(/^order_(confirm|shipped|delivered|cancel)_(\d+)$/, async (ctx) => {
  try {
    const action = ctx.match[1];
    const orderId = ctx.match[2];
    const userId = ctx.from.id;
    
    const userResult = await pool.query('SELECT id, email FROM users WHERE telegram_id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      await ctx.answerCbQuery('🚫 Пользователь не найден!');
      return;
    }
    
    const token = generateJWT(user.id, user.email);
    
    const statusMap = {
      confirm: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancel: 'cancelled'
    };
    
    await apiRequest(`/admin/orders/${orderId}/status`, 'PUT', { status: statusMap[action] }, token);
    
    // Уведомляем пользователя
    const orderResult = await pool.query('SELECT user_id FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length > 0) {
      const orderUserId = orderResult.rows[0].user_id;
      const tgUserResult = await pool.query('SELECT telegram_id FROM users WHERE id = $1', [orderUserId]);
      
      if (tgUserResult.rows.length > 0 && tgUserResult.rows[0].telegram_id) {
        const statusNames = {
          confirmed: '✅ подтверждён',
          shipped: '🚚 отправлен',
          delivered: '📦 доставлен',
          cancelled: '❌ отменён'
        };
        
        await bot.telegram.sendMessage(
          tgUserResult.rows[0].telegram_id,
          `📦 <b>Статус заказа #${orderId} изменён!</b>\n\nНовый статус: ${statusNames[statusMap[action]]}`,
          { parse_mode: 'HTML' }
        );
      }
    }
    
    await ctx.answerCbQuery('✅ Статус обновлён!');
  } catch (error) {
    await ctx.answerCbQuery('😕 Ошибка обновления статуса.');
  }
});

bot.action('admin_stats', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const userResult = await pool.query('SELECT id, email FROM users WHERE telegram_id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      await ctx.reply('🚫 Пользователь не найден!');
      return;
    }
    
    const token = generateJWT(user.id, user.email);
    const stats = await apiRequest('/admin/stats', 'GET', null, token);
    
    let message = '📊 <b>Статистика магазина</b>\n\n';
    message += `👥 <b>Пользователей:</b> ${stats.totalUsers}\n`;
    message += `🛍️ <b>Товаров:</b> ${stats.totalProducts}\n`;
    message += `📦 <b>Заказов:</b> ${stats.totalOrders}\n`;
    message += `💰 <b>Выручка:</b> ${formatPrice(stats.totalRevenue)}\n\n`;
    
    if (stats.recentOrders && stats.recentOrders.length > 0) {
      message += '<b>Последние заказы:</b>\n';
      stats.recentOrders.forEach(order => {
        message += `• #${order.id} — ${formatPrice(order.total_amount)} (${order.status})\n`;
      });
    }
    
    await ctx.reply(message, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'admin_stats')],
        [Markup.button.callback('⬅️ Назад', 'admin_orders')]
      ])
    });
  } catch (error) {
    await ctx.reply('😕 Ошибка загрузки статистики.');
  }
});

// ==================== ЗАПУСК БОТА ====================

async function startBot() {
  try {
    await bot.launch();
    
    const botInfo = await bot.telegram.getMe();
    
    console.log('===========================================');
    console.log('✅ Telegram-бот запущен!');
    console.log(`🤖 Имя бота: @${botInfo.username}`);
    console.log(`📛 Имя: ${botInfo.first_name}`);
    console.log(`🆔 ID: ${botInfo.id}`);
    console.log('===========================================');
  } catch (err) {
    console.error('❌ Ошибка запуска бота:', err.message);
  }
}

startBot();

// Обработка завершения работы - игнорируем сигналы при запуске
let isReady = false;

setTimeout(() => { isReady = true; }, 5000);

process.once('SIGINT', () => {
  if (isReady) {
    console.log('\n🛑 Остановка бота...');
    bot.stop('SIGINT');
  } else {
    console.log('\n🛑 Принудительная остановка...');
    process.exit(0);
  }
});

process.once('SIGTERM', () => {
  if (isReady) {
    console.log('\n🛑 Остановка бота...');
    bot.stop('SIGTERM');
  } else {
    console.log('\n🛑 Принудительная остановка...');
    process.exit(0);
  }
});
