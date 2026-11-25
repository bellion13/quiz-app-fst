const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Quản lý Token trong LocalStorage
export function getToken() {
  return localStorage.getItem('quiz_admin_token');
}

export function setToken(token) {
  localStorage.setItem('quiz_admin_token', token);
}

export function removeToken() {
  localStorage.removeItem('quiz_admin_token');
}

// Xử lý tự động redirect khi 401
function handleAuthError() {
  removeToken();
  if (window.location.pathname.startsWith('/manager')) {
    window.location.href = '/login?expired=1';
  }
}

// Public: Lấy danh sách câu hỏi
export async function fetchQuestions(topic = null) {
  const url = topic ? `${API_URL}/questions?topic=${topic}` : `${API_URL}/questions`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Không thể tải câu hỏi. Vui lòng thử lại.');
  }

  return response.json();
}

// Admin: Đăng nhập
export async function loginAdmin(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Đăng nhập không thành công');
  }

  setToken(data.token);
  return data;
}

// Admin: Kiểm tra token còn hợp lệ không
export async function verifyToken() {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      removeToken();
      return false;
    }
    const data = await res.json();
    if (!data.valid) {
      removeToken();
      return false;
    }
    return true;
  } catch {
    return true; // Nếu lỗi mạng tạm thời, không xoá token vội
  }
}

// Admin: Thêm câu hỏi
export async function createQuestion(questionData) {
  const token = getToken();
  const res = await fetch(`${API_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(questionData),
  });

  if (res.status === 401) {
    handleAuthError();
    throw new Error('Phiên đăng nhập hết hạn.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Thêm câu hỏi thất bại.');
  }
  return data;
}

// Admin: Sửa câu hỏi
export async function updateQuestion(id, questionData) {
  const token = getToken();
  const res = await fetch(`${API_URL}/questions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(questionData),
  });

  if (res.status === 401) {
    handleAuthError();
    throw new Error('Phiên đăng nhập hết hạn.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Cập nhật câu hỏi thất bại.');
  }
  return data;
}

// Admin: Xoá câu hỏi
export async function deleteQuestion(id) {
  const token = getToken();
  const res = await fetch(`${API_URL}/questions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    handleAuthError();
    throw new Error('Phiên đăng nhập hết hạn.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Xoá câu hỏi thất bại.');
  }
  return data;
}

// Admin: Import câu hỏi
export async function importQuestions(mode, questions) {
  const token = getToken();
  const res = await fetch(`${API_URL}/questions/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mode, questions }),
  });

  if (res.status === 401) {
    handleAuthError();
    throw new Error('Phiên đăng nhập hết hạn.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Import thất bại.');
  }
  return data;
}

// Admin: Export câu hỏi
export async function exportQuestions() {
  const token = getToken();
  const res = await fetch(`${API_URL}/questions/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    handleAuthError();
    throw new Error('Phiên đăng nhập hết hạn.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Xuất câu hỏi thất bại.');
  }
  return data;
}

/**
 * Trộn ngẫu nhiên mảng (Fisher-Yates shuffle)
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Trộn câu hỏi và đáp án, map lại answer index
 */
export function shuffleQuestions(questions) {
  const shuffledQuestions = shuffleArray(questions);

  return shuffledQuestions.map((q) => {
    const originalOptions = q.options;
    const correctAnswer = originalOptions[q.answer];

    const indices = originalOptions.map((_, i) => i);
    const shuffledIndices = shuffleArray(indices);

    const shuffledOptions = shuffledIndices.map((i) => originalOptions[i]);
    const newAnswerIndex = shuffledOptions.indexOf(correctAnswer);

    return {
      ...q,
      options: shuffledOptions,
      answer: newAnswerIndex,
    };
  });
}
