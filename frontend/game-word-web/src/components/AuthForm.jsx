import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthForm({ mode }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, email);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'That bai');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Dang nhap' : 'Dang ky'}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tai khoan" required /></div>
          <div className="field"><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mat khau" required /></div>
          {mode === 'register' && (
            <div className="field"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required /></div>
          )}
          <button className="btn-auth" type="submit">{mode === 'login' ? 'Dang nhap' : 'Dang ky'}</button>
        </form>
        <p className="switch">
          {mode === 'login' ? 'Chua co tai khoan? ' : 'Da co tai khoan? '}
          <Link to={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? 'Dang ky' : 'Dang nhap'}
          </Link>
        </p>
      </div>
    </div>
  );
}
