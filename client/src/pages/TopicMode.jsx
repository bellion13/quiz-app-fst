import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchQuestions, shuffleQuestions } from '../utils/api';
import QuestionCard from '../components/QuestionCard';
import ScoreCard from '../components/ScoreCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

const TOPIC_LABELS = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
  react: 'React',
};

const MAX_QUESTIONS = 10;

function TopicMode() {
  const { topicName } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOption }
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const topicLabel = TOPIC_LABELS[topicName] || topicName;

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchQuestions(topicName);
      // Shuffle và lấy tối đa 10 câu
      const shuffled = shuffleQuestions(data);
      setQuestions(shuffled.slice(0, MAX_QUESTIONS));
      setCurrentIndex(0);
      setAnswers({});
      setSubmitted(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [topicName]);

  const handleSelectOption = (optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    return correct;
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={loadQuestions} />;
  if (questions.length === 0) return <EmptyState topic={topicLabel} />;

  if (submitted) {
    const score = getScore();

    return (
      <div>
        <Link to="/topic" className="back-link">← Chọn chủ đề khác</Link>

        <ScoreCard
          score={score}
          total={questions.length}
          topic={topicLabel}
          onRestart={loadQuestions}
        />

        <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Xem lại bài làm</h3>
        <div className="review-list">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.answer;
            return (
              <div
                key={i}
                className={`review-item ${isCorrect ? 'correct-review' : 'incorrect-review'}`}
              >
                <div className="review-question">
                  Câu {i + 1}: {q.question}
                </div>
                <div className="review-answer">
                  {answers[i] !== undefined ? (
                    <>
                      <div>Bạn chọn: {q.options[answers[i]]}</div>
                      {!isCorrect && (
                        <div style={{ color: '#27ae60', marginTop: '4px' }}>
                          Đáp án đúng: {q.options[q.answer]}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: '#e67e22' }}>Chưa trả lời</div>
                  )}
                  {q.explanation && (
                    <div className="explanation" style={{ marginTop: '8px' }}>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div>
      <Link to="/topic" className="back-link">← Chọn chủ đề khác</Link>

      <h2>Chủ đề: {topicLabel}</h2>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        selectedOption={answers[currentIndex] ?? null}
        answered={false}
        onSelectOption={handleSelectOption}
      />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {currentIndex > 0 && (
          <button className="btn btn-outline" onClick={handlePrev}>
            ← Câu trước
          </button>
        )}
        {currentIndex < questions.length - 1 && (
          <button className="btn btn-primary" onClick={handleNext}>
            Câu tiếp theo →
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={handleSubmit}
          style={{ marginLeft: 'auto' }}
        >
          Nộp bài ({answeredCount}/{questions.length})
        </button>
      </div>
    </div>
  );
}

export default TopicMode;
