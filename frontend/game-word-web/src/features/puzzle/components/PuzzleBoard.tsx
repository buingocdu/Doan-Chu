import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Eye, EyeOff, Lightbulb, LogOut, Timer } from 'lucide-react';
import JigsawPiece from './JigsawPiece';
import {
  buildEdges,
  clampToWorkspace,
  computeLayout,
  createRng,
  formatDuration,
  homePosition,
  isNearHome,
  piecePath,
  scatterPositions,
  type Point,
} from '../utils/jigsaw';

export interface PuzzleResult {
  durationMs: number;
  moves: number;
  hintsUsed: number;
}

interface PuzzleBoardProps {
  imageUrl: string;
  /** Tỉ lệ rộng/cao của ảnh */
  aspect: number;
  rows: number;
  cols: number;
  /** Hiện ảnh mờ làm nền trên khung */
  showGhost: boolean;
  onFinish: (result: PuzzleResult) => void;
  onExit: () => void;
}

interface DragState {
  index: number;
  pointerId: number;
  startPointer: Point;
  startPos: Point;
}

export default function PuzzleBoard({ imageUrl, aspect, rows, cols, showGhost, onFinish, onExit }: PuzzleBoardProps) {
  const total = rows * cols;
  const layout = useMemo(() => computeLayout(aspect, rows, cols), [aspect, rows, cols]);
  // Seed cố định trong suốt ván: hình dạng mảnh và cách rải không đổi khi render lại
  const seed = useMemo(() => Math.floor(Math.random() * 2 ** 31), []);
  const edges = useMemo(() => buildEdges(rows, cols, createRng(seed)), [rows, cols, seed]);
  const paths = useMemo(() => edges.map((e) => piecePath(layout, e)), [edges, layout]);

  const [positions, setPositions] = useState<Point[]>(() =>
    scatterPositions(layout, total, createRng(seed ^ 0x9e3779b9)),
  );
  const [placed, setPlaced] = useState<boolean[]>(() => Array<boolean>(total).fill(false));
  const [zOrder, setZOrder] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i + 2));
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [scale, setScale] = useState(1);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const zCounter = useRef(total + 2);
  const startRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // Co giãn cả khung theo bề rộng khả dụng (toạ độ logic giữ nguyên)
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(width / layout.width);
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout.width]);

  const placedCount = useMemo(() => placed.filter(Boolean).length, [placed]);
  const done = placedCount === total;

  // Đồng hồ chạy từ lần chạm đầu tiên vào một mảnh
  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      if (startRef.current !== null) setElapsed(performance.now() - startRef.current);
    }, 200);
    return () => window.clearInterval(timer);
  }, [done]);

  useEffect(() => {
    if (!done || finishedRef.current) return;
    finishedRef.current = true;
    const durationMs = Math.round(startRef.current === null ? 0 : performance.now() - startRef.current);
    setElapsed(durationMs);
    onFinish({ durationMs, moves, hintsUsed });
    // chỉ chạy một lần khi hoàn thành
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Bản sao đồng bộ của vị trí: sự kiện con trỏ đến dồn dập, không đợi React render xong
  const positionsRef = useRef(positions);

  const commitPositions = (next: Point[]) => {
    positionsRef.current = next;
    setPositions(next);
  };

  const placedRef = useRef(placed);

  const markPlaced = (index: number) => {
    const next = placedRef.current.slice();
    next[index] = true;
    placedRef.current = next;
    setPlaced(next);
  };

  const handlePointerDown = useCallback((index: number, event: PointerEvent<HTMLDivElement>) => {
    if (finishedRef.current || event.button > 0) return;
    if (startRef.current === null) startRef.current = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    zCounter.current += 1;
    const z = zCounter.current;
    setZOrder((prev) => {
      const next = prev.slice();
      next[index] = z;
      return next;
    });
    dragRef.current = {
      index,
      pointerId: event.pointerId,
      startPointer: { x: event.clientX, y: event.clientY },
      startPos: positionsRef.current[index],
    };
    setDraggingIndex(index);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const k = scaleRef.current || 1;
      const next = positionsRef.current.slice();
      next[drag.index] = clampToWorkspace(layout, {
        x: drag.startPos.x + (event.clientX - drag.startPointer.x) / k,
        y: drag.startPos.y + (event.clientY - drag.startPointer.y) / k,
      });
      commitPositions(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDraggingIndex(null);
      setMoves((m) => m + 1);
      if (isNearHome(layout, positionsRef.current[drag.index], drag.index)) {
        const next = positionsRef.current.slice();
        next[drag.index] = homePosition(layout, drag.index);
        commitPositions(next);
        markPlaced(drag.index);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout],
  );

  // Cách chơi thay thế không cần kéo thả: tự đặt một mảnh đúng chỗ (không tính vào bảng xếp hạng)
  const placeHint = () => {
    const remaining = placedRef.current.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
    if (remaining.length === 0 || finishedRef.current) return;
    if (startRef.current === null) startRef.current = performance.now();
    const index = remaining[Math.floor(Math.random() * remaining.length)];
    const next = positionsRef.current.slice();
    next[index] = homePosition(layout, index);
    commitPositions(next);
    markPlaced(index);
    setHintsUsed((h) => h + 1);
  };

  const { board } = layout;
  return (
    <div className="puzzle-play">
      <div className="puzzle-toolbar" role="group" aria-label="Thông tin ván chơi">
        <span className="puzzle-stat" aria-label={`Thời gian ${formatDuration(elapsed)}`}>
          <Timer size={16} aria-hidden="true" /> {formatDuration(elapsed)}
        </span>
        <span className="puzzle-stat">
          Đã đặt {placedCount}/{total}
        </span>
        <span className="puzzle-stat">{moves} lượt kéo</span>
        <span className="puzzle-toolbar-spacer" />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-pressed={showPreview}
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          {showPreview ? 'Ẩn ảnh mẫu' : 'Xem ảnh mẫu'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={placeHint} disabled={done}>
          <Lightbulb size={16} aria-hidden="true" /> Gợi ý
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExit}>
          <LogOut size={16} aria-hidden="true" /> Thoát
        </button>
      </div>
      {hintsUsed > 0 && (
        <p className="puzzle-note" role="status">
          Bạn đã dùng gợi ý nên ván này không được ghi vào bảng xếp hạng.
        </p>
      )}

      <div ref={stageRef} className="puzzle-stage" style={{ height: layout.height * scale }}>
        <div
          className="puzzle-world"
          style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}
        >
          <div
            className="puzzle-tray"
            style={{ left: layout.tray.x, top: layout.tray.y, width: layout.tray.w, height: layout.tray.h }}
            aria-hidden="true"
          />
          <div
            className="puzzle-board"
            style={{ left: board.x, top: board.y, width: board.w, height: board.h }}
            aria-hidden="true"
          >
            {showGhost && <img src={imageUrl} alt="" draggable={false} className="puzzle-ghost" />}
            <svg width={board.w} height={board.h} className="puzzle-grid">
              {Array.from({ length: cols - 1 }, (_, i) => (
                <line key={`c${i}`} x1={(i + 1) * layout.cellW} y1={0} x2={(i + 1) * layout.cellW} y2={board.h} />
              ))}
              {Array.from({ length: rows - 1 }, (_, i) => (
                <line key={`r${i}`} x1={0} y1={(i + 1) * layout.cellH} x2={board.w} y2={(i + 1) * layout.cellH} />
              ))}
            </svg>
          </div>

          {paths.map((path, index) => (
            <JigsawPiece
              key={index}
              index={index}
              row={Math.floor(index / cols)}
              col={index % cols}
              path={path}
              imageUrl={imageUrl}
              boardW={board.w}
              boardH={board.h}
              cellW={layout.cellW}
              cellH={layout.cellH}
              pad={layout.pad}
              x={positions[index].x}
              y={positions[index].y}
              z={placed[index] ? 1 : zOrder[index]}
              placed={placed[index]}
              dragging={draggingIndex === index}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          ))}

          {showPreview && (
            <img
              src={imageUrl}
              alt="Ảnh mẫu"
              draggable={false}
              className="puzzle-preview"
              style={{ left: board.x, top: board.y, width: board.w, height: board.h, zIndex: zCounter.current + 10 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
