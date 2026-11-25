import { Routes, Route, Link } from 'react-router-dom';
import { Zap, Settings, Lock } from 'lucide-react';
import Home from './pages/Home';
import PracticeMode from './pages/PracticeMode';
import TopicMode from './pages/TopicMode';
import TopicSelect from './pages/TopicSelect';
import Login from './pages/Login';
import Manager from './pages/Manager';
import { getToken } from './utils/api';

function App() {
  const isAuth = !!getToken();

  return (
    <div className="app">
      <header className="site-nav">
        <Link to="/" className="nav-logo inline-icon">
          <Zap size={20} /> <strong>Frontend Quiz</strong>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Làm bài</Link>
          <Link to={isAuth ? "/manager" : "/login"} className="nav-link nav-btn-admin inline-icon">
            {isAuth ? (
              <>
                <Settings size={16} /> Quản trị
              </>
            ) : (
              <>
                <Lock size={16} /> Admin
              </>
            )}
          </Link>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<PracticeMode />} />
          <Route path="/topic" element={<TopicSelect />} />
          <Route path="/topic/:topicName" element={<TopicMode />} />
          <Route path="/login" element={<Login />} />
          <Route path="/manager" element={<Manager />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
