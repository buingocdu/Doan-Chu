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
  /** Giải nghĩa đáp án (Wiktionary), chỉ có khi gameOver; nhiều nghĩa cách nhau bởi xuống dòng */
  definition?: string | null;
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
  /** Tên tài khoản hoặc email */
  username: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
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

// ===== Phase 2: phòng chơi, chat, bạn bè (DOC-007) =====

export type GameType = 'WORD_GUESS' | 'WORD_CHAIN';
export type RoomStatus = 'WAITING' | 'PLAYING' | 'CLOSED';
export type MessageType = 'TEXT' | 'SYSTEM' | 'ROOM_INVITE';

export interface ChatMessage {
  id: number;
  type: MessageType;
  /** null với tin hệ thống */
  senderId: number | null;
  senderName: string | null;
  recipientId?: number | null;
  /** ROOM_INVITE: mã phòng */
  content: string;
  /** epoch ms */
  createdAt: number;
}

export interface RoomMember {
  userId: number;
  username: string;
  host: boolean;
}

export interface MatchPlayer {
  userId: number;
  username: string;
  eliminated: boolean;
  eliminatedReason: string | null;
  attempts: number;
  solved: boolean;
  /** Đua đoán chữ: màu từng lượt của người chơi (không có chữ) */
  colorRows?: CellColor[][] | null;
}

export interface ChainWord {
  /** null = từ mở đầu do server đưa ra */
  userId: number | null;
  username: string | null;
  word: string;
}

export interface MatchState {
  id: number;
  gameType: GameType;
  status: 'PLAYING' | 'FINISHED';
  winnerId?: number | null;
  winnerName?: string | null;
  startedAt: number;
  players: MatchPlayer[];
  // Đua đoán chữ
  endsAt?: number;
  wordLength?: number;
  partLengths?: number[];
  maxAttempts?: number;
  myRows?: CellResult[][];
  answer?: string | null;
  definition?: string | null;
  // Nối từ
  currentUserId?: number | null;
  turnDeadline?: number | null;
  requiredSyllable?: string | null;
  chain?: ChainWord[];
}

/** changed = false: phòng không đổi so với version đã gửi, chỉ có version + serverTime */
export interface RoomState {
  version: number;
  changed: boolean;
  serverTime: number;
  code?: string;
  status?: RoomStatus;
  gameType?: GameType;
  hostId?: number;
  members?: RoomMember[];
  match?: MatchState | null;
  messages?: ChatMessage[];
}

export interface RoomSummary {
  code: string;
  status: RoomStatus;
  gameType: GameType;
  hostId: number;
  hostName: string;
  memberCount: number;
  updatedAt: number;
}

export interface Friend {
  userId: number;
  username: string;
  unread: number;
}

export interface FriendList {
  friends: Friend[];
  incoming: Friend[];
  outgoing: Friend[];
}

export interface FriendSummary {
  pendingRequests: number;
  unreadMessages: number;
}

export type FriendRelation = 'NONE' | 'FRIEND' | 'INCOMING' | 'OUTGOING';

export interface UserSearchResult {
  userId: number;
  username: string;
  relation: FriendRelation;
}
