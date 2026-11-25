const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { questionSchema, normalizeKey } = require('../validators/question');

// GET /questions - Lấy danh sách câu hỏi (công khai, hỗ trợ lọc theo topic)
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

// GET /questions/export - Xuất toàn bộ câu hỏi ra JSON (Admin)
router.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT topic, question, options, answer, explanation FROM questions ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /questions - Thêm 1 câu hỏi mới (Admin)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parseResult = questionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => i.message).join('; ');
      return res.status(400).json({ error: issues });
    }

    const { topic, question, options, answer, explanation } = parseResult.data;
    const key = normalizeKey(question);

    // Kiểm tra trùng lặp câu hỏi
    const existing = await db.query('SELECT id FROM questions WHERE question_key = $1', [key]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Câu hỏi này đã tồn tại trong hệ thống.' });
    }

    const result = await db.query(
      `INSERT INTO questions (topic, question, question_key, options, answer, explanation)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, topic, question, options, answer, explanation, created_at, updated_at`,
      [topic.toLowerCase(), question, key, JSON.stringify(options), answer, explanation || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Câu hỏi này đã tồn tại trong hệ thống.' });
    }
    next(error);
  }
});

// PUT /questions/:id - Sửa 1 câu hỏi (Admin)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'ID câu hỏi không hợp lệ.' });
    }

    const parseResult = questionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => i.message).join('; ');
      return res.status(400).json({ error: issues });
    }

    const { topic, question, options, answer, explanation } = parseResult.data;
    const key = normalizeKey(question);

    // Kiểm tra xem có câu hỏi khác bị trùng question_key không
    const duplicate = await db.query(
      'SELECT id FROM questions WHERE question_key = $1 AND id != $2',
      [key, questionId]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'Câu hỏi này đã tồn tại trong hệ thống.' });
    }

    const result = await db.query(
      `UPDATE questions
       SET topic = $1, question = $2, question_key = $3, options = $4, answer = $5, explanation = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, topic, question, options, answer, explanation, created_at, updated_at`,
      [topic.toLowerCase(), question, key, JSON.stringify(options), answer, explanation || '', questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy câu hỏi để cập nhật.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Câu hỏi này đã tồn tại trong hệ thống.' });
    }
    next(error);
  }
});

// DELETE /questions/:id - Xoá 1 câu hỏi (Admin)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'ID câu hỏi không hợp lệ.' });
    }

    const result = await db.query('DELETE FROM questions WHERE id = $1 RETURNING id', [questionId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy câu hỏi để xoá.' });
    }

    res.json({ message: 'Xoá câu hỏi thành công.', id: questionId });
  } catch (error) {
    next(error);
  }
});

// POST /questions/import - Import nhiều câu hỏi (mode: 'merge' hoặc 'replace') (Admin)
router.post('/import', requireAdmin, async (req, res, next) => {
  const { mode, questions } = req.body;

  if (!['merge', 'replace'].includes(mode)) {
    return res.status(400).json({ error: 'Chế độ import phải là "merge" (Thêm vào) hoặc "replace" (Thay thế).' });
  }

  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'Dữ liệu questions phải là một mảng.' });
  }

  if (questions.length === 0) {
    return res.status(400).json({ error: 'Mảng câu hỏi rỗng, không có gì để import.' });
  }

  if (questions.length > 200) {
    return res.status(400).json({ error: 'Mỗi lần import tối đa 200 câu hỏi để đảm bảo hiệu năng server.' });
  }

  // Validate từng câu hỏi trong mảng trước khi chạm vào DB
  const validatedList = [];
  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    const validation = questionSchema.safeParse(item);
    if (!validation.success) {
      const issues = validation.error.issues.map((iss) => iss.message).join('; ');
      return res.status(400).json({
        error: `Lỗi ở câu thứ ${i + 1} ("${item.question || 'Không tiêu đề'}"): ${issues}`,
      });
    }
    validatedList.push({
      ...validation.data,
      key: normalizeKey(validation.data.question),
    });
  }

  // Nếu mode là replace, kiểm tra trùng lặp ngay trong chính file import
  if (mode === 'replace') {
    const seenKeys = new Set();
    for (let i = 0; i < validatedList.length; i++) {
      const key = validatedList[i].key;
      if (seenKeys.has(key)) {
        return res.status(400).json({
          error: `File import có câu hỏi bị trùng lặp tại câu thứ ${i + 1}: "${validatedList[i].question}"`,
        });
      }
      seenKeys.add(key);
    }
  }

  // Tiến hành Transaction trong Database
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (mode === 'replace') {
      // Xoá toàn bộ câu hỏi cũ
      await client.query('DELETE FROM questions');
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of validatedList) {
      const insertResult = await client.query(
        `INSERT INTO questions (topic, question, question_key, options, answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (question_key) DO NOTHING
         RETURNING id`,
        [
          item.topic.toLowerCase(),
          item.question,
          item.key,
          JSON.stringify(item.options),
          item.answer,
          item.explanation || '',
        ]
      );

      if (insertResult.rows.length > 0) {
        insertedCount++;
      } else {
        skippedCount++;
      }
    }

    await client.query('COMMIT');

    if (mode === 'replace') {
      res.json({
        message: `Đã thay thế toàn bộ bằng ${insertedCount} câu hỏi mới.`,
        inserted: insertedCount,
        skipped: 0,
      });
    } else {
      res.json({
        message: `Đã thêm ${insertedCount} câu, bỏ qua ${skippedCount} câu trùng.`,
        inserted: insertedCount,
        skipped: skippedCount,
      });
    }
  } catch (dbErr) {
    await client.query('ROLLBACK');
    next(dbErr);
  } finally {
    client.release();
  }
});

module.exports = router;
