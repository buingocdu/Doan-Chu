import { describe, expect, it } from 'vitest';
import { validateAuth, validateChangePassword, validateForgotPassword, validateResetPassword } from './validation';

describe('validateAuth', () => {
  it('đăng nhập chỉ yêu cầu điền đủ, chấp nhận tên tài khoản hoặc email', () => {
    expect(validateAuth({ username: '', password: '', confirmPassword: '', email: '' }, 'login')).toEqual({
      username: 'Vui lòng nhập tên tài khoản hoặc email.',
      password: 'Vui lòng nhập mật khẩu.',
    });
    expect(validateAuth({ username: 'a', password: '1', confirmPassword: '', email: '' }, 'login')).toEqual({});
    expect(validateAuth({ username: 'p@x.vn', password: '1', confirmPassword: '', email: '' }, 'login')).toEqual({});
  });

  it('đăng ký kiểm tra định dạng tài khoản, mật khẩu, nhập lại mật khẩu, email', () => {
    const errors = validateAuth({ username: 'a b', password: '123', confirmPassword: '', email: 'sai' }, 'register');
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'password', 'username']);
    expect(
      validateAuth({ username: 'player_1', password: '123456', confirmPassword: '123465', email: 'p@x.vn' }, 'register'),
    ).toEqual({ confirmPassword: 'Mật khẩu nhập lại không khớp.' });
    expect(
      validateAuth({ username: 'player_1', password: '123456', confirmPassword: '123456', email: 'p@x.vn' }, 'register'),
    ).toEqual({});
  });
});

describe('validateForgotPassword', () => {
  it('yêu cầu email hợp lệ', () => {
    expect(validateForgotPassword(' ')).toBe('Vui lòng nhập email.');
    expect(validateForgotPassword('sai')).toBe('Email không hợp lệ.');
    expect(validateForgotPassword('p@x.vn')).toBeUndefined();
  });
});

describe('validateResetPassword', () => {
  it('kiểm tra độ dài và nhập lại', () => {
    expect(validateResetPassword({ newPassword: '', confirmPassword: '' })).toEqual({
      newPassword: 'Vui lòng nhập mật khẩu mới.',
      confirmPassword: 'Vui lòng nhập lại mật khẩu mới.',
    });
    expect(validateResetPassword({ newPassword: 'new123', confirmPassword: 'new12' })).toEqual({
      confirmPassword: 'Mật khẩu nhập lại không khớp.',
    });
    expect(validateResetPassword({ newPassword: 'new123', confirmPassword: 'new123' })).toEqual({});
  });
});

describe('validateChangePassword', () => {
  it('kiểm tra đủ trường, độ dài, trùng mật khẩu cũ và nhập lại', () => {
    expect(Object.keys(validateChangePassword({ currentPassword: '', newPassword: '', confirmPassword: '' })).sort()).toEqual([
      'confirmPassword',
      'currentPassword',
      'newPassword',
    ]);
    expect(validateChangePassword({ currentPassword: 'old123', newPassword: '123', confirmPassword: '123' })).toEqual({
      newPassword: 'Mật khẩu mới cần ít nhất 6 ký tự.',
    });
    expect(validateChangePassword({ currentPassword: 'old123', newPassword: 'old123', confirmPassword: 'old123' })).toEqual({
      newPassword: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
    });
    expect(validateChangePassword({ currentPassword: 'old123', newPassword: 'new123', confirmPassword: 'new124' })).toEqual({
      confirmPassword: 'Mật khẩu nhập lại không khớp.',
    });
    expect(validateChangePassword({ currentPassword: 'old123', newPassword: 'new123', confirmPassword: 'new123' })).toEqual({});
  });
});
