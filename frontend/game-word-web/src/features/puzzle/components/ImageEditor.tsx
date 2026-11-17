import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { RotateCcw, RotateCw, X } from 'lucide-react';
import { editPuzzleImage, getErrorMessage } from '../../../services/api';
import { useAdminImageSrc } from '../hooks/useAdminImageSrc';
import {
  ASPECTS,
  cropPixels,
  FULL_RECT,
  fitAspectRect,
  fractionRatio,
  isFullRect,
  moveRect,
  resizeRect,
  rotatedSize,
  type CropHandle,
  type CropRect,
} from '../utils/cropMath';
import type { PuzzleImage } from '../../../types/api';

/** Cạnh ngắn tối thiểu của ảnh sau khi sửa (khớp puzzle.min-image-side ở backend) */
const MIN_SIDE = 300;

const HANDLES: readonly CropHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

interface ImageEditorProps {
  image: PuzzleImage;
  /** Số game đang dùng ảnh này, để cảnh báo khi sửa trực tiếp */
  gameCount: number;
  onClose: () => void;
  onSaved: (updated: PuzzleImage, asCopy: boolean) => void;
}

interface DragState {
  pointerId: number;
  handle: CropHandle | 'move';
  startX: number;
  startY: number;
  boxW: number;
  boxH: number;
  start: CropRect;
}

