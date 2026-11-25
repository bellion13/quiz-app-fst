const express = require('express');
const router = express.Router();
const sampleQuestions = require('../data/sample-questions.json');

// GET /questions - Lấy danh sách câu hỏi (lọc theo topic nếu có)
router.get('/', (req, res) => {
  const { topic } = req.query;

  let questions = sampleQuestions;

  if (topic) {
    const validTopics = ['html', 'css', 'js', 'react'];
    if (!validTopics.includes(topic.toLowerCase())) {
      return res.status(400).json({ error: `Topic không hợp lệ. Chọn: ${validTopics.join(', ')}` });
    }
    questions = questions.filter(q => q.topic === topic.toLowerCase());
  }

  // Thêm id tạm cho mỗi câu hỏi (sẽ thay bằng DB id ở Bước 4)
  const questionsWithId = questions.map((q, index) => ({
    id: index + 1,
    ...q,
  }));

  res.json(questionsWithId);
});

// GET /questions/export - Xuất toàn bộ câu hỏi (sẽ cần auth ở Bước 5)
router.get('/export', (req, res) => {
  res.json(sampleQuestions);
});

module.exports = router;
