function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error">
      <p>❌ {message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
