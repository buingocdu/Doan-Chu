// Logic thuần của game ghép hình: độ khó, hình dạng mảnh (có ngàm lồi/lõm), bố cục và rải mảnh.
// Mọi tọa độ dùng hệ "logic" rộng LOGICAL_WIDTH; giao diện chỉ co giãn cả khung nên không phụ thuộc kích thước màn hình.

export const MIN_GRID = 2;
export const MAX_GRID = 12;
export const LOGICAL_WIDTH = 1000;
/** Bề rộng logic của bố cục gọn dành cho điện thoại: khung ghép chiếm gần hết bề ngang nên mảnh đủ lớn để chạm */
export const COMPACT_LOGICAL_WIDTH = 520;
/** Màn hình hẹp hơn mức này (px) thì dùng bố cục gọn */
export const COMPACT_BREAKPOINT = 640;

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
  /** Dải phía dưới khung, nơi các mảnh được rải lúc đầu */
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

export function computeLayout(aspect: number, rows: number, cols: number, compact = false): Layout {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const logicalWidth = compact ? COMPACT_LOGICAL_WIDTH : LOGICAL_WIDTH;
  const boardMaxW = compact ? 400 : BOARD_MAX_W;
  const boardMaxH = compact ? 520 : BOARD_MAX_H;
  const thumbMax = compact ? 100 : THUMB_MAX;
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
  // Bố cục gọn: khung sát trái, hình mẫu ở lề phải; bố cục rộng: khung ở giữa
  const board = { x: compact ? margin : (logicalWidth - w) / 2, y: BOARD_TOP, w, h };
  const trayTop = board.y + h + TRAY_GAP;
  const tray = { x: 0, y: trayTop, w: logicalWidth, h: TRAY_HEIGHT };
  // Hình mẫu thu nhỏ nằm trong lề phải của khung (khung rộng tối đa 640 nên không đè lên nhau)
  const thumbW = safeAspect >= 1 ? thumbMax : thumbMax * safeAspect;
  const thumbH = safeAspect >= 1 ? thumbMax / safeAspect : thumbMax;
  const thumb = { x: logicalWidth - thumbW - margin, y: BOARD_TOP, w: thumbW, h: thumbH };
  return {
    width: logicalWidth,
    height: trayTop + TRAY_HEIGHT + BOTTOM_MARGIN,
    thumb,
    board,
    rows,
    cols,
    cellW,
    cellH,
    pad,
    tray,
  };
}

export interface Point {
  x: number;
  y: number;
}

/** Vị trí đúng (góc trên-trái của ô) của mảnh thứ index, theo thứ tự hàng rồi cột */
export function homePosition(layout: Layout, index: number): Point {
  const r = Math.floor(index / layout.cols);
  const c = index % layout.cols;
  return { x: layout.board.x + c * layout.cellW, y: layout.board.y + r * layout.cellH };
}

/** Rải ngẫu nhiên mọi mảnh vào dải phía dưới khung (cho phép chồng nhau) */
export function scatterPositions(layout: Layout, count: number, rng: () => number): Point[] {
  const minX = layout.pad;
  const maxX = Math.max(minX, layout.width - layout.cellW - layout.pad);
  const minY = layout.tray.y + layout.pad;
  const maxY = Math.max(minY, layout.tray.y + layout.tray.h - layout.cellH - layout.pad);
  return Array.from({ length: count }, () => ({
    x: minX + rng() * (maxX - minX),
    y: minY + rng() * (maxY - minY),
  }));
}

/** Giữ mảnh trong khung làm việc (tính cả lề ngàm) */
export function clampToWorkspace(layout: Layout, p: Point): Point {
  const minX = layout.pad;
  const maxX = layout.width - layout.cellW - layout.pad;
  const minY = layout.pad;
  const maxY = layout.height - layout.cellH - layout.pad;
  return { x: Math.min(maxX, Math.max(minX, p.x)), y: Math.min(maxY, Math.max(minY, p.y)) };
}

/** Mảnh đang ở đủ gần vị trí đúng: hiện viền sáng khi kéo, thả ra thì tự nhảy về đúng chỗ */
export function isNearHome(layout: Layout, p: Point, index: number): boolean {
  const home = homePosition(layout, index);
  const threshold = Math.min(layout.cellW, layout.cellH) * 0.4;
  return Math.abs(p.x - home.x) <= threshold && Math.abs(p.y - home.y) <= threshold;
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
