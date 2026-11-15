import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StatusMessage from './StatusMessage';

// Chỉ cải thiện trải nghiệm; quyền thực sự được backend kiểm tra ở /api/admin/**
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return <StatusMessage kind="error">Bạn không có quyền quản trị. Nếu vừa được cấp quyền, hãy đăng xuất rồi đăng nhập lại.</StatusMessage>;
  }
  return <>{children}</>;
}
