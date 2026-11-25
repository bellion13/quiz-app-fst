import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

function EmptyState({ topic }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={48} color="#94a3b8" />
      </div>
      <h2>Chưa có câu hỏi nào</h2>
      <p>
        {topic
          ? `Chủ đề ${topic} chưa có câu hỏi. Hãy liên hệ admin để thêm câu hỏi.`
          : 'Ngân hàng câu hỏi đang trống. Hãy liên hệ admin để import câu hỏi.'}
      </p>
      <Link to="/" className="btn btn-outline" style={{ marginTop: '16px' }}>
        Về trang chủ
      </Link>
    </div>
  );
}

export default EmptyState;
