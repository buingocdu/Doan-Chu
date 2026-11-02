import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MatchState } from '../../../types/api';
import WordChain from './WordChain';

const player = (userId: number, username: string, eliminated = false) => ({
  userId,
  username,
  eliminated,
  eliminatedReason: eliminated ? 'TIMEOUT' : null,
  attempts: 0,
  solved: false,
});

const match = (currentUserId: number, secondsLeft: number): MatchState => ({
  id: 1,
  gameType: 'WORD_CHAIN',
  status: 'PLAYING',
  startedAt: 0,
  players: [player(1, 'an'), player(2, 'binh', true), player(3, 'chi')],
  currentUserId,
  turnDeadline: Date.now() + secondsLeft * 1000,
  turnSeconds: 30,
  requiredSyllable: 'tính',
  chain: [{ userId: null, username: null, word: 'máy tính' }],
});

describe('WordChain', () => {
  it('hiện lượt của ai, thời gian còn lại và người kế tiếp', () => {
    render(<WordChain match={match(3, 20)} myId={1} clockOffset={0} onPlay={vi.fn()} />);
    expect(screen.getByText('Lượt của chi')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('20s');
    expect(screen.getByText('Đang chơi · 20s')).toBeInTheDocument();
    // binh đã bị loại nên sau chi là an (bạn)
    expect(screen.getByText('Tiếp theo')).toBeInTheDocument();
    expect(screen.getByText('Bị loại · hết giờ')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').find((li) => li.getAttribute('aria-current') === 'step')).toHaveTextContent('chi');
  });

  it('tới lượt mình thì hiện ô nhập và đổi sang màu đỏ khi còn ít giây', () => {
    render(<WordChain match={match(1, 4)} myId={1} clockOffset={0} onPlay={vi.fn()} />);
    expect(screen.getByText('Tới lượt bạn!')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('timer')).toHaveClass('chain-clock-danger');
  });
});
