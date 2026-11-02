import type { CSSProperties } from 'react';
import type { MatchPlayer } from '../../../types/api';
import { nextPlayerId } from '../utils/roomState';

interface TurnSeatsProps {
  players: MatchPlayer[];
  currentUserId: number | null;
  myId: number;
  /** Giây còn lại của lượt hiện tại */
  seconds: number;
  /** Phần thời gian lượt còn lại (0..1), vẽ vòng quanh avatar */
  fraction: number;
  level: 'ok' | 'warn' | 'danger';
}

// Đoán lần lượt: thứ tự người đoán, người đang tới lượt có vòng thời gian (dùng chung style với Nối từ)
export default function TurnSeats({ players, currentUserId, myId, seconds, fraction, level }: TurnSeatsProps) {
  const nextId = nextPlayerId(players, currentUserId);
  return (
    <ol className="chain-seats" aria-label="Thứ tự lượt đoán">
      {players.map((p, i) => {
        const isTurn = p.userId === currentUserId;
        const isNext = p.userId === nextId && !isTurn;
        const status = p.eliminated
          ? 'Rời phòng'
          : isTurn
            ? `Đang đoán · ${seconds}s`
            : isNext
              ? 'Tiếp theo'
              : `${p.attempts} lượt đã đoán`;
        return (
          <li
            key={p.userId}
            className={`chain-seat${isTurn ? ` chain-seat-turn chain-seat-${level}` : ''}${
              isNext ? ' chain-seat-next' : ''
            }${p.eliminated ? ' chain-seat-out' : ''}${p.userId === myId ? ' chain-seat-me' : ''}`}
            aria-current={isTurn ? 'step' : undefined}
          >
            <span
              className="chain-avatar"
              style={isTurn ? ({ '--p': fraction } as CSSProperties) : undefined}
              aria-hidden="true"
            >
              <span className="chain-avatar-inner">{i + 1}</span>
            </span>
            <span className="chain-seat-text">
              <span className="chain-seat-name">
                {p.username}
                {p.userId === myId && ' (bạn)'}
              </span>
              <span className="chain-seat-status">{status}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
