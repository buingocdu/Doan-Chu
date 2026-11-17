import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Pencil, Puzzle, Trash2, X } from 'lucide-react';
import {
  createPuzzleGame,
  deletePuzzleGame,
  getAdminPuzzleGames,
  getErrorMessage,
  updatePuzzleGame,
} from '../../../services/api';
import StatusMessage from '../../../components/common/StatusMessage';
import AdminThumb from './AdminThumb';
import type { PuzzleGame, PuzzleImage } from '../../../types/api';
import { clampGrid, DIFFICULTIES, difficultyLabel, MAX_GRID, MIN_GRID } from '../utils/jigsaw';

interface AdminGamesProps {
  /** Ảnh trong kho, dùng để chọn ảnh cho game */
  images: PuzzleImage[];
  imagesLoading: boolean;
  /** Ảnh được chọn sẵn (khi bấm "Tạo game" ở kho ảnh) */
  preselectImageId: number | null;
  onNeedImages: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; games: PuzzleGame[] };

export default function AdminGames({ images, imagesLoading, preselectImageId, onNeedImages }: AdminGamesProps) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [imageId, setImageId] = useState<number | null>(preselectImageId);
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const reload = useCallback(async () => {
    try {
      setLoad({ status: 'success', games: await getAdminPuzzleGames() });
    } catch (error) {
      setLoad({ status: 'error', message: getErrorMessage(error, 'Không tải được danh sách game.') });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (preselectImageId !== null) setImageId(preselectImageId);
  }, [preselectImageId]);

  // Mặc định chọn ảnh mới nhất khi chưa chọn gì
  useEffect(() => {
    if (imageId === null && images.length > 0) setImageId(images[0].id);
  }, [images, imageId]);

  const selected = images.find((i) => i.id === imageId) ?? null;
  const preset = DIFFICULTIES.find((d) => d.rows === rows && d.cols === cols);

  const save = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const game = await createPuzzleGame({ imageId: selected.id, title: title.trim() || undefined, rows, cols });
      setTitle('');
      await reload();
      setMessage({ kind: 'success', text: `Đã lưu game “${game.title}” (${game.rows}×${game.cols}). Người chơi thấy ngay trong mục Ghép hình.` });
    } catch (error) {
      setMessage({ kind: 'error', text: getErrorMessage(error, 'Không lưu được game.') });
    } finally {
      setSaving(false);
    }
  };

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setMessage(null);
    try {
      await action();
      await reload();
      if (success) setMessage({ kind: 'success', text: success });
    } catch (error) {
      setMessage({ kind: 'error', text: getErrorMessage(error, 'Thao tác thất bại.') });
    }
  };

  const saveTitle = async (game: PuzzleGame) => {
    const next = editTitle.trim();
    if (!next) return;
    await run(() => updatePuzzleGame(game.id, { title: next }));
    setEditingId(null);
  };

  const remove = (game: PuzzleGame) => {
    if (!window.confirm(`Xóa game “${game.title}”? Bảng xếp hạng của game này cũng bị xóa.`)) return;
    void run(() => deletePuzzleGame(game.id), 'Đã xóa game.');
  };

  return (
    <div className="admin-games">
      <div className="card admin-upload">
        <h2 className="section-title">Tạo game mới</h2>
        {imagesLoading && <p className="muted">Đang tải kho ảnh…</p>}
        {!imagesLoading && images.length === 0 && (
          <p>
            Kho ảnh đang trống.{' '}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onNeedImages}>
              Thêm ảnh vào kho
            </button>
          </p>
        )}
        {images.length > 0 && (
          <>
            <p className="admin-step">1. Chọn ảnh từ kho</p>
            <ul className="admin-pick" aria-label="Chọn ảnh cho game">
              {images.map((image) => (
                <li key={image.id}>
                  <button
                    type="button"
                    className={`admin-pick-item${image.id === imageId ? ' is-selected' : ''}`}
                    aria-pressed={image.id === imageId}
                    onClick={() => setImageId(image.id)}
                  >
                    <AdminThumb image={image} />
                    <span>{image.title}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="admin-step">2. Chọn độ khó (số mảnh)</p>
            <div className="puzzle-levels" role="group" aria-label="Độ khó">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`puzzle-level${preset?.id === d.id ? ' is-selected' : ''}`}
                  aria-pressed={preset?.id === d.id}
                  onClick={() => {
                    setRows(d.rows);
                    setCols(d.cols);
                  }}
                >
                  <strong>{d.label}</strong>
                  <span>
                    {d.rows}×{d.cols} · {d.rows * d.cols} mảnh
                  </span>
                </button>
              ))}
            </div>
            <div className="puzzle-custom">
              <div className="field">
                <label htmlFor="game-rows">Số hàng ({MIN_GRID}–{MAX_GRID})</label>
                <input
                  id="game-rows"
                  type="number"
                  min={MIN_GRID}
                  max={MAX_GRID}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  onBlur={() => setRows((v) => clampGrid(v))}
                />
              </div>
              <div className="field">
                <label htmlFor="game-cols">Số cột ({MIN_GRID}–{MAX_GRID})</label>
                <input
                  id="game-cols"
                  type="number"
                  min={MIN_GRID}
                  max={MAX_GRID}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  onBlur={() => setCols((v) => clampGrid(v))}
                />
              </div>
            </div>
            <p className="muted">
              {clampGrid(rows)}×{clampGrid(cols)} = {clampGrid(rows) * clampGrid(cols)} mảnh ·{' '}
              {difficultyLabel(clampGrid(rows), clampGrid(cols))}
            </p>

            <p className="admin-step">3. Đặt tên và lưu</p>
            <div className="field">
              <label htmlFor="game-title">Tên game (để trống thì lấy tên ảnh)</label>
              <input
                id="game-title"
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selected?.title ?? ''}
              />
            </div>
            <div className="puzzle-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selected || saving}
                onClick={() => {
                  setRows((v) => clampGrid(v));
                  setCols((v) => clampGrid(v));
                  void save();
                }}
              >
                <Puzzle size={18} aria-hidden="true" /> {saving ? 'Đang lưu…' : 'Lưu game'}
              </button>
            </div>
          </>
        )}
      </div>

      {message && (
        <p
          className={message.kind === 'error' ? 'alert' : 'alert alert-success'}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}

      <h2 className="section-title">Game đã tạo</h2>
      {load.status === 'loading' && <StatusMessage kind="loading">Đang tải…</StatusMessage>}
      {load.status === 'error' && (
        <StatusMessage kind="error" onRetry={() => void reload()}>
          {load.message}
        </StatusMessage>
      )}
      {load.status === 'success' && load.games.length === 0 && (
        <StatusMessage kind="empty">Chưa có game nào. Hãy tạo game đầu tiên ở trên.</StatusMessage>
      )}
      {load.status === 'success' && load.games.length > 0 && (
        <ul className="admin-list">
          {load.games.map((game) => {
            const image = images.find((i) => i.id === game.imageId);
            return (
              <li key={game.id} className={`card admin-item${game.active ? '' : ' is-hidden'}`}>
                {image ? (
                  <AdminThumb image={image} />
                ) : (
                  <span className="admin-thumb admin-thumb-empty" aria-hidden="true" />
                )}
                <div className="admin-item-body">
                  {editingId === game.id ? (
                    <form
                      className="admin-rename"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveTitle(game);
                      }}
                    >
                      <input
                        type="text"
                        maxLength={100}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        aria-label="Tên game"
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary btn-sm" aria-label="Lưu tên">
                        <Check size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Hủy sửa tên"
                        onClick={() => setEditingId(null)}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </form>
                  ) : (
                    <strong className="admin-item-title">{game.title}</strong>
                  )}
                  <span className="muted">
                    {game.rows}×{game.cols} · {game.rows * game.cols} mảnh · {difficultyLabel(game.rows, game.cols)}
                    {game.active ? '' : ' · đang ẩn'}
                  </span>
                </div>
                <div className="admin-item-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(game.id);
                      setEditTitle(game.title);
                    }}
                  >
                    <Pencil size={16} aria-hidden="true" /> <span className="hide-sm">Đổi tên</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void run(() => updatePuzzleGame(game.id, { active: !game.active }))}
                  >
                    {game.active ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    <span className="hide-sm">{game.active ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm admin-danger" onClick={() => remove(game)}>
                    <Trash2 size={16} aria-hidden="true" /> <span className="hide-sm">Xóa</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
