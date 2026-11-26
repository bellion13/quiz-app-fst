function Loading({ variant = 'quiz' }) {
  if (variant === 'table') {
    return (
      <div className="card skeleton-table" aria-busy="true" aria-label="Đang tải danh sách câu hỏi">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="skeleton-table-row">
            <div className="skeleton skeleton-cell-sm" />
            <div className="skeleton skeleton-cell-badge" />
            <div className="skeleton skeleton-cell-lg" />
            <div className="skeleton skeleton-cell-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div aria-busy="true" aria-label="Đang tải câu hỏi">
      <div className="skeleton skeleton-back-link" />
      <div className="skeleton skeleton-progress" />
      <div className="question-card">
        <div className="skeleton skeleton-counter" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-title-short" />
        <div className="skeleton-options">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton skeleton-option" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Loading;
