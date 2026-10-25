import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../hooks/useAuth';
import type { GuessResponse } from '../../../types/api';
import * as api from '../../../services/api';
import GamePage from './GamePage';

vi.mock('../../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/api')>();
  return { ...actual, startGame: vi.fn(), makeGuess: vi.fn(), getCurrentGame: vi.fn() };
});

const base: GuessResponse = {
  gameId: 1,
  wordId: 9,
  wordLength: 3,
  partLengths: [1, 2],
  guess: '',
  attempt: 0,
  maxAttempts: 4,
  correct: false,
  gameOver: false,
  cells: [],
  score: null,
  message: '',
  answer: null,
};

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GamePage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('GamePage', () => {
  beforeEach(() => {
    vi.mocked(api.startGame).mockReset().mockResolvedValue(base);
    vi.mocked(api.makeGuess).mockReset();
    vi.mocked(api.getCurrentGame).mockReset().mockResolvedValue(null);
  });

  it('tải lại trang: khôi phục ván đang dở cùng các lượt đã đoán, không tạo ván mới', async () => {
    localStorage.setItem('gw.currentGame', JSON.stringify({ owner: 'guest', gameId: 5 }));
    vi.mocked(api.getCurrentGame).mockResolvedValue({
      gameId: 5,
      wordId: 9,
      wordLength: 3,
      partLengths: [1, 2],
      maxAttempts: 4,
      attempt: 2,
      rows: [
        [
          { index: 0, letter: 'M', color: 'GREEN', label: '' },
          { index: 1, letter: 'A', color: 'BLACK', label: '' },
          { index: 2, letter: 'O', color: 'GREEN', label: '' },
        ],
        [
          { index: 0, letter: 'M', color: 'GREEN', label: '' },
          { index: 1, letter: 'E', color: 'BLUE', label: '' },
          { index: 2, letter: 'O', color: 'GREEN', label: '' },
        ],
      ],
    });
    renderPage();
    expect(await screen.findByText(/còn 2\/4 lượt/)).toBeInTheDocument();
    expect(api.getCurrentGame).toHaveBeenCalledWith(5);
    expect(api.startGame).not.toHaveBeenCalled();
    const rows = screen.getAllByRole('row');
    expect([...rows[1].querySelectorAll('.tile')].map((t) => t.textContent)).toEqual(['M', 'E', 'O']);
    expect(rows[1].querySelectorAll('.tile')[1]).toHaveClass('tile-blue');
  });

  it('hiển thị bảng đoán theo độ dài từ và số lượt', async () => {
    renderPage();
    expect(await screen.findByText(/2 tiếng \(1 \+ 2 chữ\) · còn 4\/4 lượt/)).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4);
    // Mỗi hàng tách thành 2 nhóm ô: 1 ô + 2 ô
    const groups = rows[0].querySelectorAll('.tile-group');
    expect([...groups].map((g) => g.children.length)).toEqual([1, 2]);
    expect(screen.getByRole('heading', { name: 'Luật chơi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đổi từ khác/ })).toBeDisabled();
  });

  it('ô nhập giữ nguyên chữ gõ, điền chữ có dấu lên bảng, cảnh báo và chặn gửi khi thừa chữ', async () => {
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText(/Nhập từ đoán/);
    await waitFor(() => expect(input).toHaveFocus());
    await user.type(input, 'mèo');
    const tiles = screen.getAllByRole('row')[0].querySelectorAll('.tile');
    expect([...tiles].map((t) => t.textContent)).toEqual(['M', 'È', 'O']);
    expect(screen.getByText(/3\/3 chữ cái/)).toBeInTheDocument();

    await user.type(input, 'o');
    expect(input).toHaveValue('mèoo');
    expect(screen.getByText('Thừa 1 chữ cái — hãy xóa bớt')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Thừa 1 chữ cái, hãy xóa bớt.');
    expect(api.makeGuess).not.toHaveBeenCalled();
  });

  it('cảnh báo khi gửi thiếu chữ, không gọi API', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('grid');
    await user.keyboard('AB{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Hãy nhập đủ 3 chữ cái.');
    expect(api.makeGuess).not.toHaveBeenCalled();
  });

  it('gửi lượt đoán, tô màu ô và hiện kết quả khi thắng', async () => {
    vi.mocked(api.makeGuess).mockResolvedValue({
      ...base,
      attempt: 1,
      correct: true,
      gameOver: true,
      score: 100,
      answer: 'M ÈO',
      definition: 'Nghĩa thứ nhất.\nNghĩa thứ hai.',
      cells: [
        { index: 0, letter: 'M', color: 'GREEN', label: '' },
        { index: 1, letter: 'È', color: 'GREEN', label: '' },
        { index: 2, letter: 'O', color: 'GREEN', label: '' },
      ],
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('grid');
    await user.keyboard('mèo{Enter}');

    // Gửi cả cụm có dấu, tách theo tiếng (fixture: 1 + 2 chữ)
    expect(api.makeGuess).toHaveBeenCalledWith({ gameId: 1, guess: 'M ÈO' });
    // Không có ván dở -> bắt đầu ván mới và lưu gameId; thắng xong thì xóa
    expect(api.startGame).toHaveBeenCalled();
    expect(await screen.findByText('Chính xác!')).toBeInTheDocument();
    expect(localStorage.getItem('gw.currentGame')).toBeNull();
    // Hiện giải nghĩa kèm nguồn
    expect(screen.getByRole('heading', { name: /Giải nghĩa: m èo/ })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      expect.arrayContaining(['Nghĩa thứ nhất.', 'Nghĩa thứ hai.']),
    );
    expect(screen.getByRole('link', { name: /Wiktionary tiếng Việt/ })).toHaveAttribute(
      'href',
      'https://vi.wiktionary.org/wiki/m_%C3%A8o',
    );
    const firstRow = screen.getAllByRole('row')[0];
    expect(within(firstRow).getByLabelText('M: đúng chữ, đúng dấu, đúng vị trí')).toHaveClass('tile-green');
    expect(screen.getByRole('button', { name: /Màn tiếp theo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đổi từ khác' })).toBeEnabled();
  });

  it('hiện lỗi và cho thử lại khi không bắt đầu được ván', async () => {
    vi.mocked(api.startGame).mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể bắt đầu ván chơi.');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('grid')).toBeInTheDocument();
  });
});
