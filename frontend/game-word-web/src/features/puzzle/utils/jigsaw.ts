// Logic thuần của game ghép hình: độ khó, hình dạng mảnh (có ngàm lồi/lõm), bố cục và rải mảnh.
// Mọi tọa độ dùng hệ "logic" rộng LOGICAL_WIDTH; giao diện chỉ co giãn cả khung nên không phụ thuộc kích thước màn hình.

export const MIN_GRID = 2;
export const MAX_GRID = 12;
export const LOGICAL_WIDTH = 1000;
/** Bề rộng logic của bố cục gọn dành cho điện thoại: khung ghép chiếm gần hết bề ngang nên mảnh đủ lớn để chạm */
export const COMPACT_LOGICAL_WIDTH = 520;
/** Màn hình hẹp hơn mức này (px) thì dùng bố cục gọn */
export const COMPACT_BREAKPOINT = 640;
/** Màn hình ngang thấp hơn mức này (px) thì xếp khung bên trái, khay bên phải để vừa chiều cao */
export const LANDSCAPE_MAX_HEIGHT = 520;

/** wide: khung ở giữa, khay phía dưới; compact: điện thoại dọc; landscape: điện thoại xoay ngang (khung | khay) */
export type LayoutMode = 'wide' | 'compact' | 'landscape';

export function pickLayoutMode(viewportWidth: number, viewportHeight: number): LayoutMode {
  if (viewportWidth > viewportHeight && viewportHeight < LANDSCAPE_MAX_HEIGHT && viewportWidth >= COMPACT_BREAKPOINT) {
    return 'landscape';
  }
  return viewportWidth < COMPACT_BREAKPOINT ? 'compact' : 'wide';
}

export interface Difficulty {
  id: string;
  label: string;
  rows: number;
  cols: number;
}

export const DIFFICULTIES: readonly Difficulty[] = [
  { id: 'easy', label: 'Dễ', rows: 3, cols: 3 },
  { id: 'medium', label: 'Vừa', rows: 4, cols: 4 },
  { id: 'hard', label: 'Khó', rows: 6, cols: 6 },
  { id: 'expert', label: 'Rất khó', rows: 8, cols: 8 },
];

export const CUSTOM_DIFFICULTY_ID = 'custom';

export function clampGrid(value: number): number {
  if (!Number.isFinite(value)) return MIN_GRID;
  return Math.min(MAX_GRID, Math.max(MIN_GRID, Math.round(value)));
}

/** Bộ sinh số ngẫu nhiên xác định theo seed (mulberry32), dùng để tái tạo cùng một hình dạng mảnh */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dấu của từng cạnh: 1 = ngàm lồi, -1 = lõm, 0 = cạnh phẳng (viền ngoài) */
export interface PieceEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Cạnh chung giữa hai mảnh kề nhau luôn lồi ở mảnh này và lõm ở mảnh kia nên ghép khít */
export function buildEdges(rows: number, cols: number, rng: () => number): PieceEdges[] {
  const sign = () => (rng() < 0.5 ? 1 : -1);
  // horizontal[r][c]: cạnh dọc giữa (r,c) và (r,c+1); vertical[r][c]: cạnh ngang giữa (r,c) và (r+1,c)
  const horizontal = Array.from({ length: rows }, () => Array.from({ length: cols - 1 }, sign));
  const vertical = Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, sign));
  const edges: PieceEdges[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      edges.push({
        top: r === 0 ? 0 : -vertical[r - 1][c],
        right: c === cols - 1 ? 0 : horizontal[r][c],
        bottom: r === rows - 1 ? 0 : vertical[r][c],
        left: c === 0 ? 0 : -horizontal[r][c - 1],
      });
    }
  }
  return edges;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  /** Chế độ bố cục: điện thoại (compact/landscape) được cộng thêm hệ số khớp vì màn hình nhỏ khó chơi hơn */
  mode: LayoutMode;
  width: number;
  height: number;
  /** Khung đặt ảnh hoàn chỉnh */
  board: Rect;
  rows: number;
  cols: number;
  cellW: number;
  cellH: number;
  /** Lề quanh mỗi mảnh để chứa ngàm lồi */
  pad: number;
  /** Khay nơi các mảnh được rải lúc đầu (dưới khung; bên phải khung khi xoay ngang) */
  tray: Rect;
  /** Hình mẫu thu nhỏ ở góc trên bên phải */
  thumb: Rect;
}

