require('dotenv').config();
const express = require('express');
const cors = require('cors');
const questionRoutes = require('./routes/questions');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (for rate limiting behind Render/Railway proxy)
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có Origin (curl, health check) hoặc khi chưa set FRONTEND_URL
      if (!origin || !allowedOrigins) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/questions', questionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Đã xảy ra lỗi server' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
