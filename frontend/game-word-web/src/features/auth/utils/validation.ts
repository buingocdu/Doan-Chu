export type AuthMode = 'login' | 'register';

export interface AuthValues {
  username: string;
  password: string;
  email: string;
}

export type AuthErrors = Partial<Record<keyof AuthValues, string>>;

// Kiểm tra phía client để phản hồi nhanh; backend vẫn là nơi xác nhận cuối cùng
export function validateAuth(values: AuthValues, mode: AuthMode): AuthErrors {
  const errors: AuthErrors = {};
  const username = values.username.trim();

  if (!username) errors.username = 'Vui lòng nhập tên tài khoản.';
  else if (mode === 'register' && !/^[a-zA-Z0-9_.]{3,30}$/.test(username))
    errors.username = 'Tên tài khoản dài 3–30 ký tự, chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch dưới.';

  if (!values.password) errors.password = 'Vui lòng nhập mật khẩu.';
  else if (mode === 'register' && values.password.length < 6) errors.password = 'Mật khẩu cần ít nhất 6 ký tự.';

  if (mode === 'register') {
    const email = values.email.trim();
    if (!email) errors.email = 'Vui lòng nhập email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email không hợp lệ.';
  }
  return errors;
}
