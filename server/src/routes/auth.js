const express = require('express');
const router = express.Router();

// POST /auth/login - Đăng nhập admin (sẽ implement ở Bước 5)
router.post('/login', (req, res) => {
  // Placeholder - sẽ implement với bcrypt + JWT ở Bước 5
  res.status(501).json({ message: 'Chức năng đăng nhập sẽ được thêm ở Bước 5' });
});

module.exports = router;