export default function ImageEditor({ image, gameCount, onClose, onSaved }: ImageEditorProps) {
  const { src } = useAdminImageSrc(image);
  const [turns, setTurns] = useState(0);
  const [rect, setRect] = useState<CropRect>(FULL_RECT);
  const [aspectId, setAspectId] = useState('free');
  const [asCopy, setAsCopy] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const size = rotatedSize(image.width, image.height, turns);
  const aspect = ASPECTS.find((a) => a.id === aspectId)?.ratio ?? null;
  const lockRatio = aspect === null ? null : fractionRatio(aspect, size.width, size.height);
  const result = cropPixels(rect, size.width, size.height);
  const tooSmall = Math.min(result.width, result.height) < MIN_SIDE;
  const normalizedTurns = ((turns % 4) + 4) % 4;
  const changed = normalizedTurns !== 0 || !isFullRect(rect);
  const canSave = !saving && !tooSmall && (changed || asCopy);

  // Esc đóng hộp thoại; khoá cuộn trang phía sau
  useEffect(() => {
    dialogRef.current?.focus();
    document.body.classList.add('puzzle-fullscreen-lock');
    return () => document.body.classList.remove('puzzle-fullscreen-lock');
  }, []);

  const rotate = (delta: number) => {
    const nextTurns = turns + delta;
    const nextSize = rotatedSize(image.width, image.height, nextTurns);
    setTurns(nextTurns);
    // Vùng cắt tính theo ảnh đã xoay nên đặt lại; còn giữ khoá tỉ lệ thì dựng lại vùng đúng tỉ lệ
    setRect(aspect === null ? FULL_RECT : fitAspectRect(aspect, nextSize.width, nextSize.height));
  };

  const chooseAspect = (id: string) => {
    setAspectId(id);
    const ratio = ASPECTS.find((a) => a.id === id)?.ratio ?? null;
    if (ratio !== null) setRect((r) => fitAspectRect(ratio, size.width, size.height, r));
  };

  const reset = () => {
    setTurns(0);
    setRect(FULL_RECT);
    setAspectId('free');
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || e.button > 0) return;
    const target = (e.target as HTMLElement).dataset.handle as CropHandle | undefined;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      handle: target ?? 'move',
      startX: e.clientX,
      startY: e.clientY,
      boxW: box.width,
      boxH: box.height,
      start: rect,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = (e.clientX - drag.startX) / drag.boxW;
    const dy = (e.clientY - drag.startY) / drag.boxH;
    setRect(
      drag.handle === 'move' ? moveRect(drag.start, dx, dy) : resizeRect(drag.start, drag.handle, dx, dy, lockRatio),
    );
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  // Bàn phím: phím mũi tên dời vùng cắt 1%; kèm Shift thì đổi kích thước (góc phải-dưới)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 0.01;
    const dir: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const d = dir[e.key];
    if (!d) return;
    e.preventDefault();
    setRect((r) => (e.shiftKey ? resizeRect(r, 'se', d[0], d[1], lockRatio) : moveRect(r, d[0], d[1])));
  };

  const imgStyle = useMemo(() => {
    const odd = normalizedTurns % 2 === 1;
    return {
      width: odd ? `${(100 * image.width) / image.height}%` : '100%',
      aspectRatio: `${image.width} / ${image.height}`,
      transform: `translate(-50%, -50%) rotate(${normalizedTurns * 90}deg)`,
    };
  }, [image.width, image.height, normalizedTurns]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await editPuzzleImage(image.id, {
        degrees: normalizedTurns * 90,
        ...(isFullRect(rect) ? {} : { cropX: rect.x, cropY: rect.y, cropWidth: rect.w, cropHeight: rect.h }),
        asCopy,
        ...(asCopy && title.trim() ? { title: title.trim() } : {}),
      });
      onSaved(updated, asCopy);
    } catch (err) {
      setError(getErrorMessage(err, 'Không lưu được ảnh.'));
      setSaving(false);
    }
  };

  const pct = (v: number) => `${v * 100}%`;
  return (
    <div className="editor-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="editor-dialog card"
        role="dialog"
        aria-modal="true"
        aria-label={`Sửa ảnh ${image.title}`}
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="editor-head">
          <h2 className="section-title">Sửa ảnh · {image.title}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Đóng">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="editor-tools" role="group" aria-label="Xoay ảnh">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => rotate(-1)}>
            <RotateCcw size={16} aria-hidden="true" /> Xoay trái
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => rotate(1)}>
            <RotateCw size={16} aria-hidden="true" /> Xoay phải
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset} disabled={!changed && aspectId === 'free'}>
            Đặt lại
          </button>
        </div>

        <div className="editor-aspects" role="group" aria-label="Tỉ lệ khung cắt">
          <span className="puzzle-filter-label">Tỉ lệ:</span>
          {ASPECTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`puzzle-chip${aspectId === a.id ? ' is-active' : ''}`}
              aria-pressed={aspectId === a.id}
              onClick={() => chooseAspect(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="editor-stage">
          <div
            ref={boxRef}
            className="editor-box"
            style={{
              aspectRatio: `${size.width} / ${size.height}`,
              // Giới hạn theo chiều rộng (không dùng max-height để không làm méo tỉ lệ khung cắt)
              maxWidth: `min(560px, calc(60vh * ${size.width / size.height}))`,
            }}
            data-testid="editor-box"
          >
            {src && <img className="editor-img" src={src} alt="" draggable={false} style={imgStyle} />}
            <div
              className="crop-rect"
              role="group"
              aria-label="Vùng cắt (dùng phím mũi tên để dời, giữ Shift để đổi kích thước)"
              tabIndex={0}
              data-testid="crop-rect"
              style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKeyDown}
            >
              {HANDLES.filter((h) => lockRatio === null || h.length === 2).map((h) => (
                <span key={h} className={`crop-handle crop-${h}`} data-handle={h} />
              ))}
            </div>
          </div>
        </div>

        <p className={`editor-size${tooSmall ? ' is-bad' : ''}`} role="status">
          Ảnh sau khi sửa: {result.width}×{result.height} px
          {tooSmall ? ` — cạnh ngắn cần tối thiểu ${MIN_SIDE}px, hãy chọn vùng lớn hơn.` : ''}
        </p>

        {gameCount > 0 && !asCopy && (
          <p className="puzzle-note">
            Ảnh đang được dùng trong {gameCount} game. Sửa trực tiếp sẽ đổi hình của các game đó; chọn “Lưu thành ảnh mới”
            để giữ nguyên ảnh gốc.
          </p>
        )}

        <label className="admin-check">
          <input type="checkbox" checked={asCopy} onChange={(e) => setAsCopy(e.target.checked)} />
          Lưu thành ảnh mới (giữ nguyên ảnh gốc)
        </label>
        {asCopy && (
          <div className="field">
            <label htmlFor="editor-title">Tên ảnh mới</label>
            <input
              id="editor-title"
              type="text"
              maxLength={100}
              value={title}
              placeholder={`${image.title} (đã sửa)`}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <div className="puzzle-actions">
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={!canSave}>
            {saving ? 'Đang lưu…' : asCopy ? 'Lưu ảnh mới' : 'Lưu thay đổi'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
