import { describe, expect, it } from 'vitest';
import {
  clampGroupDelta,
  findMerge,
  layoutAllPieces,
  membersOf,
  mergeGroups,
  neighborIndices,
} from './cluster';
import { computeLayout, createRng, homePosition, snapTolerance, type Point } from './jigsaw';

describe('neighborIndices', () => {
  it('mảnh giữa có 4 mảnh kề, góc có 2, cạnh có 3', () => {
    expect(neighborIndices(4, 3, 3).sort()).toEqual([1, 3, 5, 7]);
    expect(neighborIndices(0, 3, 3).sort()).toEqual([1, 3]);
    expect(neighborIndices(1, 3, 3).sort()).toEqual([0, 2, 4]);
    expect(neighborIndices(8, 3, 3).sort()).toEqual([5, 7]);
  });

  it('không bao quanh sang hàng khác ở rìa trái/phải', () => {
    expect(neighborIndices(2, 3, 3)).not.toContain(3); // cuối hàng 0 không kề đầu hàng 1 theo chiều ngang
    expect(neighborIndices(3, 3, 3)).not.toContain(2);
  });
});

describe('membersOf / mergeGroups', () => {
  it('gộp cụm đổi id của cụm bị gộp', () => {
    const groups = [0, 1, 2, 3];
    const merged = mergeGroups(groups, 0, 1);
    expect(merged).toEqual([0, 0, 2, 3]);
    expect(membersOf(merged, 1)).toEqual([0, 1]);
    // gộp tiếp cụm 2 vào cụm đã có 2 mảnh
    expect(mergeGroups(merged, 1, 2)).toEqual([0, 0, 0, 3]);
    // đổi id của cả cụm bị gộp, không chỉ một mảnh
    expect(mergeGroups([0, 0, 2, 2], 0, 2)).toEqual([0, 0, 0, 0]);
  });
});

describe('findMerge', () => {
  const layout = computeLayout(1.5, 3, 3);
  const groups = Array.from({ length: 9 }, (_, i) => i);
  const placed = Array<boolean>(9).fill(false);
  const tol = snapTolerance(layout);

  // Đặt mảnh i ở vị trí home + offset chung, cộng thêm lệch riêng
  const at = (offset: Point, extra: Record<number, Point> = {}): Point[] =>
    Array.from({ length: 9 }, (_, i) => {
      const h = homePosition(layout, i);
      const e = extra[i] ?? { x: 0, y: 0 };
      return { x: h.x + offset.x + e.x, y: h.y + offset.y + e.y };
    });

  // Đẩy mọi mảnh ngoài `keep` ra xa để chỉ còn các mảnh đó có thể khớp với nhau
  const isolate = (positions: Point[], keep: number[]): Point[] =>
    positions.map((p, i) => (keep.includes(i) ? p : { x: p.x + 5000, y: p.y + 5000 }));

  it('hai mảnh kề đúng vị trí tương đối thì khớp, độ dời đưa chúng về khít tuyệt đối', () => {
    // mảnh 0 ở đúng chỗ tại (300,400) cùng mảnh 1 lệch 4 đơn vị
    const positions = isolate(at({ x: 300, y: 400 }, { 1: { x: 4, y: -3 } }), [0, 1]);
    const match = findMerge(layout, positions, groups, placed, [1]);
    expect(match).not.toBeNull();
    expect(match?.target).toBe(0);
    // Áp độ dời thì mảnh 1 nằm đúng vị trí tương đối so với mảnh 0
    const moved = { x: positions[1].x + match!.shift.x, y: positions[1].y + match!.shift.y };
    const h0 = homePosition(layout, 0);
    const h1 = homePosition(layout, 1);
    expect(moved.x - positions[0].x).toBeCloseTo(h1.x - h0.x);
    expect(moved.y - positions[0].y).toBeCloseTo(h1.y - h0.y);
  });

  it('lệch quá ngưỡng thì không khớp', () => {
    const positions = isolate(at({ x: 300, y: 400 }, { 1: { x: tol + 6, y: 0 } }), [0, 1]);
    expect(findMerge(layout, positions, groups, placed, [1])).toBeNull();
  });

  it('hai mảnh không kề nhau trong lưới thì không khớp dù đứng đúng vị trí tương đối', () => {
    // mảnh 0 và 4 (chéo) cùng đúng tương đối nhưng không phải 4-lân cận
    const positions = at({ x: 200, y: 300 });
    const alone = [0, 4, 8].map((i) => groups[i]);
    expect(alone.length).toBe(3);
    // chỉ cho mảnh 0 và 4 vào danh sách đang kéo/được so, loại các mảnh kề bằng cách đặt chúng ra xa
    const far = positions.map((p, i) => (i === 0 || i === 4 ? p : { x: p.x + 500, y: p.y + 500 }));
    expect(findMerge(layout, far, groups, placed, [0])).toBeNull();
  });

  it('bỏ qua mảnh đã đặt và mảnh cùng cụm', () => {
    const positions = at({ x: 300, y: 400 });
    const placedZero = placed.map((_, i) => i === 0);
    expect(findMerge(layout, positions, groups, placedZero, [1])?.target).not.toBe(0);
    const sameGroup = groups.map((g, i) => (i <= 1 ? 0 : g));
    const m = findMerge(layout, positions, sameGroup, placed, [0, 1]);
    // cụm {0,1} khớp với mảnh kề 2/3/4 (đều đang đúng tương đối), không với chính nó
    expect(m).not.toBeNull();
    expect([2, 3, 4]).toContain(m!.target);
  });

  it('chọn chỗ khớp gần nhất khi có nhiều ứng viên', () => {
    // mảnh 4 có 4 mảnh kề; mảnh 1 lệch 2, mảnh 3 lệch 6 => chọn mảnh 1
    const positions = isolate(at({ x: 300, y: 400 }, { 1: { x: 2, y: 0 }, 3: { x: 0, y: 6 } }), [1, 3, 4]);
    const m = findMerge(layout, positions, groups, placed, [4]);
    expect(m?.target).toBe(1);
    expect(m?.distance).toBeCloseTo(2);
  });
});