const BOARD_MAX_W = 640;
const BOARD_MAX_H = 500;
const BOARD_TOP = 24;
const TRAY_GAP = 40;
const TRAY_HEIGHT = 330;
const BOTTOM_MARGIN = 24;
// Kích thước ngàm tính theo cạnh ngắn của ô; chiều cao tối đa của ngàm là TAB_HEIGHT
const TAB_HEIGHT = 0.255;
const THUMB_MAX = 160;
const THUMB_MARGIN = 12;
// Chỗ chừa dưới hình mẫu thu nhỏ cho chú thích và khung viền (bố cục điện thoại dọc)
const COMPACT_THUMB_CAPTION = 34;

const LANDSCAPE_HEIGHT = 448;

/** `mode` nhận cả boolean cho tương thích: true = compact */
export function computeLayout(
  aspect: number,
  rows: number,
  cols: number,
  mode: LayoutMode | boolean = 'wide',
): Layout {
  const layoutMode: LayoutMode = typeof mode === 'boolean' ? (mode ? 'compact' : 'wide') : mode;
  const compact = layoutMode === 'compact';
  const landscape = layoutMode === 'landscape';
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const logicalWidth = compact ? COMPACT_LOGICAL_WIDTH : LOGICAL_WIDTH;
  // Điện thoại dọc: khung ghép chiếm gần hết bề ngang (chừa lề 2 bên), hình mẫu để ở hàng riêng phía trên
  const boardMaxW = landscape ? 560 : compact ? COMPACT_LOGICAL_WIDTH - 2 * 8 : BOARD_MAX_W;
  const boardMaxH = landscape ? 400 : compact ? 520 : BOARD_MAX_H;
  const thumbMax = landscape ? 120 : compact ? 84 : THUMB_MAX;
  const margin = compact ? 8 : THUMB_MARGIN;
  let w = boardMaxW;
  let h = w / safeAspect;
  if (h > boardMaxH) {
    h = boardMaxH;
    w = h * safeAspect;
  }
  const cellW = w / cols;
  const cellH = h / rows;
  const pad = Math.ceil(Math.min(cellW, cellH) * (TAB_HEIGHT + 0.03));
  const thumbW = safeAspect >= 1 ? thumbMax : thumbMax * safeAspect;
  const thumbH = safeAspect >= 1 ? thumbMax / safeAspect : thumbMax;
  // compact: hình mẫu ở hàng riêng phía trên khung (kèm chú thích) để khung không bị nhường lề phải;
  // landscape: khung sát trái, hình mẫu ở lề phải; wide: khung ở giữa, hình mẫu ở lề phải
  const thumbY = compact ? margin : BOARD_TOP;
  const boardY = compact ? thumbY + thumbH + COMPACT_THUMB_CAPTION : BOARD_TOP;
  const board = { x: landscape ? margin : (logicalWidth - w) / 2, y: boardY, w, h };
  const thumb = { x: logicalWidth - thumbW - margin, y: thumbY, w: thumbW, h: thumbH };

  if (landscape) {
    // Khung bên trái, khay bên phải (dưới hình mẫu): toàn bộ bố cục thấp để vừa màn hình ngang
    const trayX = board.x + w + 24;
    const trayY = thumb.y + thumbH + 10;
    return {
      mode: layoutMode,
      width: logicalWidth,
      height: LANDSCAPE_HEIGHT,
      thumb,
      board,
      rows,
      cols,
      cellW,
      cellH,
      pad,
      tray: { x: trayX, y: trayY, w: logicalWidth - trayX - 8, h: LANDSCAPE_HEIGHT - trayY - 8 },
    };
  }

  const trayTop = board.y + h + TRAY_GAP;
  return {
    mode: layoutMode,
    width: logicalWidth,
    height: trayTop + TRAY_HEIGHT + BOTTOM_MARGIN,
    thumb,
    board,
    rows,
    cols,
    cellW,
    cellH,
    pad,
    tray: { x: 0, y: trayTop, w: logicalWidth, h: TRAY_HEIGHT },
  };
}

