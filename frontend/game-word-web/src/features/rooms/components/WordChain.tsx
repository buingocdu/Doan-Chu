import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Crown, Send } from 'lucide-react';
import { getErrorMessage } from '../../../services/api';
import type { MatchState } from '../../../types/api';
import Countdown from './Countdown';

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
      <ul className="chain-players" aria-label="Người chơi">
        {match.players.map((p) => (
          <li
            key={p.userId}
            className={`chain-player${p.userId === match.currentUserId ? ' chain-player-turn' : ''}${
              p.eliminated ? ' chain-player-out' : ''
            }`}
            title={p.eliminated ? `Bị loại: ${REASON_LABELS[p.eliminatedReason ?? ''] ?? ''}` : undefined}
          >
            {p.userId === match.winnerId && <Crown size={14} aria-label="Người thắng" />}
            {p.username}
            {p.userId === myId && ' (bạn)'}
          </li>
        ))}
      </ul>

      <ol className="chain-list card" ref={listRef} aria-label="Chuỗi từ">
        {chain.map((w, i) => (
          <li key={i} className={`chain-word${w.userId === myId ? ' chain-word-mine' : ''}`}>
            <strong>{w.word}</strong>
            <span className="muted">{w.userId === null ? 'Từ mở đầu' : w.username}</span>
          </li>
        ))}
      </ol>

      {playing ? (
        <div className="chain-turn">
          <p className="chain-turn-label">
            {myTurn ? 'Tới lượt bạn!' : current ? `Lượt của ${current.username}` : ''}
            <Countdown deadline={match.turnDeadline} clockOffset={clockOffset} />
          </p>
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
            <p className="muted">
              {me?.eliminated
                ? 'Bạn đã bị loại, hãy xem mọi người chơi tiếp.'
                : me
                  ? `Từ tiếp theo phải bắt đầu bằng "${required}".`
                  : 'Bạn đang xem ván này, sẽ được chơi từ ván sau.'}
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
