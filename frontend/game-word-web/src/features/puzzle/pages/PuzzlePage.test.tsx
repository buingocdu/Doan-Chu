import { render, screen, waitFor } from '@testing-library/react';
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

const game = (over: Partial<PuzzleGame>): PuzzleGame => ({
  id: 1,
  title: 'Hoa sen',
  imageId: 4,
  width: 1200,
  height: 1200,
  imageVersion: 470023,
  snapPercent: 8,
  rows: 3,
  cols: 3,
  active: true,
  createdAt: '2026-11-17T10:00:00',
  ...over,
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PuzzlePage', () => {
  it('địa chỉ ảnh trên thẻ game kèm phiên bản để không dùng ảnh cũ trong cache', async () => {
    vi.mocked(api.getPuzzleGames).mockResolvedValue([
      game({ id: 1, imageId: 4, imageVersion: 470023 }),
      game({ id: 2, title: 'Chưa có phiên bản', imageId: 5, imageVersion: null }),
    ]);
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <PuzzlePage />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Hoa sen')).toBeInTheDocument());
    const srcs = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(srcs).toContain('/api/puzzle/images/4/file?v=470023');
    expect(srcs).toContain('/api/puzzle/images/5/file');
  });

  it('khách vào được trang và thấy danh sách game không cần đăng nhập', async () => {
    vi.mocked(api.getPuzzleGames).mockResolvedValue([game({})]);
    render(
      <MemoryRouter>
        <AuthProvider>
          <PuzzlePage />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('list', { name: 'Danh sách game ghép hình' })).toBeInTheDocument());
    expect(screen.getByText('3×3 · 9 mảnh')).toBeInTheDocument();
  });
});
