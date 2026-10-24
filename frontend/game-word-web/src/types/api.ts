// Kiểu dữ liệu khớp với DTO của backend (com.gameword.dto / model). Xem docs/api/api-reference.md

export type CellColor = 'GREEN' | 'YELLOW' | 'BLUE' | 'BLACK';

export interface CellResult {
  index: number;
  letter: string;
  color: CellColor;
  label: string;
}

export interface GuessResponse {
  gameId: number;
  wordId: number;
  wordLength: number;
  /** Số chữ cái của từng tiếng, ví dụ VUIMUNG -> [3, 4] */
  partLengths: number[];
  guess: string;
  attempt: number;
  maxAttempts: number;
  correct: boolean;
  gameOver: boolean;
  cells: CellResult[];
  score: number | null;
  message: string;
  answer: string | null;
}

/** Ván đang chơi dở, trả về từ GET /api/game/current để khôi phục sau khi tải lại trang */
export interface GameStateResponse {
  gameId: number;
  wordId: number;
  wordLength: number;
  partLengths: number[];
  maxAttempts: number;
  attempt: number;
  rows: CellResult[][];
}

export interface GuessRequest {
  gameId: number;
  guess: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  email: string;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  rank: number;
}

export interface GameHistory {
  id: number;
  gameId: number | null;
  userId: number | null;
  wordId: number;
  guess: string;
  result: string;
  attempt: number;
  correct: boolean;
  playedAt: string | null;
}

export interface ApiErrorBody {
  status: number;
  message: string;
  errors?: Record<string, string>;
}
