import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authChangePassword, authLogin, authRegister, SESSION_REJECTED_EVENT, TOKEN_KEY } from '../services/api';
import type { AuthResponse } from '../types/api';

const USER_KEY = 'user';

export interface AuthUser {
  id: number;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Thời điểm hết hạn (ms) đọc từ payload JWT; null nếu không đọc được
export function getTokenExpiry(token: string): number | null {
  try {
    const payload: unknown = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = (payload as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw: unknown = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
    if (!token || typeof raw !== 'object' || raw === null) return null;
    const { id, userId, username } = raw as { id?: unknown; userId?: unknown; username?: unknown };
    const resolvedId = typeof id === 'number' ? id : userId;
    if (typeof resolvedId !== 'number' || typeof username !== 'string') return null;
    const expiry = getTokenExpiry(token);
    if (expiry !== null && expiry <= Date.now()) return null;
    return { id: resolvedId, username };
  } catch {
    return null;
  }
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = readStoredUser();
    if (!stored) clearStorage();
    return stored;
  });

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
  }, []);

  const applySession = useCallback((res: AuthResponse) => {
    const next = { id: res.userId, username: res.username };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  // Tự đăng xuất khi server từ chối token (đã bị thu hồi do đổi/đặt lại mật khẩu)
  useEffect(() => {
    window.addEventListener(SESSION_REJECTED_EVENT, logout);
    return () => window.removeEventListener(SESSION_REJECTED_EVENT, logout);
  }, [logout]);

  // Tự đăng xuất khi token hết hạn
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = token ? getTokenExpiry(token) : null;
    if (expiry === null) return;
    const timer = window.setTimeout(logout, Math.max(0, expiry - Date.now()));
    return () => window.clearTimeout(timer);
  }, [user, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      logout,
      login: async (username, password) => applySession(await authLogin({ username, password })),
      register: async (username, password, email) =>
        applySession(await authRegister({ username, password, email })),
      changePassword: async (currentPassword, newPassword) =>
        applySession(await authChangePassword({ currentPassword, newPassword })),
    }),
    [user, logout, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return ctx;
}
