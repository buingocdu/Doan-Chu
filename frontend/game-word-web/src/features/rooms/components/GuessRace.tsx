import { useEffect, useState } from 'react';
import { CheckCircle2, Crown, Hourglass, Users, XCircle } from 'lucide-react';
import { getErrorMessage } from '../../../services/api';
import type { MatchState } from '../../../types/api';
import GameBoard from '../../game/components/GameBoard';
import GuessInput from '../../game/components/GuessInput';
import { countLetters, formatGuess, normalizeParts, toDisplayLetters } from '../../game/utils/gameState';
import Countdown from './Countdown';
import HintRow from './HintRow';
import MiniBoard from './MiniBoard';
import TurnSeats from './TurnSeats';
import { useNow } from '../hooks/useNow';
import { msLeft, timeLevel } from '../utils/roomState';

/** Bảng chung dài: chỉ hiện tới hàng đang nhập, tối thiểu 6 hàng */
const MIN_VISIBLE_ROWS = 6;

interface GuessRaceProps {
  match: MatchState;
  myId: number;
  clockOffset: number;
  onGuess: (guess: string) => Promise<void>;
}

// Đua đoán chữ: bảng của mình (có chữ) + bảng thu nhỏ của đối thủ (chỉ màu).
// Chế độ lần lượt: cả phòng chung một bảng, chỉ người tới lượt được đoán, kết quả chung.
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
  const turnBased = match.turnBased === true;
  const myTurn = turnBased && playing && match.currentUserId === myId;
  const canGuess = playing && me !== undefined && !me.eliminated && !me.solved && (!turnBased || myTurn);
  const current = match.players.find((p) => p.userId === match.currentUserId);

  // Đồng hồ lượt (chỉ chế độ lần lượt)
  const now = useNow(200, turnBased && playing);
  const turnLeft = turnBased && playing ? msLeft(match.turnDeadline, clockOffset, now) : 0;
  const turnSecs = Math.ceil(turnLeft / 1000);
  const turnFraction = Math.min(1, turnLeft / ((match.turnSeconds ?? 30) * 1000));
  const level = timeLevel(turnSecs);
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
  else if (turnBased) status = `Đã dùng ${myRows.length}/${maxAttempts} lượt chung`;
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
        <div
          className={`match-result card${match.winnerId === myId || (turnBased && match.winnerId) ? ' match-won' : ''}`}
          role="status"
        >
          <p className="match-result-title">
            {turnBased ? <Users size={20} aria-hidden="true" /> : <Crown size={20} aria-hidden="true" />}
            {turnBased
              ? match.winnerId
                ? `Cả phòng thắng! ${match.winnerId === myId ? 'Bạn' : match.winnerName} đoán ra ở lượt ${myRows.length}/${maxAttempts}.`
                : `Cả phòng chưa đoán ra sau ${myRows.length} lượt.`
              : match.winnerId === myId
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

      {turnBased && playing && (
        <>
          <TurnSeats
            players={match.players}
            currentUserId={match.currentUserId ?? null}
            myId={myId}
            seconds={turnSecs}
            fraction={turnFraction}
            level={level}
          />
          <div className={`chain-turn-head guess-turn${myTurn ? ' guess-turn-mine' : ''}`}>
            <p className="chain-turn-label" aria-live="polite">
              {myTurn ? 'Tới lượt bạn đoán!' : current ? `Lượt của ${current.username}` : ''}
            </p>
            <span className={`chain-clock chain-clock-${level}`} role="timer" aria-label={`Còn ${turnSecs} giây`}>
              <Hourglass size={18} aria-hidden="true" />
              {turnSecs}s
            </span>
          </div>
        </>
      )}

      {playing && match.hints && (
        <HintRow
          hints={match.hints}
          nextHintAt={match.nextHintAt}
          clockOffset={clockOffset}
          wordLength={wordLength}
          partLengths={partLengths}
          maxAttempts={maxAttempts}
        />
      )}

      <GameBoard
        rows={myRows}
        current={canGuess ? display : []}
        wordLength={wordLength}
        partLengths={partLengths}
        maxAttempts={maxAttempts}
        shake={shake}
        rowLabels={turnBased ? match.rowAuthors ?? [] : undefined}
        visibleRows={turnBased ? Math.max(MIN_VISIBLE_ROWS, myRows.length + (playing ? 1 : 0)) : undefined}
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

      {turnBased && playing && !myTurn && me && !me.eliminated && (
        <p className="muted guess-wait">Chờ tới lượt bạn. Cùng bàn đáp án trong chat phòng nhé!</p>
      )}

      {!turnBased && opponents.length > 0 && (
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
