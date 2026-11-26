import { Link } from 'react-router-dom';
import { Globe, Palette, Zap, Atom } from 'lucide-react';

const topics = [
  { name: 'html', label: 'HTML', Icon: Globe, color: '#dc2626' },
  { name: 'css', label: 'CSS', Icon: Palette, color: '#0284c7' },
  { name: 'js', label: 'JavaScript', Icon: Zap, color: '#d97706' },
  { name: 'react', label: 'React', Icon: Atom, color: '#4f46e5' },
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
        {topics.map(({ name, label, Icon, color }) => (
          <Link
            key={name}
            to={`/topic/${name}`}
            className="card topic-card"
          >
            <div className={`topic-icon topic-icon-${name}`}>
              <Icon size={36} color={color} />
            </div>
            <h3>{label}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TopicSelect;
