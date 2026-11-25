import { Link } from 'react-router-dom';
import { Trophy, Dumbbell, ThumbsUp } from 'lucide-react';

function ScoreCard({ score, total, topic, onRestart }) {
  const percentage = Math.round((score / total) * 100);

  let IconComponent = Trophy;
  let iconColor = '#eab308';
  let message = 'Xuất sắc!';

  if (percentage < 50) {
    IconComponent = Dumbbell;
    iconColor = '#e94560';
    message = 'Cố gắng thêm nhé!';
  } else if (percentage < 80) {
    IconComponent = ThumbsUp;
    iconColor = '#0f3460';
    message = 'Khá tốt!';
  }

  return (
    <div className="card score-card">
      <div style={{ marginBottom: '12px' }}>
        <IconComponent size={56} color={iconColor} />
      </div>
      <h2>{message}</h2>
      {topic && <p style={{ color: '#666', marginBottom: '8px' }}>Chủ đề: {topic}</p>}
      <div className="score-number">
        {score} / {total}
      </div>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Bạn trả lời đúng {percentage}% câu hỏi
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onRestart}>
          Làm lại
        </button>
        <Link to="/" className="btn btn-outline">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default ScoreCard;
