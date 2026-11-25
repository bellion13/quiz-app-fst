// Middleware requireAdmin - sẽ implement ở Bước 5
const requireAdmin = (req, res, next) => {
  // Placeholder - sẽ kiểm tra JWT ở Bước 5
  res.status(401).json({ error: 'Chưa xác thực. Chức năng này sẽ được thêm ở Bước 5.' });
};

module.exports = { requireAdmin };
