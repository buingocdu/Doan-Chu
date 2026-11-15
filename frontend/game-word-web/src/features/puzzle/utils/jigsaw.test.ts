import { describe, expect, it } from 'vitest';
import {
  buildEdges,
  clampGrid,
  clampToWorkspace,
  computeLayout,
  createRng,
  formatDuration,
  homePosition,
  isNearHome,
  LOGICAL_WIDTH,
  piecePath,
  scatterPositions,
} from './jigsaw';

describe('clampGrid', () => {
  it('giới hạn trong 2–12 và làm tròn', () => {
    expect(clampGrid(0)).toBe(2);
    expect(clampGrid(99)).toBe(12);
    expect(clampGrid(4.6)).toBe(5);
    expect(clampGrid(Number.NaN)).toBe(2);
  });
});

describe('buildEdges', () => {
  const rows = 4;
  const cols = 5;
  const edges = buildEdges(rows, cols, createRng(42));

  it('viền ngoài phẳng', () => {
    for (let c = 0; c < cols; c++) {
      expect(edges[c].top).toBe(0);
      expect(edges[(rows - 1) * cols + c].bottom).toBe(0);
    }
    for (let r = 0; r < rows; r++) {
      expect(edges[r * cols].left).toBe(0);
      expect(edges[r * cols + cols - 1].right).toBe(0);
    }
  });

  it('cạnh chung của hai mảnh kề nhau đối nghịch (lồi khớp lõm)', () => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const e = edges[r * cols + c];
        if (c < cols - 1) expect(e.right).toBe(-edges[r * cols + c + 1].left);
        if (r < rows - 1) expect(e.bottom).toBe(-edges[(r + 1) * cols + c].top);
        if (c < cols - 1) expect(Math.abs(e.right)).toBe(1);
      }
    }
  });

  it('cùng seed cho cùng kết quả', () => {
    expect(buildEdges(rows, cols, createRng(42))).toEqual(edges);
    expect(buildEdges(rows, cols, createRng(43))).not.toEqual(edges);
  });
});

describe('computeLayout', () => {
  it('giữ tỉ lệ ảnh và đặt khung giữa', () => {
    const wide = computeLayout(2, 4, 4);
    expect(wide.board.w / wide.board.h).toBeCloseTo(2);
    expect(wide.board.x * 2 + wide.board.w).toBeCloseTo(LOGICAL_WIDTH);
    const tall = computeLayout(0.5, 4, 4);
    expect(tall.board.w / tall.board.h).toBeCloseTo(0.5);
    expect(tall.board.h).toBeLessThanOrEqual(500);
  });

  it('chia đều ô và đặt đúng vị trí đúng của từng mảnh', () => {
    const layout = computeLayout(1.5, 3, 4);
    expect(layout.cellW * 4).toBeCloseTo(layout.board.w);
    expect(layout.cellH * 3).toBeCloseTo(layout.board.h);
    expect(homePosition(layout, 0)).toEqual({ x: layout.board.x, y: layout.board.y });
    const last = homePosition(layout, 11);
    expect(last.x).toBeCloseTo(layout.board.x + 3 * layout.cellW);
    expect(last.y).toBeCloseTo(layout.board.y + 2 * layout.cellH);
  });

  it('tỉ lệ không hợp lệ rơi về hình vuông', () => {
    expect(computeLayout(Number.NaN, 3, 3).board.w).toBe(computeLayout(1, 3, 3).board.w);
  });
});

describe('rải và dính mảnh', () => {
  const layout = computeLayout(1.5, 4, 4);

  it('mọi mảnh được rải nằm trong dải phía dưới khung', () => {
    const points = scatterPositions(layout, 16, createRng(7));
    expect(points).toHaveLength(16);
    for (const p of points) {
      expect(p.y).toBeGreaterThanOrEqual(layout.tray.y);
      expect(p.y + layout.cellH).toBeLessThanOrEqual(layout.height);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + layout.cellW).toBeLessThanOrEqual(layout.width);
    }
  });

  it('chỉ dính khi thả đủ gần vị trí đúng', () => {
    const home = homePosition(layout, 5);
    expect(isNearHome(layout, home, 5)).toBe(true);
    expect(isNearHome(layout, { x: home.x + 3, y: home.y - 3 }, 5)).toBe(true);
    expect(isNearHome(layout, { x: home.x + layout.cellW, y: home.y }, 5)).toBe(false);
    expect(isNearHome(layout, home, 6)).toBe(false);
  });

  it('không cho kéo mảnh ra ngoài khung làm việc', () => {
    const p = clampToWorkspace(layout, { x: -500, y: 99999 });
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y + layout.cellH).toBeLessThanOrEqual(layout.height);
  });
});

describe('piecePath', () => {
  const layout = computeLayout(1, 3, 3);

  it('mảnh phẳng bốn cạnh là hình chữ nhật', () => {
    const d = piecePath(layout, { top: 0, right: 0, bottom: 0, left: 0 });
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).not.toContain('C');
  });

  it('mỗi ngàm thêm 4 đường cong và đường viền hợp lệ', () => {
    const d = piecePath(layout, { top: 1, right: -1, bottom: 1, left: -1 });
    expect(d.match(/C/g)).toHaveLength(16);
    expect(d).not.toContain('NaN');
  });
});

describe('formatDuration', () => {
  it('định dạng m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65_400)).toBe('1:05');
    expect(formatDuration(65_400, true)).toBe('1:05.4');
    expect(formatDuration(-5)).toBe('0:00');
  });
});
