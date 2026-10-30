import { useEffect, useState } from 'react';
import { CheckCircle2, Crown, XCircle } from 'lucide-react';
import { getErrorMessage } from '../../../services/api';
import type { MatchState } from '../../../types/api';
import GameBoard from '../../game/components/GameBoard';
import GuessInput from '../../game/components/GuessInput';
import { countLetters, formatGuess, normalizeParts, toDisplayLetters } from '../../game/utils/gameState';
import Countdown from './Countdown';
import MiniBoard from './MiniBoard';

interface GuessRaceProps {
  match: MatchState;
  myId: number;
  clockOffset: number;
  onGuess: (guess: string) => Promise<void>;
}

// Đua đoán chữ: bảng của mình (có chữ) + bảng thu nhỏ của đối thủ (chỉ màu)
export default function GuessRace({ match, myId, clockOffset, onGuess }: GuessRaceProps) {
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  const wordLength = match.wordLength ?? 0;
  const partLengths = normalizeParts(match.partLengths, wordLength);
  const maxAttempts = match.maxAttempts ?? 10;
  const myRows = match.myRows ?? [];
  const me = match.players.find((p) => p.userId === myId);
  const playing = match.status === 'PLAYING';
  const canGuess = playing && me !== undefined && !me.eliminated && !me.solved;
  const display = toDisplayLetters(input).slice(0, wordLength);
  const opponents = match.players.filter((p) => p.userId !== myId);

  // Ván mới: xóa ô nhập
  useEffect(() => {
    setInput('');
    setNotice(null);
  }, [match.id]);

  useEffect(() => {
    if (!notice) return;
    setShake(true);
    const timer = window.setTimeout(() => setShake(false), 400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const submit = async () => {
    if (!canGuess || busy) return;
    const total = countLetters(input);
    if (total !== wordLength) {
      setNotice(total > wordLength ? `Thừa ${total - wordLength} chữ cái.` : `Hãy nhập đủ ${wordLength} chữ cái.`);
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await onGuess(formatGuess(display.join(''), partLengths));
      setInput('');
    } catch (error) {
      setNotice(getErrorMessage(error, 'Không gửi được lượt đoán.'));
    } finally {
      setBusy(false);
    }
  };

  let status: string;
  if (!playing) status = '';
  else if (!me) status = 'Bạn đang xem ván này, sẽ được chơi từ ván sau.';
  else if (me.solved) status = 'Bạn đã đoán đúng!';
  else if (me.eliminated) status = 'Bạn đã hết lượt. Chờ người khác…';
  else status = `Còn ${maxAttempts - me.attempts}/${maxAttempts} lượt`;

  return (
    <div className="race">
      <div className="race-head">
        <p className="muted">
          {partLengths.length} tiếng ({partLengths.join(' + ')} chữ){status && ` · ${status}`}
        </p>
        {playing && <Countdown deadline={match.endsAt} clockOffset={clockOffset} warnAt={30} />}
      </div>

      {!playing && (
        <div className={`match-result card${match.winnerId === myId ? ' match-won' : ''}`} role="status">
          <p className="match-result-title">
            <Crown size={20} aria-hidden="true" />
            {match.winnerId === myId
              ? 'Bạn thắng!'
              : match.winnerName
                ? `${match.winnerName} thắng!`
                : 'Không ai đoán ra.'}
          </p>
          {match.answer && (
            <p>
              Đáp án: <strong>{match.answer}</strong>
            </p>
          )}
          {match.definition && <p className="muted definition-text">{match.definition.split('\n')[0]}</p>}
        </div>
      )}

      <GameBoard
        rows={myRows}
        current={canGuess ? display : []}
        wordLength={wordLength}
        partLengths={partLengths}
        maxAttempts={maxAttempts}
        shake={shake}
      />

      <p className="notice" role="status" aria-live="polite">
        {busy ? 'Đang chấm…' : notice ?? ' '}
      </p>

      {canGuess && (
        <GuessInput
          gameId={match.id}
          input={input}
          wordLength={wordLength}
          partLengths={partLengths}
          busy={busy}
          onChange={(value) => {
            setInput(value);
            setNotice(null);
          }}
          onSubmit={() => void submit()}
        />
      )}

      {opponents.length > 0 && (
        <section className="opponents" aria-label="Đối thủ">
          <h2 className="section-title">Đối thủ</h2>
          <ul className="opponent-list">
            {opponents.map((p) => (
              <li key={p.userId} className={`opponent${p.solved ? ' opponent-won' : ''}`}>
                <span className="opponent-name">
                  {p.solved ? (
                    <CheckCircle2 size={16} aria-label="Đoán đúng" />
                  ) : p.eliminated ? (
                    <XCircle size={16} aria-label="Hết lượt" />
                  ) : null}
                  {p.username}
                </span>
                <span className="muted opponent-attempts">
                  {p.attempts}/{maxAttempts}
                </span>
                <MiniBoard rows={p.colorRows ?? []} wordLength={wordLength} maxAttempts={maxAttempts} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
