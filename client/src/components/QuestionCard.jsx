function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  answered,
  onSelectOption,
}) {
  return (
    <div className="question-card">
      <div className="question-counter">
        Câu {questionNumber} / {totalQuestions}
      </div>
      <div className="question-text">{question.question}</div>

      <ul className="options-list">
        {question.options.map((option, index) => {
          let className = 'option-btn';

          if (answered) {
            if (index === question.answer) {
              className += ' correct';
            } else if (index === selectedOption) {
              className += ' incorrect';
            }
          } else if (index === selectedOption) {
            className += ' selected';
          }

          return (
            <li key={index}>
              <button
                className={className}
                onClick={() => onSelectOption(index)}
                disabled={answered}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && question.explanation && (
        <div className="explanation">
          💡 {question.explanation}
        </div>
      )}
    </div>
  );
}

export default QuestionCard;
