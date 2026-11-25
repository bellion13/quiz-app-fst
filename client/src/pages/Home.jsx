import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <h1>📝 Quiz ôn Frontend</h1>
      <p className="subtitle">Ôn lại kiến thức HTML, CSS, JavaScript và React</p>

      <div className="mode-cards">
        <Link to="/practice" className="card mode-card">
          <div className="icon">🎯</div>
          <h3>Làm từng câu</h3>
          <p>Trả lời từng câu, biết ngay đúng/sai kèm giải thích</p>
        </Link>

        <Link to="/topic" className="card mode-card">
          <div className="icon">📚</div>
          <h3>Làm theo chủ đề</h3>
          <p>Chọn chủ đề, làm bài rồi nộp để xem điểm</p>
        </Link>
      </div>
    </div>
  );
}

export default Home;
