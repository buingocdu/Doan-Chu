import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Crown, Hourglass, Send } from 'lucide-react';
import { getErrorMessage } from '../../../services/api';
import type { MatchState } from '../../../types/api';
import { useNow } from '../hooks/useNow';
import { msLeft, nextPlayerId, timeLevel } from '../utils/roomState';

interface WordChainProps {
  match: MatchState;
  myId: number;
  clockOffset: number;
  onPlay: (word: string) => Promise<void>;
}

const REASON_LABELS: Record<string, string> = {
  TIMEOUT: 'hết giờ',
  INVALID_WORD: 'từ không có trong từ điển',
  USED_WORD: 'từ đã dùng',
  LEFT: 'rời phòng',
};

/** Server cũ chưa gửi turnSeconds */
const DEFAULT_TURN_SECONDS = 30;

// Nối từ: tiếng đầu được điền sẵn (tiếng cuối của từ trước), người chơi chỉ gõ tiếng thứ hai
export default function WordChain({ match, myId, clockOffset, onPlay }: WordChainProps) {
  const [second, setSecond] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const playing = match.status === 'PLAYING';
  const chain = match.chain ?? [];
  const required = match.requiredSyllable ?? '';
  const myTurn = playing && match.currentUserId === myId;
  const current = match.players.find((p) => p.userId === match.currentUserId);
  const me = match.players.find((p) => p.userId === myId);
  const nextId = playing ? nextPlayerId(match.players, match.currentUserId) : null;
  const next = match.players.find((p) => p.userId === nextId);

  // Đồng hồ lượt: thanh thời gian và vòng quanh avatar người đang chơi
  const now = useNow(200, playing);
  const total = (match.turnSeconds ?? DEFAULT_TURN_SECONDS) * 1000;
  const left = playing ? msLeft(match.turnDeadline, clockOffset, now) : 0;
  const seconds = Math.ceil(left / 1000);
  const fraction = Math.min(1, left / total);
  const level = timeLevel(seconds);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chain.length]);

  // Tới lượt mình: xóa ô nhập và focus
  useEffect(() => {
    if (myTurn) {
      setSecond('');
      setError(null);
      inputRef.current?.focus();
    }
  }, [myTurn, required]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const word = second.trim();
    if (!myTurn || busy) return;
    if (!word || word.includes(' ')) {
      setError('Hãy gõ đúng một tiếng.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onPlay(`${required} ${word}`);
      setSecond('');
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi được từ.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chain">
      <ol className="chain-seats" aria-label="Thứ tự lượt chơi">
        {match.players.map((p, i) => {
          const isTurn = playing && p.userId === match.currentUserId;
          const isNext = p.userId === nextId && !isTurn;
          const status = p.eliminated
            ? `Bị loại · ${REASON_LABELS[p.eliminatedReason ?? ''] ?? ''}`
            : isTurn
              ? `Đang chơi · ${seconds}s`
              : isNext
                ? 'Tiếp theo'
                : p.userId === match.winnerId
                  ? 'Thắng'
                  : '';
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
                <span className="chain-avatar-inner">
                  {p.userId === match.winnerId ? <Crown size={16} /> : i + 1}
                </span>
              </span>
              <span className="chain-seat-text">
                <span className="chain-seat-name">
                  {p.username}
                  {p.userId === myId && ' (bạn)'}
                </span>
                {status && <span className="chain-seat-status">{status}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <ol className="chain-list card" ref={listRef} aria-label="Chuỗi từ">
        {chain.map((w, i) => (
          <li key={i} className={`chain-word${w.userId === myId ? ' chain-word-mine' : ''}`}>
            <strong>{w.word}</strong>
            <span className="muted">{w.userId === null ? 'Từ mở đầu' : w.username}</span>
          </li>
        ))}
      </ol>

      {playing ? (
        <div className={`chain-turn card${myTurn ? ' chain-turn-mine' : ''}`}>
          <div className="chain-turn-head">
            <p className="chain-turn-label" aria-live="polite">
              {myTurn ? 'Tới lượt bạn!' : current ? `Lượt của ${current.username}` : ''}
            </p>
            <span className={`chain-clock chain-clock-${level}`} role="timer" aria-label={`Còn ${seconds} giây`}>
              <Hourglass size={18} aria-hidden="true" />
              {seconds}s
            </span>
          </div>
          <div className={`chain-timebar chain-timebar-${level}`} aria-hidden="true">
            <span style={{ transform: `scaleX(${fraction})` }} />
          </div>

          {myTurn ? (
            <form className="chain-form" onSubmit={handleSubmit}>
              <span className="chain-prefix" aria-hidden="true">
                {required}
              </span>
              <input
                ref={inputRef}
                className="chain-input"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={second}
                onChange={(e) => {
                  setSecond(e.target.value);
                  setError(null);
                }}
                readOnly={busy}
                placeholder="tiếng tiếp theo"
                aria-label={`Từ bắt đầu bằng "${required}", gõ tiếng thứ hai`}
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                <Send size={18} aria-hidden="true" />
                <span>Nối</span>
              </button>
            </form>
          ) : (
            <p className="muted chain-wait">
              {me?.eliminated
                ? 'Bạn đã bị loại, hãy xem mọi người chơi tiếp.'
                : me
                  ? `Từ tiếp theo phải bắt đầu bằng "${required}".`
                  : 'Bạn đang xem ván này, sẽ được chơi từ ván sau.'}
              {next && (
                <>
                  {' '}
                  Tiếp theo: <strong>{next.userId === myId ? 'bạn' : next.username}</strong>.
                </>
              )}
            </p>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {myTurn && <p className="muted chain-hint">Gõ sai (từ không có trong từ điển hoặc đã dùng) sẽ bị loại.</p>}
        </div>
      ) : (
        <div className={`match-result card${match.winnerId === myId ? ' match-won' : ''}`} role="status">
          <p className="match-result-title">
            <Crown size={20} aria-hidden="true" />
            {match.winnerId === myId ? 'Bạn thắng!' : match.winnerName ? `${match.winnerName} thắng!` : 'Ván kết thúc.'}
          </p>
          <p className="muted">Chuỗi dài {chain.length} từ.</p>
        </div>
      )}
    </div>
  );
}
