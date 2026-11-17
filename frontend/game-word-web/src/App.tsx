import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import StatusMessage from './components/common/StatusMessage';
import GamePage from './features/game/pages/GamePage';
import AuthPage from './features/auth/pages/AuthPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ChangePasswordPage from './features/auth/pages/ChangePasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import LeaderboardPage from './features/leaderboard/pages/LeaderboardPage';
import HistoryPage from './features/history/pages/HistoryPage';
import LobbyPage from './features/rooms/pages/LobbyPage';
import RoomPage from './features/rooms/pages/RoomPage';
import PuzzlePage from './features/puzzle/pages/PuzzlePage';
import AdminPuzzlePage from './features/puzzle/pages/AdminPuzzlePage';
import FriendsPage from './features/social/pages/FriendsPage';
import ConversationPage from './features/social/pages/ConversationPage';

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
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route
              path="change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="rooms"
              element={
                <ProtectedRoute>
                  <LobbyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="rooms/:code"
              element={
                <ProtectedRoute>
                  <RoomPage />
                </ProtectedRoute>
              }
            />
            {/* Chơi không cần đăng nhập; chỉ lưu kết quả lên bảng xếp hạng mới cần tài khoản */}
            <Route path="puzzle" element={<PuzzlePage />} />
            <Route
              path="admin/puzzle"
              element={
                <AdminRoute>
                  <AdminPuzzlePage />
                </AdminRoute>
              }
            />
            <Route
              path="friends"
              element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="messages/:userId"
              element={
                <ProtectedRoute>
                  <ConversationPage />
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
