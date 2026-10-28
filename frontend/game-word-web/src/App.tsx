import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import StatusMessage from './components/common/StatusMessage';
import GamePage from './features/game/pages/GamePage';
import AuthPage from './features/auth/pages/AuthPage';
import LeaderboardPage from './features/leaderboard/pages/LeaderboardPage';
import HistoryPage from './features/history/pages/HistoryPage';

function NotFoundPage() {
  return (
    <StatusMessage kind="empty">
      Không tìm thấy trang. <Link to="/">Về trang chơi</Link>
    </StatusMessage>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<GamePage />} />
            <Route path="login" element={<AuthPage key="login" mode="login" />} />
            <Route path="register" element={<AuthPage key="register" mode="register" />} />
            <Route
              path="leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