export interface Point {
  x: number;
  y: number;
}

/** Mảnh nằm ở viền khung (có ít nhất một cạnh phẳng), gồm cả 4 mảnh góc */
export function isEdgePiece(index: number, rows: number, cols: number): boolean {
  const r = Math.floor(index / cols);
  const c = index % cols;
  return r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
}

export type PieceFilter = 'all' | 'edge' | 'inner';

/** Mảnh có hiện trong khay theo bộ lọc không */
export function matchesFilter(filter: PieceFilter, index: number, rows: number, cols: number): boolean {
  if (filter === 'all') return true;
  const edge = isEdgePiece(index, rows, cols);
  return filter === 'edge' ? edge : !edge;
}

/** Vị trí đúng (góc trên-trái của ô) của mảnh thứ index, theo thứ tự hàng rồi cột */
export function homePosition(layout: Layout, index: number): Point {
  const r = Math.floor(index / layout.cols);
  const c = index % layout.cols;
  return { x: layout.board.x + c * layout.cellW, y: layout.board.y + r * layout.cellH };
}

/** Rải ngẫu nhiên mọi mảnh vào dải phía dưới khung (cho phép chồng nhau) */
export function scatterPositions(layout: Layout, count: number, rng: () => number): Point[] {
  const minX = layout.tray.x + layout.pad;
  const maxX = Math.max(minX, layout.tray.x + layout.tray.w - layout.cellW - layout.pad);
  const minY = layout.tray.y + layout.pad;
  const maxY = Math.max(minY, layout.tray.y + layout.tray.h - layout.cellH - layout.pad);
  return Array.from({ length: count }, () => ({
    x: minX + rng() * (maxX - minX),
    y: minY + rng() * (maxY - minY),
  }));
}

/** Giữ ô của mảnh trong khung làm việc (phần ngàm lồi được phép chạm mép). Khung ghép nằm trọn trong vùng này nên
 *  mọi vị trí đúng đều với tới được. */
export function clampToWorkspace(layout: Layout, p: Point): Point {
  const maxX = layout.width - layout.cellW;
  const maxY = layout.height - layout.cellH;
  return { x: Math.min(maxX, Math.max(0, p.x)), y: Math.min(maxY, Math.max(0, p.y)) };
}

// Ngưỡng tự bắt vẫn sát để không thể dò vị trí đúng bằng cách rê mảnh quanh khung, nhưng đủ dễ ăn khi chơi:
// 8% cạnh ngắn của ô, kẹp trong khoảng [7, 18] đơn vị logic (đủ để chạm được trên điện thoại)
export const SNAP_RATIO = 0.08;
export const SNAP_MIN = 7;
export const SNAP_MAX = 18;

/** Độ tự động khớp của game (do quản trị đặt): phần trăm so với mức chuẩn. 8 = mức chuẩn ở trên, nhân tỉ lệ theo giá trị */
export const DEFAULT_SNAP_PERCENT = 8;
export const MIN_SNAP_PERCENT = 2;
export const MAX_SNAP_PERCENT = 20;
/** Màn hình điện thoại nhỏ, thao tác khó chính xác hơn máy tính nên ngưỡng tự động cộng thêm 20% */
export const MOBILE_SNAP_BOOST = 1.2;

export function clampSnapPercent(value: number | null | undefined): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return DEFAULT_SNAP_PERCENT;
  return Math.min(MAX_SNAP_PERCENT, Math.max(MIN_SNAP_PERCENT, value));
}

