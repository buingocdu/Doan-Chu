import { describe, expect, it } from 'vitest';
import type { GameHistory } from '../../../types/api';
import { groupHistory } from './groupHistory';

const row = (over: Partial<GameHistory>): GameHistory => ({
  id: 1,
  gameId: 1,
  userId: 1,
  wordId: 5,
  guess: '',
  result: '',
  attempt: 0,
  correct: false,
  playedAt: '2026-10-24T10:00:00',
  ...over,
});

describe('groupHistory', () => {
  it('gom lượt theo ván, bỏ bản ghi bắt đầu ván và sắp ván mới nhất lên đầu', () => {
    const games = groupHistory([
      row({ id: 1, gameId: 1 }),
      row({ id: 2, gameId: 1, attempt: 2, guess: 'MEO', result: 'GREEN,GREEN,GREEN', correct: true, playedAt: '2026-10-24T10:02:00' }),
      row({ id: 3, gameId: 1, attempt: 1, guess: 'MAO', result: 'GREEN,BLACK,GREEN', playedAt: '2026-10-24T10:01:00' }),
      row({ id: 4, gameId: 4 }),
      row({ id: 5, gameId: 4, attempt: 1, guess: 'XYZ', result: 'BLACK,BLACK,BLACK', playedAt: '2026-10-24T11:00:00' }),
    ]);
    expect(games.map((g) => g.key)).toEqual([4, 1]);
    expect(games[1]).toMatchObject({ won: true, answer: 'MEO' });
    expect(games[1].guesses.map((g) => g.guess)).toEqual(['MAO', 'MEO']);
    expect(games[0]).toMatchObject({ won: false, answer: null });
  });
});
