import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <Link to="/" className="brand">Game Do An Chu</Link>
      <nav>
        {user ? (
          <>
            <Link to="/leaderboard">Xep hang</Link>
            <Link to="/history">Lich su</Link>
            <button className="btn-logout" onClick={onLogout}>Dang xuat</button>
          </>
        ) : (
          <>
            <Link to="/login">Dang nhap</Link>
            <Link to="/register">Dang ky</Link>
          </>
        )}
      </nav>
    </header>
  );
}