export function snapTolerance(layout: Layout, snapPercent: number | null | undefined = DEFAULT_SNAP_PERCENT): number {
  const base = Math.min(SNAP_MAX, Math.max(SNAP_MIN, Math.min(layout.cellW, layout.cellH) * SNAP_RATIO));
  const boost = layout.mode === 'wide' ? 1 : MOBILE_SNAP_BOOST;
  return base * (clampSnapPercent(snapPercent) / DEFAULT_SNAP_PERCENT) * boost;
}

/** Mảnh đang nằm sát vị trí đúng: viền sáng nhẹ khi kéo, thả ra thì tự nhảy về đúng chỗ */
export function isNearHome(
  layout: Layout,
  p: Point,
  index: number,
  snapPercent: number | null | undefined = DEFAULT_SNAP_PERCENT,
): boolean {
  const home = homePosition(layout, index);
  return Math.hypot(p.x - home.x, p.y - home.y) <= snapTolerance(layout, snapPercent);
}

// Đường cong một ngàm, tọa độ (lệch dọc theo cạnh so với tâm, chiều cao) tính theo đơn vị cạnh ngắn của ô
const TAB_CURVES: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [-0.16, 0.051, -0.22, 0.085, -0.22, 0.136],
  [-0.22, 0.221, -0.1, 0.255, 0, 0.255],
  [0.1, 0.255, 0.22, 0.221, 0.22, 0.136],
  [0.22, 0.085, 0.16, 0.051, 0.16, 0],
];

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

function edgePath(p0: Point, d: Point, length: number, unit: number, sign: number): string {
  const end = { x: p0.x + d.x * length, y: p0.y + d.y * length };
  if (sign === 0) return `L${fmt(end.x)} ${fmt(end.y)}`;
  // Pháp tuyến hướng ra ngoài khi đi vòng theo chiều kim đồng hồ
  const n = { x: d.y, y: -d.x };
  const at = (a: number, b: number) => ({
    x: p0.x + d.x * (length / 2 + a * unit) + n.x * sign * b * unit,
    y: p0.y + d.y * (length / 2 + a * unit) + n.y * sign * b * unit,
  });
  const start = at(-0.16, 0);
  let out = `L${fmt(start.x)} ${fmt(start.y)}`;
  for (const [x1, y1, x2, y2, x3, y3] of TAB_CURVES) {
    const a = at(x1, y1);
    const b = at(x2, y2);
    const c = at(x3, y3);
    out += `C${fmt(a.x)} ${fmt(a.y)} ${fmt(b.x)} ${fmt(b.y)} ${fmt(c.x)} ${fmt(c.y)}`;
  }
  return out + `L${fmt(end.x)} ${fmt(end.y)}`;
}

/** Đường viền SVG của một mảnh, tọa độ cục bộ (gốc tại góc hộp SVG, ô bắt đầu ở (pad, pad)) */
export function piecePath(layout: Layout, edges: PieceEdges): string {
  const { cellW: w, cellH: h, pad } = layout;
  const unit = Math.min(w, h);
  const tl = { x: pad, y: pad };
  const tr = { x: pad + w, y: pad };
  const br = { x: pad + w, y: pad + h };
  const bl = { x: pad, y: pad + h };
  return (
    `M${fmt(tl.x)} ${fmt(tl.y)}` +
    edgePath(tl, { x: 1, y: 0 }, w, unit, edges.top) +
    edgePath(tr, { x: 0, y: 1 }, h, unit, edges.right) +
    edgePath(br, { x: -1, y: 0 }, w, unit, edges.bottom) +
    edgePath(bl, { x: 0, y: -1 }, h, unit, edges.left) +
    'Z'
  );
}

/** m:ss hoặc m:ss.d */
export function formatDuration(ms: number, withTenths = false): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const base = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return withTenths ? `${base}.${Math.floor((safe % 1000) / 100)}` : base;
}

/** Tên độ khó theo số mảnh, dùng cho nhãn trên thẻ game */
export function difficultyLabel(rows: number, cols: number): string {
  const pieces = rows * cols;
  if (pieces <= 9) return 'Dễ';
  if (pieces <= 16) return 'Vừa';
  if (pieces <= 36) return 'Khó';
  return 'Rất khó';
}
