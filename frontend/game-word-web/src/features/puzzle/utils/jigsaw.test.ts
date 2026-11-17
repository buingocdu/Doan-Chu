import { describe, expect, it } from 'vitest';
import {
  buildEdges,
  clampGrid,
  clampToWorkspace,
  COMPACT_LOGICAL_WIDTH,
  computeLayout,
  createRng,
  difficultyLabel,
  formatDuration,
  homePosition,
  isEdgePiece,
  LANDSCAPE_MAX_HEIGHT,
  pickLayoutMode,
  isNearHome,
  SNAP_MAX,
  SNAP_MIN,
  snapTolerance,
  matchesFilter,
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

describe('hình mẫu thu nhỏ', () => {
  it('nằm trong lề phải, không đè lên khung ghép ở mọi tỉ lệ ảnh', () => {
    for (const aspect of [0.4, 0.75, 1, 1.5, 2.5, 4]) {
      const layout = computeLayout(aspect, 4, 4);
      expect(layout.thumb.x).toBeGreaterThanOrEqual(layout.board.x + layout.board.w);
      expect(layout.thumb.x + layout.thumb.w).toBeLessThanOrEqual(layout.width);
      expect(layout.thumb.w / layout.thumb.h).toBeCloseTo(aspect);
    }
  });
});

describe('difficultyLabel', () => {
  it('xếp loại theo số mảnh', () => {
    expect(difficultyLabel(3, 3)).toBe('Dễ');
    expect(difficultyLabel(4, 4)).toBe('Vừa');
    expect(difficultyLabel(6, 6)).toBe('Khó');
    expect(difficultyLabel(8, 8)).toBe('Rất khó');
  });
});

describe('bố cục gọn cho điện thoại', () => {
  it('khung chiếm gần hết bề ngang, hình mẫu ở lề phải không đè khung, mọi mảnh rải trong khay', () => {
    for (const aspect of [0.5, 1, 1.5, 3]) {
      const layout = computeLayout(aspect, 4, 4, true);
      expect(layout.width).toBe(COMPACT_LOGICAL_WIDTH);
      expect(layout.board.x + layout.board.w).toBeLessThanOrEqual(layout.thumb.x);
      expect(layout.thumb.x + layout.thumb.w).toBeLessThanOrEqual(layout.width);
      const points = scatterPositions(layout, 16, createRng(3));
      for (const p of points) expect(p.x + layout.cellW).toBeLessThanOrEqual(layout.width);
    }
    // Ảnh ngang: khung rộng hơn nhiều so với bố cục rộng sau khi co theo màn hình 390px
    const compact = computeLayout(1.5, 3, 3, true);
    const wide = computeLayout(1.5, 3, 3, false);
    expect(compact.board.w / compact.width).toBeGreaterThan((wide.board.w / wide.width) * 1.1);
  });
});

describe('bộ lọc mảnh viền', () => {
  it('lưới 4x5: 14 mảnh viền (gồm 4 góc), 6 mảnh trong', () => {
    const rows = 4;
    const cols = 5;
    const edge = Array.from({ length: rows * cols }, (_, i) => i).filter((i) => isEdgePiece(i, rows, cols));
    expect(edge).toHaveLength(14);
    expect(isEdgePiece(0, rows, cols)).toBe(true);
    expect(isEdgePiece(cols * rows - 1, rows, cols)).toBe(true);
    expect(isEdgePiece(cols + 1, rows, cols)).toBe(false);
  });

  it('lưới 2xN không có mảnh trong; matchesFilter tách đúng hai nhóm', () => {
    expect(Array.from({ length: 6 }, (_, i) => isEdgePiece(i, 2, 3)).every(Boolean)).toBe(true);
    expect(matchesFilter('all', 5, 3, 3)).toBe(true);
    expect(matchesFilter('edge', 4, 3, 3)).toBe(false);
    expect(matchesFilter('inner', 4, 3, 3)).toBe(true);
    expect(matchesFilter('edge', 0, 3, 3)).toBe(true);
    expect(matchesFilter('inner', 0, 3, 3)).toBe(false);
  });
});

describe('ngưỡng tự bắt', () => {
  it('rất sát vị trí: chỉ vài đơn vị logic, kẹp trong [7, 18] ở mọi độ khó', () => {
    for (const n of [2, 3, 4, 6, 8, 12]) {
      const tol = snapTolerance(computeLayout(1.5, n, n));
      expect(tol).toBeGreaterThanOrEqual(SNAP_MIN);
      expect(tol).toBeLessThanOrEqual(SNAP_MAX);
    }
  });

  it('lệch hơn ngưỡng một chút là không bắt, kể cả theo đường chéo', () => {
    const layout = computeLayout(1.5, 4, 4);
    const tol = snapTolerance(layout);
    const home = homePosition(layout, 5);
    expect(isNearHome(layout, { x: home.x + tol - 0.5, y: home.y }, 5)).toBe(true);
    expect(isNearHome(layout, { x: home.x + tol + 1, y: home.y }, 5)).toBe(false);
    // Đường chéo: từng trục còn trong ngưỡng nhưng khoảng cách thật đã vượt
    const d = tol * 0.8;
    expect(isNearHome(layout, { x: home.x + d, y: home.y + d }, 5)).toBe(false);
    // Lệch nửa ô (mức bắt cũ) tuyệt đối không bắt
    expect(isNearHome(layout, { x: home.x + layout.cellW * 0.3, y: home.y }, 5)).toBe(false);
  });
});

describe('giới hạn kéo không chặn vị trí đúng', () => {
  it('mọi mảnh đều kéo tới được đúng vị trí của mình (kể cả hàng trên cùng và cột ngoài cùng)', () => {
    for (const compact of [false, true]) {
      for (const aspect of [0.5, 1, 1.5, 3]) {
        const layout = computeLayout(aspect, 5, 6, compact);
        for (let i = 0; i < 30; i++) {
          const home = homePosition(layout, i);
          expect(clampToWorkspace(layout, home)).toEqual(home);
        }
      }
    }
  });
});

describe('chọn chế độ bố cục theo kích thước màn hình', () => {
  it('điện thoại dọc là compact, xoay ngang là landscape, máy tính/tablet là wide', () => {
    expect(pickLayoutMode(390, 844)).toBe('compact');
    expect(pickLayoutMode(844, 390)).toBe('landscape');
    expect(pickLayoutMode(932, 430)).toBe('landscape');
    expect(pickLayoutMode(1024, 768)).toBe('wide');
    expect(pickLayoutMode(1440, 900)).toBe('wide');
    expect(pickLayoutMode(768, 1024)).toBe('wide');
    // Ngang nhưng đủ cao thì vẫn là wide
    expect(pickLayoutMode(1280, LANDSCAPE_MAX_HEIGHT)).toBe('wide');
  });
});

describe('bố cục xoay ngang', () => {
  it('khung bên trái, khay bên phải, thấp hơn nhiều so với bố cục dọc, hình mẫu không đè lên khay', () => {
    for (const aspect of [0.5, 1, 1.5, 3]) {
      const layout = computeLayout(aspect, 4, 4, 'landscape');
      const wide = computeLayout(aspect, 4, 4, 'wide');
      expect(layout.height).toBeLessThan(wide.height);
      if (aspect <= 1.5) expect(layout.height).toBeLessThan(wide.height * 0.7);
      expect(layout.board.x + layout.board.w).toBeLessThanOrEqual(layout.tray.x);
      expect(layout.thumb.y + layout.thumb.h).toBeLessThanOrEqual(layout.tray.y);
      expect(layout.tray.x + layout.tray.w).toBeLessThanOrEqual(layout.width);
      expect(layout.tray.y + layout.tray.h).toBeLessThanOrEqual(layout.height);
      expect(layout.board.y + layout.board.h).toBeLessThanOrEqual(layout.height);
    }
  });

  it('mọi mảnh rải trong khay bên phải và mọi vị trí đúng đều kéo tới được', () => {
    for (const aspect of [0.5, 1.5, 3]) {
      const layout = computeLayout(aspect, 5, 6, 'landscape');
      for (const p of scatterPositions(layout, 30, createRng(9))) {
        expect(p.x).toBeGreaterThanOrEqual(layout.tray.x);
        expect(p.x + layout.cellW).toBeLessThanOrEqual(layout.tray.x + layout.tray.w + 0.001);
        expect(p.y).toBeGreaterThanOrEqual(layout.tray.y);
      }
      for (let i = 0; i < 30; i++) {
        const home = homePosition(layout, i);
        expect(clampToWorkspace(layout, home)).toEqual(home);
      }
    }
  });
});
