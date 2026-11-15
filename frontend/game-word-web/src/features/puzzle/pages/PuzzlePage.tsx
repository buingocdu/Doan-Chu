import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Puzzle, RotateCcw, Trophy } from 'lucide-react';
import { getErrorMessage, getPuzzleImages, puzzleImageUrl, submitPuzzleScore } from '../../../services/api';
import StatusMessage from '../../../components/common/StatusMessage';
import PuzzleBoard, { type PuzzleResult } from '../components/PuzzleBoard';
import PuzzleLeaderboard from '../components/PuzzleLeaderboard';
import type { PuzzleImage, PuzzleScoreResponse } from '../../../types/api';
import {
  clampGrid,
  CUSTOM_DIFFICULTY_ID,
  DIFFICULTIES,
  formatDuration,
  MAX_GRID,
  MIN_GRID,
} from '../utils/jigsaw';

type Source =
  | { kind: 'server'; image: PuzzleImage }
  | { kind: 'local'; url: string; aspect: number; name: string };

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; images: PuzzleImage[] };

type Submit =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; response: PuzzleScoreResponse }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; message: string };

type Phase = 'setup' | 'playing' | 'done';

const MAX_LOCAL_BYTES = 15 * 1024 * 1024;

export default function PuzzlePage() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [source, setSource] = useState<Source | null>(null);
  const [difficultyId, setDifficultyId] = useState<string>('easy');
  const [customRows, setCustomRows] = useState(5);
  const [customCols, setCustomCols] = useState(5);
  const [showGhost, setShowGhost] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [gameKey, setGameKey] = useState(0);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const [submit, setSubmit] = useState<Submit>({ status: 'idle' });
  const [rankRefresh, setRankRefresh] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const localUrlRef = useRef<string | null>(null);

  const loadImages = useCallback(async () => {
    setLoad({ status: 'loading' });
    try {
      const images = await getPuzzleImages();
      setLoad({ status: 'success', images });
      setSource((current) => current ?? (images.length > 0 ? { kind: 'server', image: images[0] } : null));
    } catch (error) {
      setLoad({ status: 'error', message: getErrorMessage(error, 'Không tải được kho ảnh.') });
    }
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  useEffect(
    () => () => {
      if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    },
    [],
  );

  const preset = DIFFICULTIES.find((d) => d.id === difficultyId);
  const rows = preset ? preset.rows : clampGrid(customRows);
  const cols = preset ? preset.cols : clampGrid(customCols);

  const handleLocalFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLocalError(null);
    if (!file.type.startsWith('image/')) {
      setLocalError('File đã chọn không phải ảnh.');
      return;
    }
    if (file.size > MAX_LOCAL_BYTES) {
      setLocalError('Ảnh quá lớn (tối đa 15MB).');
      return;
    }
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
      localUrlRef.current = url;
      setSource({ kind: 'local', url, aspect: probe.naturalWidth / probe.naturalHeight, name: file.name });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setLocalError('Không đọc được ảnh này. Hãy thử file khác.');
    };
    probe.src = url;
  };

  const start = () => {
    if (!source) return;
    setResult(null);
    setSubmit({ status: 'idle' });
    setGameKey((k) => k + 1);
    setPhase('playing');
  };

  const handleFinish = async (res: PuzzleResult) => {
    setResult(res);
    setPhase('done');
    if (!source || source.kind !== 'server') {
      setSubmit({ status: 'skipped', reason: 'Ảnh của bạn không có bảng xếp hạng.' });
      return;
    }
    if (res.hintsUsed > 0) {
      setSubmit({ status: 'skipped', reason: 'Ván có dùng gợi ý nên không được ghi vào bảng xếp hạng.' });
      return;
    }
    setSubmit({ status: 'saving' });
    try {
      const response = await submitPuzzleScore({
        imageId: source.image.id,
        rows,
        cols,
        durationMs: res.durationMs,
        moves: res.moves,
      });
      setSubmit({ status: 'saved', response });
      setRankRefresh((n) => n + 1);
    } catch (error) {
      setSubmit({ status: 'error', message: getErrorMessage(error, 'Không lưu được kết quả.') });
    }
  };

  const imageUrl = source ? (source.kind === 'server' ? puzzleImageUrl(source.image.id) : source.url) : '';
  const aspect = source ? (source.kind === 'server' ? source.image.width / source.image.height : source.aspect) : 1;
  const leaderboardImageId = source?.kind === 'server' ? source.image.id : null;

  if (phase === 'playing' && source) {
    return (
      <section className="page puzzle-page">
        <PuzzleBoard
          key={gameKey}
          imageUrl={imageUrl}
          aspect={aspect}
          rows={rows}
          cols={cols}
          showGhost={showGhost}
          onFinish={(r) => void handleFinish(r)}
          onExit={() => setPhase('setup')}
        />
      </section>
    );
  }

  if (phase === 'done' && source && result) {
    return (
      <section className="page puzzle-page">
        <h1>
          <Trophy size={24} aria-hidden="true" /> Hoàn thành!
        </h1>
        <div className="card puzzle-result" role="status">
          <p className="puzzle-result-time">{formatDuration(result.durationMs, true)}</p>
          <p className="muted">
            {rows}×{cols} ({rows * cols} mảnh) · {result.moves} lượt kéo
            {result.hintsUsed > 0 ? ` · ${result.hintsUsed} gợi ý` : ''}
          </p>
          {submit.status === 'saving' && <p>Đang lưu kết quả…</p>}
          {submit.status === 'saved' && (
            <p>
              {submit.response.personalBest ? 'Kỷ lục cá nhân mới! ' : ''}
              Hạng <strong>{submit.response.rank}</strong> · tốt nhất của bạn {formatDuration(submit.response.bestMs, true)}
            </p>
          )}
          {submit.status === 'skipped' && <p className="muted">{submit.reason}</p>}
          {submit.status === 'error' && (
            <p className="field-error" role="alert">
              {submit.message}
            </p>
          )}
          <div className="puzzle-actions">
            <button type="button" className="btn btn-primary" onClick={start}>
              <RotateCcw size={16} aria-hidden="true" /> Chơi lại
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPhase('setup')}>
              Chọn ảnh / độ khó khác
            </button>
          </div>
        </div>
        {leaderboardImageId !== null && (
          <PuzzleLeaderboard imageId={leaderboardImageId} rows={rows} cols={cols} refreshKey={rankRefresh} />
        )}
      </section>
    );
  }

  return (
    <section className="page puzzle-page">
      <h1>
        <Puzzle size={24} aria-hidden="true" /> Ghép hình
      </h1>
      <p className="muted puzzle-intro">
        Kéo các mảnh ở khay phía dưới vào đúng vị trí trên khung. Thả gần đúng chỗ là mảnh tự dính. Ghép càng nhanh càng
        lên cao trên bảng xếp hạng.
      </p>

      <div className="card puzzle-setup">
        <h2 className="section-title">1. Chọn ảnh</h2>
        {load.status === 'loading' && <StatusMessage kind="loading">Đang tải kho ảnh…</StatusMessage>}
        {load.status === 'error' && (
          <StatusMessage kind="error" onRetry={() => void loadImages()}>
            {load.message}
          </StatusMessage>
        )}
        {load.status === 'success' && (
          <ul className="puzzle-gallery" aria-label="Kho ảnh">
            {load.images.map((image) => {
              const selected = source?.kind === 'server' && source.image.id === image.id;
              return (
                <li key={image.id}>
                  <button
                    type="button"
                    className={`puzzle-thumb${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => setSource({ kind: 'server', image })}
                  >
                    <img src={puzzleImageUrl(image.id)} alt="" loading="lazy" draggable={false} />
                    <span>{image.title}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <label className={`puzzle-thumb puzzle-thumb-upload${source?.kind === 'local' ? ' is-selected' : ''}`}>
                {source?.kind === 'local' ? (
                  <img src={source.url} alt="" draggable={false} />
                ) : (
                  <ImagePlus size={28} aria-hidden="true" />
                )}
                <span>{source?.kind === 'local' ? source.name : 'Ảnh của bạn'}</span>
                <input type="file" accept="image/*" className="visually-hidden" onChange={handleLocalFile} />
              </label>
            </li>
          </ul>
        )}
        {localError && (
          <p className="field-error" role="alert">
            {localError}
          </p>
        )}
        {load.status === 'success' && load.images.length === 0 && (
          <p className="muted">Kho ảnh chưa có ảnh nào. Quản trị viên có thể thêm ảnh, hoặc bạn chọn “Ảnh của bạn”.</p>
        )}

        <h2 className="section-title">2. Chọn độ khó</h2>
        <div className="puzzle-levels" role="radiogroup" aria-label="Độ khó">
          {DIFFICULTIES.map((d) => (
            <label key={d.id} className={`puzzle-level${difficultyId === d.id ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="difficulty"
                value={d.id}
                checked={difficultyId === d.id}
                onChange={() => setDifficultyId(d.id)}
              />
              <strong>{d.label}</strong>
              <span>
                {d.rows}×{d.cols} · {d.rows * d.cols} mảnh
              </span>
            </label>
          ))}
          <label className={`puzzle-level${difficultyId === CUSTOM_DIFFICULTY_ID ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="difficulty"
              value={CUSTOM_DIFFICULTY_ID}
              checked={difficultyId === CUSTOM_DIFFICULTY_ID}
              onChange={() => setDifficultyId(CUSTOM_DIFFICULTY_ID)}
            />
            <strong>Tùy chỉnh</strong>
            <span>
              {rows}×{cols} · {rows * cols} mảnh
            </span>
          </label>
        </div>

        {difficultyId === CUSTOM_DIFFICULTY_ID && (
          <div className="puzzle-custom">
            <div className="field">
              <label htmlFor="puzzle-rows">Số hàng ({MIN_GRID}–{MAX_GRID})</label>
              <input
                id="puzzle-rows"
                type="number"
                min={MIN_GRID}
                max={MAX_GRID}
                value={customRows}
                onChange={(e) => setCustomRows(Number(e.target.value))}
                onBlur={() => setCustomRows((v) => clampGrid(v))}
              />
            </div>
            <div className="field">
              <label htmlFor="puzzle-cols">Số cột ({MIN_GRID}–{MAX_GRID})</label>
              <input
                id="puzzle-cols"
                type="number"
                min={MIN_GRID}
                max={MAX_GRID}
                value={customCols}
                onChange={(e) => setCustomCols(Number(e.target.value))}
                onBlur={() => setCustomCols((v) => clampGrid(v))}
              />
            </div>
          </div>
        )}
        {rows * cols >= 64 && (
          <p className="puzzle-note">Nhiều mảnh nhỏ sẽ khó thao tác trên điện thoại; nên chơi trên màn hình lớn.</p>
        )}

        <label className="puzzle-check">
          <input type="checkbox" checked={showGhost} onChange={(e) => setShowGhost(e.target.checked)} />
          Hiện ảnh mờ làm nền trên khung (tắt để chơi khó hơn)
        </label>

        <button type="button" className="btn btn-primary" onClick={start} disabled={!source}>
          <Puzzle size={18} aria-hidden="true" /> Bắt đầu ghép
        </button>
      </div>

      {leaderboardImageId !== null && <PuzzleLeaderboard imageId={leaderboardImageId} rows={rows} cols={cols} />}
    </section>
  );
}
