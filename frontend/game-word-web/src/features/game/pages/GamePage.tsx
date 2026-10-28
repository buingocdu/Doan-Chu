import { useEffect, useState } from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import StatusMessage from '../../../components/common/StatusMessage';
import GameBoard from '../components/GameBoard';
import Keyboard from '../components/Keyboard';
import GameRules from '../components/GameRules';
import GuessInput from '../components/GuessInput';
import GameResult from '../components/GameResult';
import { useGame } from '../hooks/useGame';
import { usePhysicalKeyboard } from '../hooks/usePhysicalKeyboard';
import { formatGuess } from '../utils/gameState';

const DEFAULT_MAX_ATTEMPTS = 10;
// Tạm ẩn bàn phím ảo; người chơi gõ qua ô nhập/bàn phím thật. Đặt true để hiện lại.
const SHOW_VIRTUAL_KEYBOARD = false;

export default function GamePage() {
  const { user } = useAuth();
  const { state, newGame, retry, submit, typeLetter, backspace, setInput } = useGame(user?.id ?? null);
  const [shake, setShake] = useState(false);

  const playing = state.status === 'playing';
  const submitting = state.status === 'submitting';
  const finished = state.status === 'won' || state.status === 'lost';

  usePhysicalKeyboard({ onLetter: typeLetter, onEnter: () => void submit(), onBackspace: backspace }, playing);

  // Rung hàng hiện tại khi có cảnh báo (thiếu chữ, lỗi gửi)
  useEffect(() => {
    if (!state.notice || !playing) return;
    setShake(true);
    const timer = window.setTimeout(() => setShake(false), 400);
    return () => window.clearTimeout(timer);
  }, [state.notice, playing]);

  let content;
  if (state.status === 'loading') {
    content = <StatusMessage kind="loading">Đang chuẩn bị từ mới…</StatusMessage>;
  } else if (state.status === 'error') {
    content = (
      <StatusMessage kind="error" onRetry={() => void retry()}>
        {state.notice}
      </StatusMessage>
    );
  } else {
    const remaining = state.maxAttempts - state.rows.length;
    content = (
      <>
        <div className="game-head">
          <div>
            <h1 id="game-title">Đoán từ ghép</h1>
            <p className="muted">
              {state.partLengths.length} tiếng ({state.partLengths.join(' + ')} chữ) · còn {remaining}/{state.maxAttempts}{' '}
              lượt
              {user ? ` · ${user.username}` : ' · chơi với tư cách khách'}
            </p>
          </div>
          {/* Chỉ được đổi từ sau khi đã đoán đúng từ hiện tại */}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void newGame()}
            disabled={state.status !== 'won'}
            title={state.status === 'won' ? 'Chơi từ khác' : 'Đoán đúng từ hiện tại để đổi từ khác'}
            aria-label={state.status === 'won' ? 'Đổi từ khác' : 'Đổi từ khác (mở khi đã đoán đúng)'}
          >
            {state.status === 'won' ? <RefreshCw size={18} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}
            <span className="hide-sm">Từ khác</span>
          </button>
        </div>

        <GameBoard
          rows={state.rows}
          current={state.display}
          wordLength={state.wordLength}
          partLengths={state.partLengths}
          maxAttempts={state.maxAttempts}
          shake={shake}
        />

        <p className="notice" role="status" aria-live="polite">
          {submitting ? 'Đang chấm…' : state.notice ?? ' '}
        </p>

        {finished ? (
          <GameResult
            won={state.status === 'won'}
            attempts={state.rows.length}
            score={state.score}
            // Backend trả đáp án có dấu, đã tách tiếng ("MÁY TÍNH"); dữ liệu cũ không có dấu cách thì tự tách
            answer={state.answer && (state.answer.includes(' ') ? state.answer : formatGuess(state.answer, state.partLengths))}
            definition={state.definition}
            loggedIn={user !== null}
            onNext={() => void newGame()}
          />
        ) : (
          <>
            <GuessInput
              gameId={state.gameId}
              input={state.input}
              wordLength={state.wordLength}
              partLengths={state.partLengths}
              busy={submitting}
              onChange={setInput}
              onSubmit={() => void submit()}
            />
            {SHOW_VIRTUAL_KEYBOARD && (
              <Keyboard
                disabled={!playing}
                onLetter={typeLetter}
                onEnter={() => void submit()}
                onBackspace={backspace}
              />
            )}
          </>
        )}
      </>
    );
  }

  return (
    <div className="game-layout">
      <section className="game" aria-labelledby="game-title">
        {content}
      </section>
      <GameRules maxAttempts={state.maxAttempts || DEFAULT_MAX_ATTEMPTS} />
    </div>
  );
}
