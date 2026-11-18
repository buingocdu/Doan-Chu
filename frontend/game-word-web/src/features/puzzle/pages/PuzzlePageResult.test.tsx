import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PuzzlePage from './PuzzlePage';
import { AuthProvider } from '../../../hooks/useAuth';
import * as api from '../../../services/api';
import type { PuzzleGame } from '../../../types/api';

vi.mock('../../../services/api', async () => {
  const actual = await vi.importActual<typeof import('../../../services/api')>('../../../services/api');
  return { ...actual, getPuzzleGames: vi.fn(), getPuzzleLeaderboard: vi.fn(), submitPuzzleScore: vi.fn() };
});

// Thay bảng ghép bằng nút "xong" để vào thẳng màn hình hoàn thành
vi.mock('../components/PuzzleBoard', () => ({
  default: ({ onFinish }: { onFinish: (r: { durationMs: number; moves: number; hintsUsed: number }) => void }) => (
    <button type="button" onClick={() => onFinish({ durationMs: 569_400, moves: 167, hintsUsed: 0 })}>
      xong
    </button>
  ),
}));

const game: PuzzleGame = {
  id: 6,
  title: 'IMG_3525',
  imageId: 4,
  width: 1200,
  height: 800,
  imageVersion: 3,
  snapPercent: 8,
  rows: 8,
  cols: 8,
  active: true,
  createdAt: '2026-11-17T10:00:00',
};

afterEach(() => {
  vi.clearAllMocks();
});

async function finishGame() {
  vi.mocked(api.getPuzzleGames).mockResolvedValue([game]);
  vi.mocked(api.getPuzzleLeaderboard).mockResolvedValue([]);
  render(
    <MemoryRouter>
      <AuthProvider>
        <PuzzlePage />
      </AuthProvider>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: /IMG_3525/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'xong' }));
  await screen.findByText('Hoàn thành!');
}

describe('Màn hình hoàn thành', () => {
  it('hiện ảnh đã ghép hoàn chỉnh đúng ảnh của game (kèm phiên bản) và đúng tỉ lệ', async () => {
    await finishGame();
    const img = screen.getByAltText('Ảnh đã ghép: IMG_3525') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/api/puzzle/images/4/file?v=3');
    expect(img.style.aspectRatio).toContain('1200');
    // Ảnh nằm trong thẻ kết quả cùng thời gian và số lượt kéo
    expect(screen.getByText('9:29.4')).toBeInTheDocument();
    expect(screen.getByText(/167 lượt kéo/)).toBeInTheDocument();
    expect(img.closest('.puzzle-result')).not.toBeNull();
  });

  it('khách vẫn thấy ảnh cùng lời mời đăng nhập; Chơi lại và Chọn game khác vẫn có', async () => {
    await finishGame();
    expect(screen.getByAltText('Ảnh đã ghép: IMG_3525')).toBeInTheDocument();
    expect(screen.getByText(/để lưu kết quả và lên bảng xếp hạng/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chơi lại/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Chọn game khác' }));
    await waitFor(() => expect(screen.getByRole('list', { name: 'Danh sách game ghép hình' })).toBeInTheDocument());
  });
});
