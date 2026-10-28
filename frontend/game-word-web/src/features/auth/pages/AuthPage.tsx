import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorMessage } from '../../../services/api';
import { validateAuth, type AuthErrors, type AuthMode, type AuthValues } from '../utils/validation';

interface AuthPageProps {
  mode: AuthMode;
}

interface FieldProps {
  id: keyof AuthValues;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function Field({ id, label, type, autoComplete, value, error, onChange }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState<AuthValues>({ username: '', password: '', email: '' });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (user) return <Navigate to={from} replace />;

  const update = (key: keyof AuthValues) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateAuth(values, mode);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const username = values.username.trim();
      if (isLogin) await login(username, values.password);
      else await register(username, values.password, values.email.trim());
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, isLogin ? 'Đăng nhập thất bại.' : 'Đăng ký thất bại.'));
      setSubmitting(false);
    }
  };

  return (
    <section className="auth">
      <div className="card auth-card">
        <h1>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p className="muted">
          {from === '/leaderboard'
            ? 'Bảng xếp hạng chỉ dành cho người đã đăng nhập. Khách vẫn chơi được, chỉ không được cộng điểm.'
            : isLogin
              ? 'Đăng nhập để được cộng điểm và lên bảng xếp hạng.'
              : 'Đăng ký miễn phí để lưu lịch sử chơi.'}
        </p>

        {formError && (
          <div className="alert" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field
            id="username"
            label="Tên tài khoản"
            type="text"
            autoComplete="username"
            value={values.username}
            error={errors.username}
            onChange={update('username')}
          />
          {!isLogin && (
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={values.email}
              error={errors.email}
              onChange={update('email')}
            />
          )}
          <Field
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={values.password}
            error={errors.password}
            onChange={update('password')}
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Đang xử lý…' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <p className="switch">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <Link to={isLogin ? '/register' : '/login'} state={location.state}>
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </Link>
        </p>
      </div>
    </section>
  );
}
