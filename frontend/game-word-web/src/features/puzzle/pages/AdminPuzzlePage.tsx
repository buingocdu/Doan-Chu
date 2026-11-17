import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Check, EyeOff, Eye, Pencil, Puzzle, Trash2, UploadCloud, X } from 'lucide-react';
import {
  deletePuzzleImage,
  getAdminPuzzleImages,
  getErrorMessage,
  updatePuzzleImage,
  uploadPuzzleImage,
} from '../../../services/api';
import StatusMessage from '../../../components/common/StatusMessage';
import AdminThumb from '../components/AdminThumb';
import AdminGames from '../components/AdminGames';
import type { PuzzleImage } from '../../../types/api';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; images: PuzzleImage[] };

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function AdminPuzzlePage() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [tab, setTab] = useState<'games' | 'images'>('games');
  const [gameImageId, setGameImageId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      const images = await getAdminPuzzleImages();
      setLoad({ status: 'success', images });
    } catch (error) {
      setLoad({ status: 'error', message: getErrorMessage(error, 'Không tải được kho ảnh.') });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pick = (list: FileList | File[]) => {
    const picked = Array.from(list);
    const bad = picked.find((f) => !f.type.startsWith('image/'));
    if (bad) {
      setMessage({ kind: 'error', text: `“${bad.name}” không phải file ảnh.` });
      return;
    }
    const big = picked.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (big) {
      setMessage({ kind: 'error', text: `“${big.name}” vượt quá 8MB.` });
      return;
    }
    setMessage(null);
    setFiles(picked);
    if (picked.length !== 1) setTitle('');
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) pick(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) pick(e.dataTransfer.files);
  };

  const upload = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setMessage(null);
    let ok = 0;
    const errors: string[] = [];
    for (const file of files) {
      try {
        await uploadPuzzleImage(file, files.length === 1 ? title.trim() || undefined : undefined);
        ok += 1;
      } catch (error) {
        errors.push(`${file.name}: ${getErrorMessage(error, 'tải lên thất bại')}`);
      }
    }
    setUploading(false);
    setFiles([]);
    setTitle('');
    await reload();
    if (errors.length > 0) {
      setMessage({ kind: 'error', text: `${ok > 0 ? `Đã thêm ${ok} ảnh. ` : ''}Lỗi — ${errors.join('; ')}` });
    } else {
      setMessage({ kind: 'success', text: `Đã thêm ${ok} ảnh vào kho.` });
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

  const saveTitle = async (image: PuzzleImage) => {
    const next = editTitle.trim();
    if (!next) return;
    await run(() => updatePuzzleImage(image.id, { title: next }));
    setEditingId(null);
  };

  const remove = (image: PuzzleImage) => {
    if (!window.confirm(`Xóa ảnh “${image.title}”? Kết quả xếp hạng của ảnh này cũng bị xóa.`)) return;
    void run(() => deletePuzzleImage(image.id), 'Đã xóa ảnh.');
  };

  return (
    <section className="page admin-page">
      <h1>
        <UploadCloud size={24} aria-hidden="true" /> Quản trị ghép hình
      </h1>

      <div className="admin-tabs" role="tablist" aria-label="Quản trị ghép hình">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'games'}
          className={`admin-tab${tab === 'games' ? ' is-active' : ''}`}
          onClick={() => setTab('games')}
        >
          Game
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'images'}
          className={`admin-tab${tab === 'images' ? ' is-active' : ''}`}
          onClick={() => setTab('images')}
        >
          Kho ảnh
        </button>
      </div>

      {tab === 'games' && (
        <AdminGames
          images={load.status === 'success' ? load.images : []}
          imagesLoading={load.status === 'loading'}
          preselectImageId={gameImageId}
          onNeedImages={() => setTab('images')}
        />
      )}

      {tab === 'images' && (
        <>

      <div className="card admin-upload">
        <h2 className="section-title">Thêm ảnh từ máy</h2>
        <div
          className={`admin-drop${dragOver ? ' is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <UploadCloud size={28} aria-hidden="true" />
          <p>Kéo thả ảnh vào đây hoặc</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
            Chọn ảnh từ máy
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/bmp"
            multiple
            className="visually-hidden"
            onChange={onInput}
            aria-label="Chọn file ảnh"
          />
          <p className="muted">JPG, PNG, GIF, BMP · tối đa 8MB/ảnh · cạnh ngắn từ 300px · có thể chọn nhiều ảnh</p>
        </div>

        {files.length > 0 && (
          <div className="admin-selected">
            <p>
              Đã chọn <strong>{files.length}</strong> ảnh: {files.map((f) => f.name).join(', ')}
            </p>
            {files.length === 1 && (
              <div className="field">
                <label htmlFor="admin-title">Tên ảnh (mặc định lấy theo tên file)</label>
                <input
                  id="admin-title"
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={files[0].name.replace(/\.[^.]+$/, '')}
                />
              </div>
            )}
            <div className="puzzle-actions">
              <button type="button" className="btn btn-primary" onClick={() => void upload()} disabled={uploading}>
                {uploading ? 'Đang tải lên…' : 'Tải lên kho'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setFiles([])} disabled={uploading}>
                Hủy chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <p className={message.kind === 'error' ? 'alert' : 'alert alert-success'} role={message.kind === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}

      <h2 className="section-title">Kho ảnh</h2>
      {load.status === 'loading' && <StatusMessage kind="loading">Đang tải…</StatusMessage>}
      {load.status === 'error' && (
        <StatusMessage kind="error" onRetry={() => void reload()}>
          {load.message}
        </StatusMessage>
      )}
      {load.status === 'success' && load.images.length === 0 && (
        <StatusMessage kind="empty">Kho chưa có ảnh nào. Hãy thêm ảnh ở trên.</StatusMessage>
      )}
      {load.status === 'success' && load.images.length > 0 && (
        <ul className="admin-list">
          {load.images.map((image) => (
            <li key={image.id} className={`card admin-item${image.active ? '' : ' is-hidden'}`}>
              <AdminThumb image={image} />
              <div className="admin-item-body">
                {editingId === image.id ? (
                  <form
                    className="admin-rename"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveTitle(image);
                    }}
                  >
                    <input
                      type="text"
                      maxLength={100}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      aria-label="Tên ảnh"
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
                  <strong className="admin-item-title">{image.title}</strong>
                )}
                <span className="muted">
                  {image.width}×{image.height} · {formatSize(image.sizeBytes)}
                  {image.active ? '' : ' · đang ẩn'}
                </span>
              </div>
              <div className="admin-item-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setGameImageId(image.id);
                    setTab('games');
                  }}
                >
                  <Puzzle size={16} aria-hidden="true" /> <span className="hide-sm">Tạo game</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditingId(image.id);
                    setEditTitle(image.title);
                  }}
                >
                  <Pencil size={16} aria-hidden="true" /> <span className="hide-sm">Đổi tên</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void run(() => updatePuzzleImage(image.id, { active: !image.active }))}
                >
                  {image.active ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  <span className="hide-sm">{image.active ? 'Ẩn' : 'Hiện'}</span>
                </button>
                <button type="button" className="btn btn-ghost btn-sm admin-danger" onClick={() => remove(image)}>
                  <Trash2 size={16} aria-hidden="true" /> <span className="hide-sm">Xóa</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
        </>
      )}
    </section>
  );
}
