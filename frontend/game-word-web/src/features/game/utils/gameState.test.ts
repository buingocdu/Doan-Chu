import { describe, expect, it } from 'vitest';
import type { CellResult, GuessResponse } from '../../../types/api';
import {
  formatGuess,
  countLetters,
  gameReducer,
  initialGameState,
  normalizeParts,
  toDisplayLetters,
  toGuessLetters,
  type GameState,
} from './gameState';

const startResponse: GuessResponse = {
  gameId: 7,
  wordId: 3,
  wordLength: 3,
  partLengths: [1, 2],
  guess: '',
  attempt: 0,
  maxAttempts: 10,
  correct: false,
  gameOver: false,
  cells: [],
  score: null,
  message: '',
  answer: null,
};

const cells = (word: string, colors: CellResult['color'][]): CellResult[] =>
  colors.map((color, index) => ({ index, letter: word[index], color, label: '' }));

const playing = (): GameState => gameReducer(initialGameState, { type: 'start_success', response: startResponse });

describe('gameReducer', () => {
  it('bắt đầu ván với thông tin từ response', () => {
    const s = playing();
    expect(s).toMatchObject({ status: 'playing', gameId: 7, wordLength: 3, partLengths: [1, 2], maxAttempts: 10, rows: [] });
  });

  it('chỉ nhận chữ A-Z và không vượt quá độ dài từ', () => {
    let s = playing();
    for (const ch of ['A', '1', 'b', 'B', 'C', 'D']) s = gameReducer(s, { type: 'type_letter', letter: ch });
    expect(s.current).toBe('ABC');
    s = gameReducer(s, { type: 'backspace' });
    expect(s.current).toBe('AB');
  });

  it('thêm hàng kết quả và chuyển sang thắng khi đoán đúng', () => {
    const s = gameReducer(
      { ...playing(), current: 'MEO', status: 'submitting' },
      {
        type: 'submit_success',
        response: {
          ...startResponse,
          attempt: 1,
          correct: true,
          gameOver: true,
          score: 100,
          answer: 'MEO',
          cells: cells('MEO', ['GREEN', 'GREEN', 'GREEN']),
        },
      },
    );
    expect(s.status).toBe('won');
    expect(s.rows).toHaveLength(1);
    expect(s.current).toBe('');
    expect(s.score).toBe(100);
  });

  it('giữ chữ đã nhập khi gửi thất bại', () => {
    const s = gameReducer({ ...playing(), current: 'ABC', status: 'submitting' }, { type: 'submit_failure', message: 'lỗi' });
    expect(s).toMatchObject({ status: 'playing', current: 'ABC', notice: 'lỗi' });
  });

  it('không nhận phím khi ván đã kết thúc', () => {
    const s = gameReducer({ ...playing(), status: 'lost' }, { type: 'type_letter', letter: 'A' });
    expect(s.current).toBe('');
  });
});

describe('ô nhập liệu', () => {
  it('bỏ dấu, khoảng trắng, ký tự lạ và viết hoa', () => {
    expect(toGuessLetters('vui mừng')).toBe('VUIMUNG');
    expect(toGuessLetters('Điện thoại!')).toBe('DIENTHOAI');
  });

  it('giữ nguyên chuỗi gõ; ô hiển thị chữ có dấu, chữ gửi đi không dấu', () => {
    const s = gameReducer(playing(), { type: 'set_input', value: 'mè' });
    expect(s).toMatchObject({ input: 'mè', current: 'ME', display: ['M', 'È'] });
  });

  it('hàng đã gửi dùng chữ có dấu do backend trả về; ô nhập được xóa', () => {
    const typed = gameReducer(playing(), { type: 'set_input', value: 'mèo' });
    const s = gameReducer(
      { ...typed, status: 'submitting' },
      { type: 'submit_success', response: { ...startResponse, attempt: 1, cells: cells('MÈO', ['GREEN', 'BLACK', 'GREEN']) } },
    );
    expect(s.rows[0].map((c) => c.letter)).toEqual(['M', 'È', 'O']);
    expect(s).toMatchObject({ input: '', display: [], current: '' });
  });

  it('tách chữ hiển thị giữ dấu', () => {
    expect(toDisplayLetters('Tiếng anh')).toEqual(['T', 'I', 'Ế', 'N', 'G', 'A', 'N', 'H']);
    expect(toDisplayLetters('đường')).toEqual(['Đ', 'Ư', 'Ờ', 'N', 'G']);
  });

  it('không bao giờ sửa chuỗi gõ (tránh nhảy chữ với Unikey/Telex); ô chỉ lấy đủ số chữ', () => {
    // Telex tạm thời có thể dài hơn chữ cuối cùng ("phoo" trước khi thành "phô")
    const s = gameReducer(playing(), { type: 'set_input', value: 'phoo' });
    expect(s).toMatchObject({ input: 'phoo', current: 'PHO', display: ['P', 'H', 'O'] });
    expect(countLetters(s.input)).toBe(4);
  });

  it('bàn phím ảo dựng lại ô nhập theo các tiếng', () => {
    let s = playing();
    for (const ch of ['M', 'E', 'O']) s = gameReducer(s, { type: 'type_letter', letter: ch });
    expect(s.input).toBe('M EO');
    s = gameReducer(s, { type: 'backspace' });
    expect(s).toMatchObject({ input: 'M E', current: 'ME' });
  });

  it('chèn khoảng trắng giữa các tiếng khi hiển thị', () => {
    expect(formatGuess('VUIMUNG', [3, 4])).toBe('VUI MUNG');
    expect(formatGuess('VUIM', [3, 4])).toBe('VUI M');
    expect(formatGuess('VU', [3, 4])).toBe('VU');
  });

  it('dùng một khối khi partLengths không khớp độ dài từ', () => {
    expect(normalizeParts([3, 4], 7)).toEqual([3, 4]);
    expect(normalizeParts([3, 3], 7)).toEqual([7]);
    expect(normalizeParts(undefined, 5)).toEqual([5]);
  });
});
