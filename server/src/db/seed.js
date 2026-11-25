const bcrypt = require('bcryptjs');
const db = require('./index');
const sampleQuestions = require('../data/sample-questions.json');
require('dotenv').config();

const normalizeKey = (str) => {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
};

async function seed() {
  console.log('--- Bắt đầu khởi tạo database & seed dữ liệu ---');

  try {
    // 1. Tạo bảng questions và users
    console.log('1. Đang kiểm tra & tạo bảng...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        topic TEXT NOT NULL,
        question TEXT NOT NULL,
        question_key TEXT UNIQUE NOT NULL,
        options JSONB NOT NULL,
        answer INTEGER NOT NULL,
        explanation TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    console.log('✅ Bảng questions và users đã sẵn sàng.');

    // 2. Tạo tài khoản admin nếu chưa có
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log(`2. Đang kiểm tra tài khoản admin: "${adminUsername}"...`);
    const existingAdmin = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [adminUsername]
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2)',
        [adminUsername, hashedPassword]
      );
      console.log(`✅ Đã tạo tài khoản admin: "${adminUsername}" thành công.`);
    } else {
      console.log(`ℹ️ Tài khoản admin "${adminUsername}" đã tồn tại.`);
    }

    // 3. Nạp bộ câu hỏi mẫu
    console.log('3. Đang nạp câu hỏi mẫu vào database...');
    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of sampleQuestions) {
      const key = normalizeKey(item.question);
      const res = await db.query(
        `INSERT INTO questions (topic, question, question_key, options, answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (question_key) DO NOTHING
         RETURNING id`,
        [
          item.topic.toLowerCase(),
          item.question,
          key,
          JSON.stringify(item.options),
          item.answer,
          item.explanation || '',
        ]
      );

      if (res.rows.length > 0) {
        insertedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Kết quả nạp câu hỏi: đã thêm ${insertedCount} câu, bỏ qua ${skippedCount} câu trùng.`);
    console.log('🎉 Hoàn thành seed database!');
  } catch (err) {
    console.error('❌ Lỗi khi seed database:', err);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

seed();
