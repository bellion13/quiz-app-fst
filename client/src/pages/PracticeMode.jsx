import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuestions, shuffleQuestions } from '../utils/api';
import QuestionCard from '../components/QuestionCard';
import ScoreCard from '../components/ScoreCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

function PracticeMode() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchQuestions();
      setQuestions(shuffleQuestions(data));
      setCurrentIndex(0);
      setScore(0);
      setAnswered(false);
      setSelectedOption(null);
      setIsFinished(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSelectOption = (optionIndex) => {
    if (answered) return;

    setSelectedOption(optionIndex);
    setAnswered(true);

    if (optionIndex === questions[currentIndex].answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setAnswered(false);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    loadQuestions();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={loadQuestions} />;
  if (questions.length === 0) return <EmptyState />;

  if (isFinished) {
    return (
      <ScoreCard
        score={score}
        total={questions.length}
        onRestart={handleRestart}
      />
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div>
      <Link to="/" className="back-link">← Về trang chủ</Link>

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
        selectedOption={selectedOption}
        answered={answered}
        onSelectOption={handleSelectOption}
      />

      {answered && (
        <button className="btn btn-primary" onClick={handleNext}>
          {currentIndex < questions.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả'}
        </button>
      )}
    </div>
  );
}

export default PracticeMode;
