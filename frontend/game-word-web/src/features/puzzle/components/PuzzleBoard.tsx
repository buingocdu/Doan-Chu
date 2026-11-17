import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Eye, EyeOff, Lightbulb, LogOut, Maximize, Minimize, Timer } from 'lucide-react';
import JigsawPiece from './JigsawPiece';
import { clampGroupDelta, findMerge, layoutAllPieces, membersOf, mergeGroups } from '../utils/cluster';
import {
  buildEdges,
  computeLayout,
  createRng,
  formatDuration,
  homePosition,
  isNearHome,
  matchesFilter,
  pickLayoutMode,
  piecePath,
  scatterPositions,
  type LayoutMode,
  type PieceFilter,
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
  onFinish: (result: PuzzleResult) => void;
  onExit: () => void;
}

interface DragState {
  pointerId: number;
  startPointer: Point;
  /** Các mảnh trong cụm đang kéo (một mảnh lẻ thì chỉ có chính nó) và vị trí lúc bắt đầu kéo */
  members: number[];
  starts: Point[];
}

export default function PuzzleBoard({ imageUrl, aspect, rows, cols, onFinish, onExit }: PuzzleBoardProps) {
  const total = rows * cols;
  // Bố cục theo kích thước màn hình; xoay ngang/dọc thì đổi chế độ và xếp lại mảnh (giữ nguyên tiến độ)
  const [mode, setMode] = useState<LayoutMode>(() => pickLayoutMode(window.innerWidth, window.innerHeight));
  const layout = useMemo(() => computeLayout(aspect, rows, cols, mode), [aspect, rows, cols, mode]);
  // Seed cố định trong suốt ván: hình dạng mảnh và cách rải không đổi khi render lại
  const seed = useMemo(() => Math.floor(Math.random() * 2 ** 31), []);
  const edges = useMemo(() => buildEdges(rows, cols, createRng(seed)), [rows, cols, seed]);
  const paths = useMemo(() => edges.map((e) => piecePath(layout, e)), [edges, layout]);

  const [positions, setPositions] = useState<Point[]>(() =>
    scatterPositions(layout, total, createRng(seed ^ 0x9e3779b9)),
  );
  const [placed, setPlaced] = useState<boolean[]>(() => Array<boolean>(total).fill(false));
  // Cụm: các mảnh cùng id đã ghép với nhau ở ngoài khung và di chuyển như một khối
  const [groups, setGroups] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i));
  const [zOrder, setZOrder] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i + 2));
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [filter, setFilter] = useState<PieceFilter>('all');
  const [glowGroup, setGlowGroup] = useState<number | null>(null);
  const [flashIds, setFlashIds] = useState<number[]>([]);
  const flashTimer = useRef<number | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const zCounter = useRef(total + 2);
  const startRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const scrollBeforeFullscreen = useRef(0);
  const wasFullscreen = useRef(false);

  // Theo dõi xoay màn hình / đổi kích thước cửa sổ để chọn bố cục phù hợp. Chờ kích thước ổn định rồi mới đổi:
  // khi vào/thoát toàn màn hình hoặc xoay máy, trình duyệt báo kích thước tạm thời sai rồi mới báo kích thước cuối.
  useEffect(() => {
    let timer: number | undefined;
    const update = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMode(pickLayoutMode(window.innerWidth, window.innerHeight)), 150);
    };
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    document.addEventListener('fullscreenchange', update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.removeEventListener('fullscreenchange', update);
    };
  }, []);

  // Co giãn cả khung (toạ độ logic giữ nguyên): theo bề rộng khả dụng; khi xoay ngang/toàn màn hình còn phải vừa chiều cao
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      let next = width / layout.width;
      if (mode === 'landscape' || fullscreen) {
        // Toàn màn hình là lớp phủ cố định (không cuộn); còn lại tính theo vị trí trong trang
        const rect = el.getBoundingClientRect();
        const top = fullscreen ? rect.top : rect.top + window.scrollY;
        const available = window.innerHeight - top - 8;
        next = Math.min(next, Math.max(0.35, available / layout.height));
      }
      setScale(next);
    };
    update();
    // Đo lại sau khi trình duyệt đã đổi xong kích thước (vào/thoát toàn màn hình, xoay máy)
    const settle = [120, 350].map((ms) => window.setTimeout(update, ms));
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    document.addEventListener('fullscreenchange', update);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(el);
    return () => {
      settle.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.removeEventListener('fullscreenchange', update);
      observer?.disconnect();
    };
  }, [layout.width, layout.height, mode, fullscreen]);

  // Toàn màn hình: dùng Fullscreen API khi có; không có (vd iPhone Safari) thì lớp phủ CSS cũng che kín trang
  useEffect(() => {
    const onChange = () => {
      // Người dùng thoát bằng phím Esc / cử chỉ hệ thống
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Khoá cuộn trang phía sau; thoát toàn màn hình thì trả lại đúng vị trí cuộn trước đó
  useEffect(() => {
    if (fullscreen) {
      document.body.classList.add('puzzle-fullscreen-lock');
      wasFullscreen.current = true;
      return () => document.body.classList.remove('puzzle-fullscreen-lock');
    }
    if (!wasFullscreen.current) return;
    wasFullscreen.current = false;
    const restore = () => {
      if (scrollBeforeFullscreen.current > 0) window.scrollTo(0, scrollBeforeFullscreen.current);
    };
    restore();
    const late = window.setTimeout(restore, 200);
    return () => window.clearTimeout(late);
  }, [fullscreen]);

  useEffect(
    () => () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    },
    [],
  );

  const toggleFullscreen = () => {
    if (fullscreen) {
      setFullscreen(false);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      return;
    }
    scrollBeforeFullscreen.current = window.scrollY;
    setFullscreen(true);
    const el = rootRef.current;
    if (el && typeof el.requestFullscreen === 'function') {
      // Bị từ chối thì vẫn còn lớp phủ CSS
      void el.requestFullscreen().catch(() => undefined);
    }
  };

  const placedCount = useMemo(() => placed.filter(Boolean).length, [placed]);
  const done = placedCount === total;
  const remainingEdge = useMemo(
    () => placed.filter((p, i) => !p && matchesFilter('edge', i, rows, cols)).length,
    [placed, rows, cols],
  );
  const remainingInner = total - placedCount - remainingEdge;
  // Số mảnh của cụm chứa từng mảnh (cụm từ 2 mảnh trở lên luôn hiện dù bộ lọc đang ẩn nhóm của chúng)
  const groupSize = useMemo(() => {
    const counts = new Map<number, number>();
    groups.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
    return groups.map((g) => counts.get(g) ?? 1);
  }, [groups]);

  // Đồng hồ chạy từ lần chạm đầu tiên vào một mảnh
  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      if (startRef.current !== null) setElapsed(performance.now() - startRef.current);
    }, 200);
    return () => window.clearInterval(timer);
  }, [done]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  useEffect(() => {
    if (!done || finishedRef.current) return;
    finishedRef.current = true;
    const durationMs = Math.round(startRef.current === null ? 0 : performance.now() - startRef.current);
    setElapsed(durationMs);
    onFinish({ durationMs, moves, hintsUsed });
    // chỉ chạy một lần khi hoàn thành
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Bản sao đồng bộ: sự kiện con trỏ đến dồn dập, không đợi React render xong
  const positionsRef = useRef(positions);
  const placedRef = useRef(placed);
  const groupsRef = useRef(groups);

  const commitPositions = (next: Point[]) => {
    positionsRef.current = next;
    setPositions(next);
  };

  const commitGroups = (next: number[]) => {
    groupsRef.current = next;
    setGroups(next);
  };

  // Loé sáng viền một lúc ngắn khi mảnh dính vào khung hoặc vào mảnh khác
  const flash = (ids: number[]) => {
    setFlashIds(ids);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashIds([]), 600);
  };

  const markPlaced = (ids: number[]) => {
    const next = placedRef.current.slice();
    ids.forEach((i) => {
      next[i] = true;
    });
    placedRef.current = next;
    setPlaced(next);
    flash(ids);
  };

  // Đổi bố cục (xoay màn hình): mảnh đã đặt về đúng chỗ mới, mỗi cụm chưa đặt rải lại như một khối vào khay mới
  const layoutRef = useRef(layout);
  const remapCount = useRef(0);
  useEffect(() => {
    if (layoutRef.current === layout) return;
    layoutRef.current = layout;
    remapCount.current += 1;
    commitPositions(
      layoutAllPieces(layout, groupsRef.current, placedRef.current, createRng(seed ^ (0x85ebca6b + remapCount.current))),
    );
    dragRef.current = null;
    setDraggingIndex(null);
    setGlowGroup(null);
    // chỉ phản ứng khi layout đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Cụm (hoặc mảnh lẻ) đang ở sát vị trí đúng trên khung, hoặc sát một mảnh kề để ghép
  const isSnapReady = (ids: number[], pos: Point[]) =>
    ids.some((i) => isNearHome(layout, pos[i], i)) ||
    findMerge(layout, pos, groupsRef.current, placedRef.current, ids) !== null;

  const handlePointerDown = useCallback((index: number, event: PointerEvent<HTMLDivElement>) => {
    if (finishedRef.current || event.button > 0) return;
    if (startRef.current === null) startRef.current = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    const members = membersOf(groupsRef.current, index);
    // Đưa cả cụm lên trên cùng, giữ nguyên thứ tự xếp chồng trong cụm
    const base = zCounter.current;
    zCounter.current += members.length;
    setZOrder((prev) => {
      const next = prev.slice();
      members.forEach((m, k) => {
        next[m] = base + 1 + k;
      });
      return next;
    });
    dragRef.current = {
      pointerId: event.pointerId,
      startPointer: { x: event.clientX, y: event.clientY },
      members,
      starts: members.map((m) => positionsRef.current[m]),
    };
    setDraggingIndex(index);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const k = scaleRef.current || 1;
      const delta = clampGroupDelta(
        layout,
        drag.starts,
        (event.clientX - drag.startPointer.x) / k,
        (event.clientY - drag.startPointer.y) / k,
      );
      const next = positionsRef.current.slice();
      drag.members.forEach((m, i) => {
        next[m] = { x: drag.starts[i].x + delta.x, y: drag.starts[i].y + delta.y };
      });
      commitPositions(next);
      const ready = isSnapReady(drag.members, next);
      const id = groupsRef.current[drag.members[0]];
      setGlowGroup((prev) => (ready ? id : prev === id ? null : prev));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout],
  );

  // Thả cụm: sát vị trí đúng thì cả cụm dính vào khung; không thì ghép với mảnh kề đúng chỗ (có thể nhiều lần liên tiếp)
  const settle = (members: number[]) => {
    const pos = positionsRef.current.slice();
    let ids = members;
    const snapToBoard = (group: number[]): boolean => {
      const anchor = group.find((i) => isNearHome(layout, pos[i], i));
      if (anchor === undefined) return false;
      const home = homePosition(layout, anchor);
      const dx = home.x - pos[anchor].x;
      const dy = home.y - pos[anchor].y;
      group.forEach((i) => {
        pos[i] = { x: pos[i].x + dx, y: pos[i].y + dy };
      });
      return true;
    };

    if (snapToBoard(ids)) {
      commitPositions(pos);
      markPlaced(ids);
      return;
    }
    let nextGroups = groupsRef.current;
    let merged = false;
    for (let guard = 0; guard < total; guard++) {
      const match = findMerge(layout, pos, nextGroups, placedRef.current, ids);
      if (!match) break;
      ids.forEach((i) => {
        pos[i] = { x: pos[i].x + match.shift.x, y: pos[i].y + match.shift.y };
      });
      nextGroups = mergeGroups(nextGroups, match.target, match.moving);
      ids = membersOf(nextGroups, match.target);
      merged = true;
    }
    if (!merged) return;
    commitGroups(nextGroups);
    if (snapToBoard(ids)) {
      commitPositions(pos);
      markPlaced(ids);
    } else {
      commitPositions(pos);
      flash(ids);
    }
  };

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDraggingIndex(null);
      setGlowGroup(null);
      setMoves((m) => m + 1);
      settle(drag.members);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout],
  );

  // Hệ điều hành huỷ thao tác (vd chụm hai ngón để zoom): bỏ lượt kéo, không tính lượt, không bắt vào khung
  const handlePointerCancel = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDraggingIndex(null);
    setGlowGroup(null);
  }, []);

  // Cách chơi thay thế không cần kéo thả: tự đặt một mảnh (cả cụm của nó) đúng chỗ (không tính vào bảng xếp hạng)
  const placeHint = () => {
    const unplaced = placedRef.current.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
    if (unplaced.length === 0 || finishedRef.current) return;
    // Gợi ý chọn trong nhóm mảnh đang lọc; hết nhóm đó thì lấy bất kỳ mảnh nào còn lại
    const filtered = unplaced.filter((i) => matchesFilter(filter, i, rows, cols));
    const remaining = filtered.length > 0 ? filtered : unplaced;
    if (startRef.current === null) startRef.current = performance.now();
    const index = remaining[Math.floor(Math.random() * remaining.length)];
    const members = membersOf(groupsRef.current, index);
    const next = positionsRef.current.slice();
    members.forEach((m) => {
      next[m] = homePosition(layout, m);
    });
    commitPositions(next);
    markPlaced(members);
    setHintsUsed((h) => h + 1);
  };

  const { board } = layout;
  return (
    <div ref={rootRef} className={`puzzle-play${fullscreen ? ' is-fullscreen' : ''}`}>
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
          {showPreview ? 'Thu nhỏ ảnh mẫu' : 'Phóng to ảnh mẫu'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={placeHint} disabled={done}>
          <Lightbulb size={16} aria-hidden="true" /> Gợi ý
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <Minimize size={16} aria-hidden="true" /> : <Maximize size={16} aria-hidden="true" />}
          {fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExit}>
          <LogOut size={16} aria-hidden="true" /> Thoát
        </button>
      </div>
      <div className="puzzle-filter" role="group" aria-label="Lọc mảnh trong khay">
        <span className="puzzle-filter-label">Hiện:</span>
        <button
          type="button"
          className={`puzzle-chip${filter === 'all' ? ' is-active' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          Tất cả ({total - placedCount})
        </button>
        <button
          type="button"
          className={`puzzle-chip${filter === 'edge' ? ' is-active' : ''}`}
          aria-pressed={filter === 'edge'}
          onClick={() => setFilter('edge')}
        >
          Mảnh viền ({remainingEdge})
        </button>
        <button
          type="button"
          className={`puzzle-chip${filter === 'inner' ? ' is-active' : ''}`}
          aria-pressed={filter === 'inner'}
          onClick={() => setFilter('inner')}
        >
          Mảnh trong ({remainingInner})
        </button>
      </div>
      {!done && filter !== 'all' && (filter === 'edge' ? remainingEdge : remainingInner) === 0 && (
        <p className="puzzle-note" role="status">
          {filter === 'edge' ? 'Đã ghép hết mảnh viền.' : 'Đã ghép hết mảnh trong.'} Chọn “Tất cả” hoặc nhóm còn lại để
          tiếp tục.
        </p>
      )}
      {hintsUsed > 0 && (
        <p className="puzzle-note" role="status">
          Bạn đã dùng gợi ý nên ván này không được ghi vào bảng xếp hạng.
        </p>
      )}

      <div ref={wrapRef} className="puzzle-stage-wrap">
        <div
          className="puzzle-stage"
          style={{ width: layout.width * scale, height: layout.height * scale }}
        >
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
            </div>

            <figure
              className="puzzle-thumb-ref"
              style={{ left: layout.thumb.x, top: layout.thumb.y, width: layout.thumb.w }}
            >
              <img src={imageUrl} alt="Hình mẫu" draggable={false} style={{ height: layout.thumb.h }} />
              <figcaption>Hình mẫu</figcaption>
            </figure>

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
                glow={glowGroup !== null && groups[index] === glowGroup}
                flash={flashIds.includes(index)}
                hidden={!placed[index] && groupSize[index] === 1 && !matchesFilter(filter, index, rows, cols)}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
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
    </div>
  );
}
