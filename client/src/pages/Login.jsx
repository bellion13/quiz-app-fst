import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { loginAdmin, getToken } from '../utils/api';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('expired') ? 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      navigate('/manager');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await loginAdmin(username, password);
      navigate('/manager');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Link to="/" className="back-link">← Về trang làm bài</Link>

      <div className="card login-card">
        <h2>🔒 Đăng nhập Quản trị viên</h2>
        <p className="subtitle">Chỉ dành cho admin để quản lý ngân hàng câu hỏi</p>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username admin"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
