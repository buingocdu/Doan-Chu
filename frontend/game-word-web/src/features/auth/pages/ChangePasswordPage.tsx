import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorMessage } from '../../../services/api';
import Field from '../components/Field';
import { validateChangePassword, type ChangePasswordErrors, type ChangePasswordValues } from '../utils/validation';

const EMPTY: ChangePasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const [values, setValues] = useState<ChangePasswordValues>(EMPTY);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof ChangePasswordValues) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setDone(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateChangePassword(values);
    setErrors(nextErrors);
    setFormError(null);
    setDone(false);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setValues(EMPTY);
      setDone(true);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Đổi mật khẩu thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth">
      <div className="card auth-card">
        <h1>Đổi mật khẩu</h1>

        {formError && (
          <div className="alert" role="alert">
            {formError}
          </div>
        )}
        {done && (
          <div className="alert alert-success" role="status">
            Đã đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field
            id="currentPassword"
            label="Mật khẩu hiện tại"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            error={errors.currentPassword}
            onChange={update('currentPassword')}
          />
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
            {submitting ? 'Đang xử lý…' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </section>
  );
}
