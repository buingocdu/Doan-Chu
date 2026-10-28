import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { authForgotPassword, getErrorMessage } from '../../../services/api';
import Field from '../components/Field';
import { validateForgotPassword } from '../utils/validation';

export default function ForgotPasswordPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/change-password" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const nextError = validateForgotPassword(email);
    setError(nextError);
    setFormError(null);
    if (nextError) return;

    setSubmitting(true);
    try {
      await authForgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Không gửi được yêu cầu. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth">
      <div className="card auth-card">
        <h1>Quên mật khẩu</h1>
        <p className="muted">Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu vào hộp thư của bạn.</p>

        {formError && (
          <div className="alert" role="alert">
            {formError}
          </div>
        )}

        {sent ? (
          <div className="alert alert-success" role="status">
            Nếu email này đã đăng ký, link đặt lại mật khẩu đã được gửi tới hộp thư (hiệu lực 30 phút). Hãy kiểm tra cả
            mục Spam. Mật khẩu hiện tại vẫn dùng được cho tới khi bạn đặt mật khẩu mới.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              error={error}
              onChange={(value) => {
                setEmail(value);
                setError(undefined);
              }}
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Đang gửi…' : 'Gửi link đặt lại'}
            </button>
          </form>
        )}

        <p className="switch">
          <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </div>
    </section>
  );
}
