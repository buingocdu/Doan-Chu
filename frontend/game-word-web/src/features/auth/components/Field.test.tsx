import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Field from './Field';

describe('Field', () => {
  it('ô mật khẩu có nút con mắt để hiện/ẩn', async () => {
    const user = userEvent.setup();
    render(<Field id="pw" label="Mật khẩu" type="password" autoComplete="current-password" value="bi-mat" onChange={() => {}} />);
    const input = screen.getByLabelText('Mật khẩu');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('ô thường không có nút con mắt', () => {
    render(<Field id="email" label="Email" type="email" autoComplete="email" value="" onChange={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
