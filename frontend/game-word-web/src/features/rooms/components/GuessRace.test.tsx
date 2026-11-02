import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CellResult, MatchState } from '../../../types/api';
import GuessRace from './GuessRace';

const player = (userId: number, username: string, attempts = 0) => ({
  userId,
  username,
  eliminated: false,
  eliminatedReason: null,
  attempts,
  solved: false,
});

const row = (word: string): CellResult[] => [...word].map((letter, index) => ({ index, letter, color: 'BLACK', label: 'sai' }));

const turnMatch = (overrides: Partial<MatchState> = {}): MatchState => ({
  id: 7,
  gameType: 'WORD_GUESS',
  status: 'PLAYING',
  startedAt: 0,
  players: [player(1, 'an', 1), player(2, 'binh', 1), player(3, 'chi')],
  endsAt: Date.now() + 300_000,
  wordLength: 4,
  partLengths: [2, 2],
  maxAttempts: 20,
  myRows: [row('XYZW'), row('ABCD')],
  turnBased: true,
  rowAuthors: ['an', 'binh'],
  currentUserId: 3,
  turnDeadline: Date.now() + 18_000,
  turnSeconds: 30,
  ...overrides,
});

describe('GuessRace lần lượt', () => {
  it('hiện bảng chung, người tới lượt và số lượt chung đã dùng', () => {
    render(<GuessRace match={turnMatch()} myId={1} clockOffset={0} onGuess={vi.fn()} />);
    expect(screen.getByText('Lượt của chi')).toBeInTheDocument();
    expect(screen.getByRole('timer', { name: 'Còn 18 giây' })).toHaveTextContent('18s');
    expect(screen.getByText(/Đã dùng 2\/20 lượt chung/)).toBeInTheDocument();
    // Bảng chung chỉ hiện tới hàng đang nhập (tối thiểu 6), mỗi hàng ghi người đoán
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.getByRole('row', { name: 'Lượt 2: binh' })).toBeInTheDocument();
    // Không phải lượt mình: không có ô nhập, không có bảng đối thủ
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Đối thủ')).not.toBeInTheDocument();
  });

  it('kết thúc có người đoán ra thì cả phòng cùng thắng', () => {
    const finished = turnMatch({ status: 'FINISHED', winnerId: 2, winnerName: 'binh', answer: 'AB CD' });
    render(<GuessRace match={finished} myId={1} clockOffset={0} onGuess={vi.fn()} />);
    expect(screen.getByText('Cả phòng thắng! binh đoán ra ở lượt 2/20.')).toBeInTheDocument();
  });
});
