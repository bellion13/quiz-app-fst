import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Zap, Settings, Lock, Sun, Moon } from 'lucide-react';
import Home from './pages/Home';
import PracticeMode from './pages/PracticeMode';
import TopicMode from './pages/TopicMode';
import TopicSelect from './pages/TopicSelect';
import Login from './pages/Login';
import Manager from './pages/Manager';
import { getToken } from './utils/api';

function App() {
  const isAuth = !!getToken();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('quiz_theme');
    const initial = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', initial);
    return initial;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quiz_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            title={theme === 'light' ? 'Chế độ tối (Dark mode)' : 'Chế độ sáng (Light mode)'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
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
