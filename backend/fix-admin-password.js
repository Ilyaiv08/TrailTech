import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixAdminPassword() {
  try {
    console.log('Подключение к базе данных...');
    
    const adminPassword = bcrypt.hashSync('admin123', 10);
    
    const result = await pool.query(`
      UPDATE users 
      SET password = $1 
      WHERE email = 'admin@trailtech.ru'
      RETURNING id, email, name, role
    `, [adminPassword]);
    
    if (result.rows.length > 0) {
      console.log('✅ Пароль администратора обновлен!');
      console.log('📧 Email: admin@trailtech.ru');
      console.log('🔑 Пароль: admin123');
      console.log('👤 Роль:', result.rows[0].role);
    } else {
      console.log('❌ Администратор не найден. Создаем...');
      
      const createResult = await pool.query(`
        INSERT INTO users (email, password, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role
      `, ['admin@trailtech.ru', adminPassword, 'Администратор', 'admin']);
      
      console.log('✅ Администратор создан!');
      console.log('📧 Email: admin@trailtech.ru');
      console.log('🔑 Пароль: admin123');
      console.log('👤 Роль:', createResult.rows[0].role);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

fixAdminPassword();
