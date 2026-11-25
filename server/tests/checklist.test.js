const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

describe('Bước 7: Checklist kiểm thử Quiz App API', () => {
  let adminToken = '';
  let backupQuestions = [];

  before(async () => {
    // Đăng nhập lấy token admin
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      }),
    });
    assert.equal(loginRes.status, 200, 'Admin phải đăng nhập thành công');
    assert.ok(loginRes.data.token, 'Phải trả về JWT token');
    adminToken = loginRes.data.token;

    // Backup toàn bộ câu hỏi hiện có để restore sau khi test
    const exportRes = await request('/questions/export', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(exportRes.status, 200);
    backupQuestions = exportRes.data;
  });

  after(async () => {
    // Khôi phục lại dữ liệu ban đầu của DB nếu có backup
    if (adminToken && backupQuestions.length > 0) {
      await request('/questions/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'replace',
          questions: backupQuestions,
        }),
      });
    }
  });

  test('1. Gọi các API admin không có token → bị chặn 401', async () => {
    const endpoints = [
      { path: '/questions', method: 'POST', body: { topic: 'html', question: 'Q?', options: ['A', 'B'], answer: 0 } },
      { path: '/questions/1', method: 'PUT', body: { topic: 'html', question: 'Q?', options: ['A', 'B'], answer: 0 } },
      { path: '/questions/1', method: 'DELETE' },
      { path: '/questions/import', method: 'POST', body: { mode: 'merge', questions: [] } },
      { path: '/questions/export', method: 'GET' },
    ];

    for (const ep of endpoints) {
      const res = await request(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert.equal(res.status, 401, `${ep.method} ${ep.path} không token phải trả 401`);
    }
  });

  test('2. Token sai hoặc hết hạn → bị chặn 401', async () => {
    const invalidRes = await request('/auth/me', {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    assert.equal(invalidRes.status, 401);

    const expiredToken = jwt.sign(
      { id: 1, username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'super_secret_quiz_jwt_key_2026',
      { expiresIn: '-10s' }
    );
    const expiredRes = await request('/questions/export', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(expiredRes.status, 401);
  });

  test('3. Import file có lỗi (sai format, thiếu trường) → báo rõ số thứ tự và lý do, không lưu gì', async () => {
    const beforeCount = (await request('/questions')).data.length;

    const badImport = await request('/questions/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        mode: 'merge',
        questions: [
          {
            topic: 'html',
            question: 'Câu hợp lệ tạm thời trong batch lỗi',
            options: ['A', 'B'],
            answer: 0,
          },
          {
            topic: 'invalid_topic',
            question: 'Câu lỗi ở vị trí 2',
            options: ['A'],
            answer: 5,
          },
        ],
      }),
    });

    assert.equal(badImport.status, 400);
    assert.match(badImport.data.error, /câu thứ 2/i, 'Phải báo rõ số thứ tự câu lỗi');

    const afterCount = (await request('/questions')).data.length;
    assert.equal(afterCount, beforeCount, 'Batch có lỗi thì không được lưu câu nào');
  });

  test('4. Import file có câu trùng (mode merge) → hiện đúng số câu thêm và số câu bỏ qua', async () => {
    const existingQ = backupQuestions[0];
    const res = await request('/questions/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        mode: 'merge',
        questions: [
          existingQ,
          {
            topic: 'js',
            question: 'Checklist Test Unique Question 12345?',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: 'Test',
          },
        ],
      }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.inserted, 1);
    assert.equal(res.data.skipped, 1);
    assert.match(res.data.message, /Đã thêm 1 câu, bỏ qua 1 câu trùng/);
  });

  test('5. Sửa câu → updated_at thay đổi; sửa trùng câu khác → báo "Câu hỏi này đã tồn tại"', async () => {
    // Tạo 2 câu để test
    const q1 = await request('/questions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        topic: 'css',
        question: 'Checklist Edit Q1?',
        options: ['A', 'B'],
        answer: 0,
      }),
    });
    assert.equal(q1.status, 201);

    const q2 = await request('/questions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        topic: 'css',
        question: 'Checklist Edit Q2?',
        options: ['A', 'B'],
        answer: 1,
      }),
    });
    assert.equal(q2.status, 201);

    // Đợi một chút để NOW() khác với created_at
    await new Promise((r) => setTimeout(r, 50));

    // Sửa q1 với nội dung mới -> updated_at phải lớn hơn created_at
    const updateOk = await request(`/questions/${q1.data.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        topic: 'css',
        question: 'Checklist Edit Q1 Updated?',
        options: ['A', 'B'],
        answer: 1,
      }),
    });
    assert.equal(updateOk.status, 200);
    assert.ok(
      new Date(updateOk.data.updated_at).getTime() > new Date(q1.data.updated_at).getTime(),
      'updated_at phải thay đổi sau khi sửa'
    );

    // Sửa q1 thành nội dung trùng với q2 (khác hoa thường / khoảng trắng) -> 409 "Câu hỏi này đã tồn tại"
    const updateDup = await request(`/questions/${q1.data.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        topic: 'css',
        question: '  checklist   edit   q2?  ',
        options: ['A', 'B'],
        answer: 0,
      }),
    });
    assert.equal(updateDup.status, 409);
    assert.match(updateDup.data.error, /Câu hỏi này đã tồn tại/);
  });

  test('6. Đăng nhập sai quá 5 lần → bị rate limit (429)', async () => {
    let lastStatus = 0;
    let lastData = {};
    for (let i = 0; i < 6; i++) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'wrong_password' }),
      });
      lastStatus = res.status;
      lastData = res.data;
    }
    assert.equal(lastStatus, 429, 'Lần thứ 6 trở đi phải bị rate limit 429');
    assert.match(lastData.error, /quá nhiều lần/i);
  });
});
