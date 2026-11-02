import { describe, expect, it } from 'vitest';
import type { ChatMessage, RoomState } from '../../../types/api';
import {
  appendMessages,
  lastMessageId,
  mergeRoomState,
  msLeft,
  nextPlayerId,
  secondsLeft,
  timeLevel,
} from './roomState';

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

describe('nextPlayerId', () => {
  const players = [
    { userId: 1, eliminated: false },
    { userId: 2, eliminated: true },
    { userId: 3, eliminated: false },
  ];

  it('bỏ qua người đã bị loại và vòng lại đầu danh sách', () => {
    expect(nextPlayerId(players, 1)).toBe(3);
    expect(nextPlayerId(players, 3)).toBe(1);
  });

  it('không có lượt hiện tại thì không có người kế tiếp', () => {
    expect(nextPlayerId(players, null)).toBeNull();
    expect(nextPlayerId([{ userId: 1, eliminated: false }], 1)).toBeNull();
  });
});

describe('msLeft và timeLevel', () => {
  it('tính theo giờ server và không âm', () => {
    expect(msLeft(10_000, 500, 4_000)).toBe(5_500);
    expect(msLeft(10_000, 0, 20_000)).toBe(0);
    expect(msLeft(null, 0)).toBe(0);
  });

  it('vàng khi còn 10 giây, đỏ khi còn 5 giây', () => {
    expect(timeLevel(30)).toBe('ok');
    expect(timeLevel(10)).toBe('warn');
    expect(timeLevel(5)).toBe('danger');
  });
});
