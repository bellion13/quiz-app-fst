const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');

// Giới hạn 5 lần thử đăng nhập trong 1 phút chống brute-force
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 1 phút rồi thử lại.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /auth/login - Đăng nhập admin
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.' });
    }

    const result = await db.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'admin' },
      process.env.JWT_SECRET || 'super_secret_quiz_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
      message: 'Đăng nhập thành công',
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me - Kiểm tra token hiện tại
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_quiz_jwt_key_2026');
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
