export type AuthMode = 'login' | 'register';

export interface AuthValues {
  username: string;
  password: string;
  email: string;
}

export type AuthErrors = Partial<Record<keyof AuthValues, string>>;

export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ChangePasswordErrors = Partial<Record<keyof ChangePasswordValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return 'Vui lòng nhập email.';
  if (!EMAIL_PATTERN.test(email)) return 'Email không hợp lệ.';
  return undefined;
}

// Kiểm tra phía client để phản hồi nhanh; backend vẫn là nơi xác nhận cuối cùng
export function validateAuth(values: AuthValues, mode: AuthMode): AuthErrors {
  const errors: AuthErrors = {};
  const username = values.username.trim();

  // Đăng nhập: ô "username" nhận cả tên tài khoản lẫn email
  if (!username) errors.username = mode === 'login' ? 'Vui lòng nhập tên tài khoản hoặc email.' : 'Vui lòng nhập tên tài khoản.';
  else if (mode === 'register' && !/^[a-zA-Z0-9_.]{3,30}$/.test(username))
    errors.username = 'Tên tài khoản dài 3–30 ký tự, chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch dưới.';

  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu.';
  else if (mode === 'register' && values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;

  if (mode === 'register') {
    const emailError = validateEmail(values.email);
    if (emailError) errors.email = emailError;
  }
  return errors;
}

export function validateForgotPassword(email: string): string | undefined {
  return validateEmail(email);
}

export type ResetPasswordValues = Omit<ChangePasswordValues, 'currentPassword'>;

export type ResetPasswordErrors = Partial<Record<keyof ResetPasswordValues, string>>;

// Dùng cho đặt lại mật khẩu (từ link email): mật khẩu mới + nhập lại
export function validateResetPassword(values: ResetPasswordValues): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {};
  if (!values.newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
  else if (values.newPassword.length < MIN_PASSWORD_LENGTH)
    errors.newPassword = `Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;

  if (!values.confirmPassword) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.';
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
  return errors;
}

export function validateChangePassword(values: ChangePasswordValues): ChangePasswordErrors {
  const errors: ChangePasswordErrors = validateResetPassword(values);
  if (!values.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  else if (!errors.newPassword && values.newPassword === values.currentPassword)
    errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  return errors;
}
