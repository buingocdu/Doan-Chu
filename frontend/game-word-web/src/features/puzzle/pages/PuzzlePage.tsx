import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Puzzle, RotateCcw, Trophy } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorMessage, getPuzzleGames, puzzleImageUrl, submitPuzzleScore } from '../../../services/api';
import StatusMessage from '../../../components/common/StatusMessage';
import PuzzleBoard, { type PuzzleResult } from '../components/PuzzleBoard';
import PuzzleLeaderboard from '../components/PuzzleLeaderboard';
import type { PuzzleGame, PuzzleScoreResponse } from '../../../types/api';
import { difficultyLabel, formatDuration } from '../utils/jigsaw';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; games: PuzzleGame[] };

type Submit =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; response: PuzzleScoreResponse }
  | { status: 'guest' }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; message: string };

type Phase = 'list' | 'playing' | 'done';

export default function PuzzlePage() {
  const { user } = useAuth();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [game, setGame] = useState<PuzzleGame | null>(null);
  const [phase, setPhase] = useState<Phase>('list');
  const [gameKey, setGameKey] = useState(0);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const [submit, setSubmit] = useState<Submit>({ status: 'idle' });
  const [rankRefresh, setRankRefresh] = useState(0);
  const [rankGame, setRankGame] = useState<PuzzleGame | null>(null);

  const loadGames = useCallback(async () => {
    setLoad({ status: 'loading' });
    try {
      setLoad({ status: 'success', games: await getPuzzleGames() });
    } catch (error) {
      setLoad({ status: 'error', message: getErrorMessage(error, 'Không tải được danh sách game.') });
    }
  }, []);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  // Chọn game là chơi luôn
  const play = (target: PuzzleGame) => {
    setGame(target);
    setResult(null);
    setSubmit({ status: 'idle' });
    setGameKey((k) => k + 1);
    setPhase('playing');
  };

  const handleFinish = async (res: PuzzleResult) => {
    if (!game) return;
    setResult(res);
    setPhase('done');
    // Khách vẫn chơi được nhưng không có tài khoản để ghi kết quả
    if (!user) {
      setSubmit({ status: 'guest' });
      return;
    }
    if (res.hintsUsed > 0) {
      setSubmit({ status: 'skipped', reason: 'Ván có dùng gợi ý nên không được ghi vào bảng xếp hạng.' });
      return;
    }
    setSubmit({ status: 'saving' });
    try {
      const response = await submitPuzzleScore({ gameId: game.id, durationMs: res.durationMs, moves: res.moves });
      setSubmit({ status: 'saved', response });
      setRankRefresh((n) => n + 1);
    } catch (error) {
      setSubmit({ status: 'error', message: getErrorMessage(error, 'Không lưu được kết quả.') });
    }
  };

  const backToList = () => {
    setPhase('list');
    void loadGames();
  };

  if (phase === 'playing' && game) {
    return (
      <section className="page puzzle-page">
        <h1 className="puzzle-title">
          <Puzzle size={22} aria-hidden="true" /> {game.title}
        </h1>
        <PuzzleBoard
          key={gameKey}
          imageUrl={puzzleImageUrl(game.imageId, game.imageVersion)}
          aspect={game.width && game.height ? game.width / game.height : 1}
          rows={game.rows}
          cols={game.cols}
          snapPercent={game.snapPercent}
          onFinish={(r) => void handleFinish(r)}
          onExit={backToList}
        />
      </section>
    );
  }

  if (phase === 'done' && game && result) {
    return (
      <section className="page puzzle-page">
        <h1>
          <Trophy size={24} aria-hidden="true" /> Hoàn thành!
        </h1>
        <div className="card puzzle-result" role="status">
          <figure className="puzzle-result-figure">
            <img
              className="puzzle-result-image"
              src={puzzleImageUrl(game.imageId, game.imageVersion)}
              alt={`Ảnh đã ghép: ${game.title}`}
              style={game.width && game.height ? { aspectRatio: `${game.width} / ${game.height}` } : undefined}
              draggable={false}
            />
          </figure>
          <p className="puzzle-result-time">{formatDuration(result.durationMs, true)}</p>
          <p className="muted">
            {game.title} · {game.rows}×{game.cols} ({game.rows * game.cols} mảnh) · {result.moves} lượt kéo
            {result.hintsUsed > 0 ? ` · ${result.hintsUsed} gợi ý` : ''}
          </p>
          {submit.status === 'saving' && <p>Đang lưu kết quả…</p>}
          {submit.status === 'saved' && (
            <p>
              {submit.response.personalBest ? 'Kỷ lục cá nhân mới! ' : ''}
              Hạng <strong>{submit.response.rank}</strong> · tốt nhất của bạn {formatDuration(submit.response.bestMs, true)}
            </p>
          )}
          {submit.status === 'guest' && (
            <p className="muted">
              <Link to="/login" state={{ from: '/puzzle' }}>Đăng nhập</Link> hoặc{' '}
              <Link to="/register">đăng ký</Link> để lưu kết quả và lên bảng xếp hạng.
            </p>
          )}
          {submit.status === 'skipped' && <p className="muted">{submit.reason}</p>}
          {submit.status === 'error' && (
            <p className="field-error" role="alert">
              {submit.message}
            </p>
          )}
          <div className="puzzle-actions">
            <button type="button" className="btn btn-primary" onClick={() => play(game)}>
              <RotateCcw size={16} aria-hidden="true" /> Chơi lại
            </button>
            <button type="button" className="btn btn-ghost" onClick={backToList}>
              Chọn game khác
            </button>
          </div>
        </div>
        <PuzzleLeaderboard gameId={game.id} title={game.title} refreshKey={rankRefresh} />
      </section>
    );
  }

  return (
    <section className="page puzzle-page">
      <h1>
        <Puzzle size={24} aria-hidden="true" /> Ghép hình
      </h1>
      <p className="muted puzzle-intro">
        Chọn một game để chơi ngay. Kéo các mảnh ở khay phía dưới vào khung, đối chiếu với hình mẫu thu nhỏ ở góc. Mảnh sáng
        viền khi tới đúng chỗ và tự dính khi thả. Bạn có thể ghép các mảnh liền kề với nhau ngay ở ngoài khay thành cụm,
        rồi kéo cả cụm vào khung một lượt. Ghép càng nhanh càng lên cao trên bảng xếp hạng.
      </p>

      {load.status === 'loading' && <StatusMessage kind="loading">Đang tải danh sách game…</StatusMessage>}
      {load.status === 'error' && (
        <StatusMessage kind="error" onRetry={() => void loadGames()}>
          {load.message}
        </StatusMessage>
      )}
      {load.status === 'success' && load.games.length === 0 && (
        <StatusMessage kind="empty">Chưa có game ghép hình nào. Quản trị viên sẽ sớm thêm game mới.</StatusMessage>
      )}
      {load.status === 'success' && load.games.length > 0 && (
        <ul className="puzzle-gallery puzzle-games" aria-label="Danh sách game ghép hình">
          {load.games.map((g) => (
            <li key={g.id} className="card puzzle-game-card">
              <button type="button" className="puzzle-game-play" onClick={() => play(g)}>
                <img src={puzzleImageUrl(g.imageId, g.imageVersion)} alt="" loading="lazy" draggable={false} />
                <span className="puzzle-game-title">{g.title}</span>
                <span className="puzzle-game-meta">
                  <span className="puzzle-badge">{difficultyLabel(g.rows, g.cols)}</span>
                  {g.rows}×{g.cols} · {g.rows * g.cols} mảnh
                </span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-expanded={rankGame?.id === g.id}
                onClick={() => setRankGame((cur) => (cur?.id === g.id ? null : g))}
              >
                <Trophy size={14} aria-hidden="true" /> Xếp hạng
              </button>
            </li>
          ))}
        </ul>
      )}

      {rankGame && <PuzzleLeaderboard gameId={rankGame.id} title={rankGame.title} />}
    </section>
  );
}
