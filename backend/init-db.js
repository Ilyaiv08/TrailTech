import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDatabase() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Подключение к PostgreSQL установлено');
    
    // Чтение SQL файла
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('Создание таблиц...');
    await client.query(schema);
    console.log('✅ Таблицы созданы успешно!');
    
    // Создаем администратора с правильным паролем
    console.log('Создание администратора...');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    
    await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@trailtech.ru', adminPassword, 'Администратор', 'admin']);
    
    console.log('✅ Администратор создан: admin@trailtech.ru / admin123');
    
    // Считаем количество записей
    const tables = ['users', 'categories', 'products', 'orders', 'cart', 'favorites', 'reviews'];
    
    console.log('\n===========================================');
    console.log('Статистика базы данных:');
    console.log('===========================================');
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} записей`);
    }
    
    console.log('===========================================');
    console.log('✅ База данных успешно инициализирована!');
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error.message);
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

initDatabase();
