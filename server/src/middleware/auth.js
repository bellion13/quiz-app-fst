const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập quản trị viên (thiếu token).' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_quiz_jwt_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
  }
};

module.exports = { requireAdmin };
