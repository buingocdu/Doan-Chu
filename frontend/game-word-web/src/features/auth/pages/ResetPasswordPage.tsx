import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { authResetPassword, getErrorMessage } from '../../../services/api';
import Field from '../components/Field';
import { validateResetPassword, type ResetPasswordErrors, type ResetPasswordValues } from '../utils/validation';

export default function ResetPasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Token chuyển từ URL sang state để không nằm lại trên thanh địa chỉ/lịch sử trình duyệt
  const token = searchParams.get('token') ?? (location.state as { token?: string } | null)?.token ?? '';
  const [values, setValues] = useState<ResetPasswordValues>({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.has('token')) navigate('/reset-password', { replace: true, state: { token } });
  }, [searchParams, token, navigate]);

  const update = (key: keyof ResetPasswordValues) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateResetPassword(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await authResetPassword({ token, newPassword: values.newPassword });
      // Mọi phiên cũ đã bị vô hiệu hóa ở server
      logout();
      setDone(true);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Đặt lại mật khẩu thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  let body;
  if (done) {
    body = (
      <>
        <div className="alert alert-success" role="status">
          Đã đặt mật khẩu mới. Hãy đăng nhập lại.
        </div>
        <p className="switch">
          <Link to="/login">Đăng nhập</Link>
        </p>
      </>
    );
  } else if (!token) {
    body = (
      <>
        <div className="alert" role="alert">
          Link đặt lại mật khẩu không hợp lệ. Hãy mở đúng link trong email hoặc yêu cầu link mới.
        </div>
        <p className="switch">
          <Link to="/forgot-password">Yêu cầu link mới</Link>
        </p>
      </>
    );
  } else {
    body = (
      <>
        {formError && (
          <div className="alert" role="alert">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <Field
            id="newPassword"
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            error={errors.newPassword}
            onChange={update('newPassword')}
          />
          <Field
            id="confirmPassword"
            label="Nhập lại mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={update('confirmPassword')}
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Đang xử lý…' : 'Đặt mật khẩu mới'}
          </button>
        </form>
        <p className="switch">
          <Link to="/forgot-password">Yêu cầu link mới</Link>
        </p>
      </>
    );
  }

  return (
    <section className="auth">
      <div className="card auth-card">
        <h1>Đặt lại mật khẩu</h1>
        {body}
      </div>
    </section>
  );
}
