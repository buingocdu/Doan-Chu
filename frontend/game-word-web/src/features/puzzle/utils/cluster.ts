// Cụm mảnh: ghép các mảnh liền kề đúng chỗ với nhau ở bên ngoài khung, rồi đưa cả cụm vào khung một lượt.
// Một cụm là cứng: vị trí các mảnh trong cụm luôn lệch nhau đúng bằng độ lệch vị trí đúng (home) của chúng.

import { clampToWorkspace, homePosition, scatterPositions, snapTolerance, type Layout, type Point } from './jigsaw';

/** Chỉ số 4 mảnh kề (trên, dưới, trái, phải) của mảnh `index` trong lưới rows x cols */
export function neighborIndices(index: number, rows: number, cols: number): number[] {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const out: number[] = [];
  if (r > 0) out.push(index - cols);
  if (r < rows - 1) out.push(index + cols);
  if (c > 0) out.push(index - 1);
  if (c < cols - 1) out.push(index + 1);
  return out;
}

/** Các mảnh cùng cụm với `index` */
export function membersOf(groups: readonly number[], index: number): number[] {
  const id = groups[index];
  const out: number[] = [];
  for (let i = 0; i < groups.length; i++) if (groups[i] === id) out.push(i);
  return out;
}

export interface MergeMatch {
  /** Mảnh trong cụm đang kéo */
  moving: number;
  /** Mảnh kề (thuộc cụm khác) mà nó khớp với */
  target: number;
  /** Độ dời cần áp cho cả cụm đang kéo để khớp tuyệt đối */
  shift: Point;
  distance: number;
}

/**
 * Tìm chỗ khớp tốt nhất giữa cụm đang kéo (`movingIds`) và một mảnh kề chưa đặt ở cụm khác: hai mảnh kề nhau trong
 * lưới khớp khi vị trí tương đối của chúng gần bằng vị trí tương đối đúng (trong ngưỡng tự bắt).
 */
export function findMerge(
  layout: Layout,
  positions: readonly Point[],
  groups: readonly number[],
  placed: readonly boolean[],
  movingIds: readonly number[],
  snapPercent?: number | null,
): MergeMatch | null {
  const tolerance = snapTolerance(layout, snapPercent);
  let best: MergeMatch | null = null;
  for (const i of movingIds) {
    const homeI = homePosition(layout, i);
    for (const n of neighborIndices(i, layout.rows, layout.cols)) {
      if (placed[n] || groups[n] === groups[i]) continue;
      const homeN = homePosition(layout, n);
      const dx = positions[n].x - positions[i].x - (homeN.x - homeI.x);
      const dy = positions[n].y - positions[i].y - (homeN.y - homeI.y);
      const distance = Math.hypot(dx, dy);
      if (distance <= tolerance && (best === null || distance < best.distance)) {
        best = { moving: i, target: n, shift: { x: dx, y: dy }, distance };
      }
    }
  }
  return best;
}

/** Gộp cụm `drop` vào cụm `keep` (đổi id) */
export function mergeGroups(groups: readonly number[], keep: number, drop: number): number[] {
  const keepId = groups[keep];
  const dropId = groups[drop];
  return groups.map((g) => (g === dropId ? keepId : g));
}

/** Giới hạn độ dời để mọi mảnh trong cụm vẫn nằm trong khung làm việc (cụm di chuyển cứng) */
export function clampGroupDelta(layout: Layout, starts: readonly Point[], dx: number, dy: number): Point {
  if (starts.length === 0) return { x: dx, y: dy };
  const maxX = layout.width - layout.cellW;
  const maxY = layout.height - layout.cellH;
  let loX = -Infinity;
  let hiX = Infinity;
  let loY = -Infinity;
  let hiY = Infinity;
  for (const p of starts) {
    loX = Math.max(loX, -p.x);
    hiX = Math.min(hiX, maxX - p.x);
    loY = Math.max(loY, -p.y);
    hiY = Math.min(hiY, maxY - p.y);
  }
  // Cụm rộng hơn khung làm việc thì không thể thoả hết; giữ nguyên vị trí theo trục đó
  return {
    x: loX > hiX ? 0 : Math.min(hiX, Math.max(loX, dx)),
    y: loY > hiY ? 0 : Math.min(hiY, Math.max(loY, dy)),
  };
}

/**
 * Xếp lại toàn bộ mảnh vào một bố cục mới (vd xoay màn hình): mảnh đã đặt về đúng chỗ; mỗi cụm chưa đặt được rải
 * như một khối vào khay, giữ nguyên vị trí tương đối giữa các mảnh trong cụm.
 */
export function layoutAllPieces(
  layout: Layout,
  groups: readonly number[],
  placed: readonly boolean[],
  rng: () => number,
): Point[] {
  const result: Point[] = new Array<Point>(groups.length);
  const done = new Set<number>();
  for (let i = 0; i < groups.length; i++) {
    if (placed[i]) {
      result[i] = homePosition(layout, i);
      continue;
    }
    if (done.has(groups[i])) continue;
    done.add(groups[i]);
    const members = membersOf(groups, i);
    const anchor = members[0];
    const anchorHome = homePosition(layout, anchor);
    const [spot] = scatterPositions(layout, 1, rng);
    const raw = members.map((m) => {
      const h = homePosition(layout, m);
      return { x: spot.x + h.x - anchorHome.x, y: spot.y + h.y - anchorHome.y };
    });
    const shift = clampGroupDelta(layout, raw, 0, 0);
    members.forEach((m, k) => {
      result[m] = { x: raw[k].x + shift.x, y: raw[k].y + shift.y };
    });
  }
  return result.map((p, i) => p ?? clampToWorkspace(layout, homePosition(layout, i)));
}
