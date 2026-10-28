import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Gamepad2, History, KeyRound, LogIn, LogOut, Trophy, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Bỏ qua điều hướng
      </a>
      <header className="app-header">
        <NavLink to="/" className="brand" aria-label="Game Đoán Chữ — trang chơi">
          <span className="brand-logo" aria-hidden="true">Đ</span>
          <span>Game Đoán Chữ</span>
        </NavLink>
        <nav aria-label="Điều hướng chính">
          <NavLink to="/" end className={navClass}>
            <Gamepad2 size={18} aria-hidden="true" />
            <span className="hide-sm">Chơi</span>
          </NavLink>
          <NavLink to="/leaderboard" className={navClass}>
            <Trophy size={18} aria-hidden="true" />
            <span className="hide-sm">Xếp hạng</span>
          </NavLink>
          {user ? (
            <>
              <NavLink to="/history" className={navClass}>
                <History size={18} aria-hidden="true" />
                <span className="hide-sm">Lịch sử</span>
              </NavLink>
              <NavLink to="/change-password" className={navClass} aria-label="Đổi mật khẩu">
                <KeyRound size={18} aria-hidden="true" />
                <span className="hide-sm">Mật khẩu</span>
              </NavLink>
              <button type="button" className="nav-link" onClick={handleLogout} aria-label={`Đăng xuất ${user.username}`}>
                <LogOut size={18} aria-hidden="true" />
                <span className="hide-sm">Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                <LogIn size={18} aria-hidden="true" />
                <span className="hide-sm">Đăng nhập</span>
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => `nav-link nav-cta${isActive ? ' active' : ''}`}>
                <UserPlus size={18} aria-hidden="true" />
                <span className="hide-sm">Đăng ký</span>
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main id="main" className="main">
        <Outlet />
      </main>
      <footer className="app-footer muted">Game Đoán Chữ · Phase 1</footer>
    </div>
  );
}
