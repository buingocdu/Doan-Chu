import type { CellColor, CellResult, GameStateResponse, GuessResponse } from '../../../types/api';

export type GameStatus = 'loading' | 'error' | 'playing' | 'submitting' | 'won' | 'lost';

export interface GameState {
  status: GameStatus;
  gameId: number | null;
  wordId: number | null;
  wordLength: number;
  partLengths: number[];
  maxAttempts: number;
  /** Kết quả các hàng đã gửi; letter giữ dấu theo chữ người chơi gõ (backend trả về) */
  rows: CellResult[][];
  /** Chuỗi người dùng gõ trong ô nhập, KHÔNG bao giờ bị sửa khi đang gõ để bộ gõ tiếng Việt (Unikey/Telex) không nhảy chữ */
  input: string;
  /** Chữ cái A-Z tách từ input, dùng để điền vào ô và gửi lên server */
  current: string;
  /** Chữ hiển thị của hàng đang nhập, cùng độ dài với current */
  display: string[];
  notice: string | null;
  score: number | null;
  answer: string | null;
}

export type GameAction =
  | { type: 'start_request' }
  | { type: 'start_success'; response: GuessResponse }
  | { type: 'restore_success'; game: GameStateResponse }
  | { type: 'start_failure'; message: string }
  | { type: 'type_letter'; letter: string }
  | { type: 'backspace' }
  | { type: 'set_input'; value: string }
  | { type: 'submit_request' }
  | { type: 'submit_success'; response: GuessResponse }
  | { type: 'submit_failure'; message: string }
  | { type: 'notice'; message: string | null };

export const LETTER_PATTERN = /^[A-Z]$/;

export const initialGameState: GameState = {
  status: 'loading',
  gameId: null,
  wordId: null,
  wordLength: 0,
  partLengths: [],
  maxAttempts: 0,
  rows: [],
  input: '',
  current: '',
  display: [],
  notice: null,
  score: null,
  answer: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start_request':
      return { ...initialGameState };
    case 'start_success': {
      const r = action.response;
      return {
        ...initialGameState,
        status: 'playing',
        gameId: r.gameId,
        wordId: r.wordId,
        wordLength: r.wordLength,
        partLengths: normalizeParts(r.partLengths, r.wordLength),
        maxAttempts: r.maxAttempts,
      };
    }
    case 'restore_success': {
      const g = action.game;
      return {
        ...initialGameState,
        status: 'playing',
        gameId: g.gameId,
        wordId: g.wordId,
        wordLength: g.wordLength,
        partLengths: normalizeParts(g.partLengths, g.wordLength),
        maxAttempts: g.maxAttempts,
        rows: g.rows,
      };
    }
    case 'start_failure':
      return { ...initialGameState, status: 'error', notice: action.message };
    case 'type_letter':
      if (state.status !== 'playing' || state.current.length >= state.wordLength) return state;
      if (!LETTER_PATTERN.test(action.letter)) return state;
      return withDisplay(state, [...state.display, action.letter]);
    case 'set_input': {
      if (state.status !== 'playing') return state;
      // Giữ nguyên chuỗi gõ; chữ thừa chỉ bị cảnh báo khi gửi (cắt chữ sẽ làm bộ gõ gõ đè sai chỗ)
      const display = toDisplayLetters(action.value).slice(0, state.wordLength);
      return { ...state, input: action.value, display, current: toGuessLetters(display.join('')), notice: null };
    }
    case 'backspace':
      if (state.status !== 'playing') return state;
      return withDisplay(state, state.display.slice(0, -1));
    case 'submit_request':
      return { ...state, status: 'submitting', notice: null };
    case 'submit_success': {
      const r = action.response;
      const submitted = r.cells.length > 0;
      const rows = submitted ? [...state.rows, r.cells] : state.rows;
      const status: GameStatus = r.gameOver ? (r.correct ? 'won' : 'lost') : 'playing';
      return {
        ...state,
        status,
        rows,
        input: '',
        current: '',
        display: [],
        maxAttempts: r.maxAttempts,
        score: r.score,
        answer: r.answer,
      };
    }
    case 'submit_failure':
      // Giữ lại chữ đã nhập để người chơi sửa và gửi lại
      return { ...state, status: 'playing', notice: action.message };
    case 'notice':
      return { ...state, notice: action.message };
  }
}

// Cập nhật từ bàn phím ảo / bàn phím thật: dựng lại ô nhập từ các chữ hiển thị
function withDisplay(state: GameState, display: string[]): GameState {
  return {
    ...state,
    display,
    current: toGuessLetters(display.join('')),
    input: formatGuess(display.join(''), state.partLengths),
    notice: null,
  };
}

// Tách chuỗi gõ thành từng chữ in hoa, giữ dấu tiếng Việt: "Tiếng anh" -> ['T','I','Ế','N','G','A','N','H']
export function toDisplayLetters(raw: string): string[] {
  const letters: string[] = [];
  for (const ch of raw.normalize('NFC')) {
    if (toGuessLetters(ch).length === 1) letters.push(ch.toUpperCase());
  }
  return letters;
}

// Chuyển chữ người dùng gõ (có thể có dấu, khoảng trắng) thành chữ in hoa A-Z không dấu
export function toGuessLetters(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

// Độ dài các tiếng hợp lệ (tổng bằng wordLength); nếu không thì coi cả từ là một khối
export function normalizeParts(parts: number[] | null | undefined, wordLength: number): number[] {
  const valid = Array.isArray(parts) && parts.length > 0 && parts.every((n) => n > 0);
  return valid && parts.reduce((a, b) => a + b, 0) === wordLength ? parts : [wordLength];
}

// Tổng số chữ cái trong chuỗi gõ (kể cả phần thừa)
export function countLetters(raw: string): number {
  return toGuessLetters(raw).length;
}

// Thêm khoảng trắng giữa các tiếng: VUIMU -> "VUI MU"
export function formatGuess(letters: string, parts: number[]): string {
  const chunks: string[] = [];
  let start = 0;
  for (const len of parts) {
    if (start >= letters.length) break;
    chunks.push(letters.slice(start, start + len));
    start += len;
  }
  return chunks.join(' ');
}

export const COLOR_LABELS: Record<CellColor, string> = {
  GREEN: 'đúng chữ, đúng dấu, đúng vị trí',
  BLUE: 'đúng chữ, đúng vị trí nhưng sai dấu',
  YELLOW: 'có trong từ nhưng sai vị trí',
  BLACK: 'không có trong từ',
};
