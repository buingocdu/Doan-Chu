import { describe, expect, it } from 'vitest';
import { validateAuth } from './validation';

describe('validateAuth', () => {
  it('đăng nhập chỉ yêu cầu điền đủ', () => {
    expect(validateAuth({ username: '', password: '', email: '' }, 'login')).toEqual({
      username: 'Vui lòng nhập tên tài khoản.',
      password: 'Vui lòng nhập mật khẩu.',
    });
    expect(validateAuth({ username: 'a', password: '1', email: '' }, 'login')).toEqual({});
  });

  it('đăng ký kiểm tra định dạng tài khoản, mật khẩu, email', () => {
    const errors = validateAuth({ username: 'a b', password: '123', email: 'sai' }, 'register');
    expect(Object.keys(errors).sort()).toEqual(['email', 'password', 'username']);
    expect(validateAuth({ username: 'player_1', password: '123456', email: 'p@x.vn' }, 'register')).toEqual({});
  });
});
