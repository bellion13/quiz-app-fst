const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /questions - Lấy danh sách câu hỏi từ database (lọc theo topic nếu có)
router.get('/', async (req, res, next) => {
  try {
    const { topic } = req.query;

    let queryText = 'SELECT id, topic, question, options, answer, explanation FROM questions';
    let queryParams = [];

    if (topic) {
      const validTopics = ['html', 'css', 'js', 'react'];
      const normalizedTopic = topic.toLowerCase();
      if (!validTopics.includes(normalizedTopic)) {
        return res.status(400).json({ error: `Topic không hợp lệ. Chọn: ${validTopics.join(', ')}` });
      }
      queryText += ' WHERE topic = $1';
      queryParams.push(normalizedTopic);
    }

    queryText += ' ORDER BY id ASC';

    const result = await db.query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /questions/export - Xuất toàn bộ câu hỏi ra JSON (sẽ cần auth ở Bước 5)
router.get('/export', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT topic, question, options, answer, explanation FROM questions ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
