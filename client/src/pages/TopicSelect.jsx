import { Link } from 'react-router-dom';

const topics = [
  { name: 'html', label: 'HTML', icon: '🌐' },
  { name: 'css', label: 'CSS', icon: '🎨' },
  { name: 'js', label: 'JavaScript', icon: '⚡' },
  { name: 'react', label: 'React', icon: '⚛️' },
];

function TopicSelect() {
  return (
    <div>
      <Link to="/" className="back-link">← Về trang chủ</Link>

      <h2>Chọn chủ đề</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Mỗi chủ đề lấy tối đa 10 câu ngẫu nhiên. Làm hết rồi nộp bài để xem điểm.
      </p>

      <div className="topic-grid">
        {topics.map((topic) => (
          <Link
            key={topic.name}
            to={`/topic/${topic.name}`}
            className="card topic-card"
          >
            <div className="topic-icon">{topic.icon}</div>
            <h3>{topic.label}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TopicSelect;
