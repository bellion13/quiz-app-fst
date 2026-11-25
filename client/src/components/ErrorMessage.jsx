import { XCircle } from 'lucide-react';

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error">
      <p className="inline-icon-center" style={{ justifyContent: 'center' }}>
        <XCircle size={20} /> {message}
      </p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
