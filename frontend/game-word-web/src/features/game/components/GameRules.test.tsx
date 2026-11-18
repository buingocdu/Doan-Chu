import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import GameRules from './GameRules';

describe('GameRules', () => {
  beforeEach(() => localStorage.clear());

  it('thu gọn và mở rộng luật chơi, ghi nhớ lựa chọn', async () => {
    const { unmount } = render(<GameRules maxAttempts={10} />);
    const toggle = screen.getByRole('button', { name: 'Thu gọn' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Mở rộng' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('complementary')).toHaveClass('is-collapsed');
    expect(localStorage.getItem('gw.rulesCollapsed')).toBe('1');

    unmount();
    render(<GameRules maxAttempts={10} />);
    expect(screen.getByRole('button', { name: 'Mở rộng' })).toBeInTheDocument();
  });

  it('giải thích A/Ă/Â, O/Ô/Ơ là chữ cái khác nhau', () => {
    render(<GameRules maxAttempts={10} />);
    expect(screen.getByText(/là các chữ cái khác nhau/)).toBeInTheDocument();
  });

  it('giải thích cách tính điểm theo số lượt cấu hình (6 lượt: 100, 82, ... lần 6 còn 10)', () => {
    render(<GameRules maxAttempts={6} />);
    expect(screen.getByText(/Bạn có/).textContent).toContain('6 lượt');
    const scoring = screen.getByText(/Điểm tính theo lượt đoán đúng/);
    expect(scoring.textContent).toContain('100 điểm');
    expect(scoring.textContent).toContain('lần 2 được 82');
    expect(scoring.textContent).toContain('lần 6 còn 10 điểm');
  });

  it('10 lượt vẫn ra 100, 90 như cũ', () => {
    render(<GameRules maxAttempts={10} />);
    const scoring = screen.getByText(/Điểm tính theo lượt đoán đúng/);
    expect(scoring.textContent).toContain('lần 2 được 90');
    expect(scoring.textContent).toContain('lần 10 còn 10 điểm');
  });
});
