import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Copy, LogOut, Play, WifiOff } from 'lucide-react';
import StatusMessage from '../../../components/common/StatusMessage';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorMessage } from '../../../services/api';
import type { GameType } from '../../../types/api';
import ChatPanel from '../components/ChatPanel';
import GuessRace from '../components/GuessRace';
import MemberList from '../components/MemberList';
import WordChain from '../components/WordChain';
import { useRoom } from '../hooks/useRoom';
import { GAME_TYPE_LABELS } from '../utils/roomState';

const MIN_PLAYERS = 2;

const GAME_DESCRIPTIONS: Record<GameType, string> = {
  WORD_GUESS: 'Mọi người đoán cùng một từ ghép, mỗi người 10 lượt. Ai đoán đúng trước sẽ thắng.',
  WORD_CHAIN: 'Lần lượt nối từ 2 tiếng: tiếng đầu phải trùng tiếng cuối của từ trước. Sai hoặc hết 20 giây bị loại.',
};

export default function RoomPage() {
  const { code = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { view, fatal, offline, start, guess, chain, sendMessage, leave } = useRoom(code.toUpperCase());
  const [selected, setSelected] = useState<GameType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;
  if (fatal) {
    return (
      <StatusMessage kind="error">
        {fatal} <Link to="/rooms">Về sảnh</Link>
      </StatusMessage>
    );
  }
  if (!view) return <StatusMessage kind="loading">Đang vào phòng…</StatusMessage>;

  const isHost = view.hostId === user.id;
  const gameType = selected ?? view.gameType;
  const playing = view.status === 'PLAYING';
  const match = view.match;

  const handleStart = async () => {
    setStarting(true);
    setActionError(null);
    try {
      await start(gameType);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Không bắt đầu được ván.'));
    } finally {
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    if (playing && !window.confirm('Rời phòng khi đang chơi sẽ bị tính là bỏ cuộc. Rời phòng?')) return;
    try {
      await leave();
      navigate('/rooms');
    } catch (error) {
      setActionError(getErrorMessage(error, 'Không rời phòng được.'));
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(view.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard: người dùng tự chép mã đang hiển thị
    }
  };

  return (
    <div className="room-layout">
      <section className="room-main" aria-labelledby="room-title">
        <div className="room-head">
          <div>
            <h1 id="room-title">
              Phòng <span className="room-code">{view.code}</span>
            </h1>
            <p className="muted">
              {playing && match ? `Đang chơi: ${GAME_TYPE_LABELS[match.gameType]}` : 'Đang chờ bắt đầu ván'}
            </p>
          </div>
          <div className="room-actions">
            <button type="button" className="btn btn-ghost" onClick={() => void copyCode()} aria-label="Chép mã phòng">
              <Copy size={18} aria-hidden="true" />
              <span className="hide-sm">{copied ? 'Đã chép' : 'Mã phòng'}</span>
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void handleLeave()}>
              <LogOut size={18} aria-hidden="true" />
              <span className="hide-sm">Rời phòng</span>
            </button>
          </div>
        </div>

        {offline && (
          <p className="alert" role="status">
            <WifiOff size={16} aria-hidden="true" /> Mất kết nối, đang thử lại…
          </p>
        )}
        {actionError && (
          <p className="alert" role="alert">
            {actionError}
          </p>
        )}

        {!playing && (
          <div className="card room-setup">
            {isHost ? (
              <>
                <fieldset className="game-picker">
                  <legend className="section-title">Chọn trò chơi</legend>
                  {(Object.keys(GAME_TYPE_LABELS) as GameType[]).map((type) => (
                    <label key={type} className={`game-option${gameType === type ? ' game-option-active' : ''}`}>
                      <input
                        type="radio"
                        name="gameType"
                        value={type}
                        checked={gameType === type}
                        onChange={() => setSelected(type)}
                      />
                      <strong>{GAME_TYPE_LABELS[type]}</strong>
                      <span className="muted">{GAME_DESCRIPTIONS[type]}</span>
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={starting || view.members.length < MIN_PLAYERS}
                  onClick={() => void handleStart()}
                >
                  <Play size={18} aria-hidden="true" />
                  {match ? 'Chơi ván mới' : 'Bắt đầu'}
                </button>
                {view.members.length < MIN_PLAYERS && (
                  <p className="muted room-hint">Cần ít nhất {MIN_PLAYERS} người. Gửi mã phòng hoặc mời bạn bè vào.</p>
                )}
              </>
            ) : (
              <p className="muted">
                Chờ chủ phòng bắt đầu ván <strong>{GAME_TYPE_LABELS[view.gameType]}</strong>.{' '}
                {GAME_DESCRIPTIONS[view.gameType]}
              </p>
            )}
          </div>
        )}

        {match?.gameType === 'WORD_GUESS' && (
          <GuessRace match={match} myId={user.id} clockOffset={view.clockOffset} onGuess={guess} />
        )}
        {match?.gameType === 'WORD_CHAIN' && (
          <WordChain match={match} myId={user.id} clockOffset={view.clockOffset} onPlay={chain} />
        )}
      </section>

      <aside className="room-side">
        <MemberList code={view.code} members={view.members} myId={user.id} />
        <ChatPanel title="Chat phòng" messages={view.messages} myId={user.id} onSend={sendMessage} />
      </aside>
    </div>
  );
}
