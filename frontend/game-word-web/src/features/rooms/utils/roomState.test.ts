import { describe, expect, it } from 'vitest';
import type { ChatMessage, RoomState } from '../../../types/api';
import { appendMessages, lastMessageId, mergeRoomState, secondsLeft } from './roomState';

const msg = (id: number): ChatMessage => ({
  id,
  type: 'TEXT',
  senderId: 1,
  senderName: 'an',
  content: `m${id}`,
  createdAt: id,
});

const full = (version: number, messages: ChatMessage[]): RoomState => ({
  version,
  changed: true,
  serverTime: 10_000,
  code: 'ABC234',
  status: 'WAITING',
  gameType: 'WORD_GUESS',
  hostId: 1,
  members: [{ userId: 1, username: 'an', host: true }],
  match: null,
  messages,
});

describe('appendMessages', () => {
  it('nối tin mới, bỏ trùng và giữ thứ tự id', () => {
    expect(appendMessages([msg(1), msg(2)], [msg(2), msg(4), msg(3)]).map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });
});

describe('mergeRoomState', () => {
  it('gộp tin nhắn qua các lần poll và tính độ lệch đồng hồ', () => {
    const first = mergeRoomState(null, full(1, [msg(1)]), 9_000);
    expect(first?.clockOffset).toBe(1_000);
    const second = mergeRoomState(first, full(2, [msg(2)]), 9_500);
    expect(second?.messages.map((m) => m.id)).toEqual([1, 2]);
    expect(lastMessageId(second)).toBe(2);
  });

  it('giữ nguyên khi server báo không đổi hoặc response đến trễ', () => {
    const view = mergeRoomState(null, full(5, [msg(1)]), 10_000);
    const unchanged = mergeRoomState(view, { version: 5, changed: false, serverTime: 12_000 }, 10_000);
    expect(unchanged?.messages).toBe(view?.messages);
    expect(unchanged?.clockOffset).toBe(2_000);
    expect(mergeRoomState(view, full(4, [msg(9)]))).toBe(view);
  });
});

describe('secondsLeft', () => {
  it('đếm theo giờ server, không âm', () => {
    expect(secondsLeft(20_000, 1_000, 9_000)).toBe(10);
    expect(secondsLeft(20_000, 0, 30_000)).toBe(0);
    expect(secondsLeft(null, 0)).toBe(0);
  });
});
