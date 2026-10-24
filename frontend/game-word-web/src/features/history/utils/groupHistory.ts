import type { CellColor, GameHistory } from '../../../types/api';
import { toDisplayLetters } from '../../game/utils/gameState';

export interface GameSummary {
  key: number;
  playedAt: string | null;
  guesses: { guess: string; letters: string[]; colors: CellColor[] }[];
  won: boolean;
  answer: string | null;
}

const COLORS: CellColor[] = ['GREEN', 'YELLOW', 'BLUE', 'BLACK'];
const isColor = (value: string): value is CellColor => (COLORS as string[]).includes(value);

// Gom các lượt đoán (attempt > 0) theo ván; bản ghi attempt = 0 chỉ đánh dấu bắt đầu ván
export function groupHistory(items: GameHistory[]): GameSummary[] {
  const games = new Map<number, GameHistory[]>();
  for (const item of items) {
    if (item.attempt <= 0) continue;
    const key = item.gameId ?? -item.id;
    const list = games.get(key) ?? [];
    list.push(item);
    games.set(key, list);
  }

  const summaries: GameSummary[] = [];
  for (const [key, list] of games) {
    list.sort((a, b) => a.attempt - b.attempt);
    const winning = list.find((h) => h.correct);
    summaries.push({
      key,
      playedAt: list[list.length - 1].playedAt,
      guesses: list.map((h) => ({
        guess: h.guess,
        // guess có thể là cụm có dấu cách ("TIẾNG ANH"): tách chữ cái để khớp với từng màu
        letters: toDisplayLetters(h.guess),
        colors: h.result.split(',').filter(isColor),
      })),
      won: winning !== undefined,
      answer: winning?.guess ?? null,
    });
  }
  return summaries.sort((a, b) => (b.playedAt ?? '').localeCompare(a.playedAt ?? ''));
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
