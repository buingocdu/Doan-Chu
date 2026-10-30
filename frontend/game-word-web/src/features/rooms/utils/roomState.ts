import type { ChatMessage, GameType, MatchState, RoomMember, RoomState, RoomStatus } from '../../../types/api';

/** Số tin nhắn tối đa giữ trên client */
const MAX_MESSAGES = 200;

export interface RoomView {
  code: string;
  version: number;
  status: RoomStatus;
  gameType: GameType;
  hostId: number;
  members: RoomMember[];
  match: MatchState | null;
  messages: ChatMessage[];
  /** Giờ server - giờ máy (ms), để đếm ngược theo giờ server */
  clockOffset: number;
}

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  WORD_GUESS: 'Đua đoán chữ',
  WORD_CHAIN: 'Nối từ',
};

// Nối tin mới vào cuối, bỏ trùng id (response của thao tác và của polling có thể chồng nhau)
export function appendMessages(prev: ChatMessage[], next: ChatMessage[]): ChatMessage[] {
  if (next.length === 0) return prev;
  const seen = new Set(prev.map((m) => m.id));
  const merged = [...prev, ...next.filter((m) => !seen.has(m.id))].sort((a, b) => a.id - b.id);
  return merged.length > MAX_MESSAGES ? merged.slice(merged.length - MAX_MESSAGES) : merged;
}

// Gộp response vào trạng thái hiện có. Bỏ qua response cũ hơn (đến trễ) và response "không đổi".
export function mergeRoomState(prev: RoomView | null, next: RoomState, now = Date.now()): RoomView | null {
  const clockOffset = next.serverTime - now;
  if (prev && next.version < prev.version) return prev;
  if (!next.changed || !next.code || !next.status || !next.gameType || next.hostId === undefined) {
    return prev ? { ...prev, clockOffset } : prev;
  }
  return {
    code: next.code,
    version: next.version,
    status: next.status,
    gameType: next.gameType,
    hostId: next.hostId,
    members: next.members ?? [],
    match: next.match ?? null,
    messages: appendMessages(prev?.messages ?? [], next.messages ?? []),
    clockOffset,
  };
}

export function lastMessageId(view: RoomView | null): number | null {
  if (!view || view.messages.length === 0) return null;
  return view.messages[view.messages.length - 1].id;
}

// Giây còn lại tới hạn chót (giờ server)
export function secondsLeft(deadline: number | null | undefined, clockOffset: number, now = Date.now()): number {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - (now + clockOffset)) / 1000));
}
