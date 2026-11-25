const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchQuestions(topic = null) {
  const url = topic ? `${API_URL}/questions?topic=${topic}` : `${API_URL}/questions`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Không thể tải câu hỏi. Vui lòng thử lại.');
  }

  return response.json();
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
  // Shuffle thứ tự câu hỏi
  const shuffledQuestions = shuffleArray(questions);

  // Shuffle thứ tự đáp án cho mỗi câu
  return shuffledQuestions.map((q) => {
    const originalOptions = q.options;
    const correctAnswer = originalOptions[q.answer];

    // Tạo mảng index và shuffle
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