describe('clampGroupDelta', () => {
  const layout = computeLayout(1.5, 3, 3);

  it('giữ mọi mảnh trong khung làm việc khi kéo cụm', () => {
    const starts = [
      { x: 100, y: 500 },
      { x: 100 + layout.cellW, y: 500 },
    ];
    const d = clampGroupDelta(layout, starts, -9999, 9999);
    expect(starts[0].x + d.x).toBeGreaterThanOrEqual(0);
    expect(starts[0].y + d.y + layout.cellH).toBeLessThanOrEqual(layout.height + 1e-9);
    const right = clampGroupDelta(layout, starts, 9999, 0);
    expect(starts[1].x + right.x + layout.cellW).toBeLessThanOrEqual(layout.width + 1e-9);
  });

  it('độ dời nhỏ giữ nguyên', () => {
    expect(clampGroupDelta(layout, [{ x: 300, y: 300 }], 12, -7)).toEqual({ x: 12, y: -7 });
  });
});

describe('layoutAllPieces (xếp lại khi đổi bố cục)', () => {
  const rows = 3;
  const cols = 3;
  const next = computeLayout(1.5, rows, cols, 'landscape');

  it('mảnh đã đặt về đúng chỗ, cụm giữ nguyên vị trí tương đối, mảnh lẻ nằm trong khay', () => {
    const groups = [0, 0, 2, 3, 3, 3, 6, 7, 8];
    const placed = [false, false, true, false, false, false, false, false, false];
    const out = layoutAllPieces(next, groups, placed, createRng(5));
    expect(out).toHaveLength(9);
    expect(out[2]).toEqual(homePosition(next, 2));
    // cụm {0,1}: hiệu vị trí = hiệu home
    const h0 = homePosition(next, 0);
    const h1 = homePosition(next, 1);
    expect(out[1].x - out[0].x).toBeCloseTo(h1.x - h0.x);
    expect(out[1].y - out[0].y).toBeCloseTo(h1.y - h0.y);
    // cụm {3,4,5}
    for (const m of [4, 5]) {
      const a = homePosition(next, 3);
      const b = homePosition(next, m);
      expect(out[m].x - out[3].x).toBeCloseTo(b.x - a.x);
      expect(out[m].y - out[3].y).toBeCloseTo(b.y - a.y);
    }
    // mọi mảnh lẻ trong khay bên phải
    for (const i of [6, 7, 8]) {
      expect(out[i].x).toBeGreaterThanOrEqual(next.tray.x);
    }
    // và không mảnh nào ra ngoài khung làm việc
    for (const p of out) {
      expect(p.x).toBeGreaterThanOrEqual(-1e-9);
      expect(p.x + next.cellW).toBeLessThanOrEqual(next.width + 1e-9);
      expect(p.y + next.cellH).toBeLessThanOrEqual(next.height + 1e-9);
    }
  });
});
