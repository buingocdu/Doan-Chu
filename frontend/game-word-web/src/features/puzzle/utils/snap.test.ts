import { describe, expect, it } from 'vitest';
import { findMerge } from './cluster';
import {
  clampSnapPercent,
  computeLayout,
  DEFAULT_SNAP_PERCENT,
  homePosition,
  isNearHome,
  MAX_SNAP_PERCENT,
  MIN_SNAP_PERCENT,
  MOBILE_SNAP_BOOST,
  snapTolerance,
} from './jigsaw';

describe('độ tự động khớp của game', () => {
  const wide = computeLayout(1.5, 4, 4, 'wide');

  it('mặc định 8 đúng bằng mức chuẩn trước đây; không truyền thì dùng mặc định', () => {
    expect(DEFAULT_SNAP_PERCENT).toBe(8);
    expect(snapTolerance(wide)).toBeCloseTo(snapTolerance(wide, 8));
    expect(snapTolerance(wide, null)).toBeCloseTo(snapTolerance(wide, 8));
    expect(snapTolerance(wide, undefined)).toBeCloseTo(snapTolerance(wide, 8));
  });

  it('tăng theo tỉ lệ với giá trị: 16 gấp đôi 8, 4 bằng một nửa', () => {
    const base = snapTolerance(wide, 8);
    expect(snapTolerance(wide, 16)).toBeCloseTo(base * 2);
    expect(snapTolerance(wide, 4)).toBeCloseTo(base / 2);
    expect(snapTolerance(wide, 20)).toBeGreaterThan(snapTolerance(wide, 12));
  });

  it('giá trị ngoài khoảng 2–20 hoặc không hợp lệ bị kẹp lại', () => {
    expect(clampSnapPercent(1)).toBe(MIN_SNAP_PERCENT);
    expect(clampSnapPercent(99)).toBe(MAX_SNAP_PERCENT);
    expect(clampSnapPercent(Number.NaN)).toBe(DEFAULT_SNAP_PERCENT);
    expect(clampSnapPercent(null)).toBe(DEFAULT_SNAP_PERCENT);
    expect(snapTolerance(wide, 500)).toBeCloseTo(snapTolerance(wide, MAX_SNAP_PERCENT));
  });

  it('điện thoại (dọc hoặc ngang) tự cộng thêm 20% so với máy tính', () => {
    expect(MOBILE_SNAP_BOOST).toBeCloseTo(1.2);
    for (const aspect of [0.75, 1, 1.5]) {
      for (const percent of [4, 8, 14]) {
        // Cùng kích thước ô để so sánh thuần hệ số: dùng chung layout rộng nhưng đổi chế độ
        const base = computeLayout(aspect, 4, 4, 'wide');
        const asCompact = { ...base, mode: 'compact' as const };
        const asLandscape = { ...base, mode: 'landscape' as const };
        expect(snapTolerance(asCompact, percent)).toBeCloseTo(snapTolerance(base, percent) * 1.2);
        expect(snapTolerance(asLandscape, percent)).toBeCloseTo(snapTolerance(base, percent) * 1.2);
      }
    }
    // computeLayout gắn đúng chế độ
    expect(computeLayout(1, 3, 3, 'compact').mode).toBe('compact');
    expect(computeLayout(1, 3, 3, 'landscape').mode).toBe('landscape');
    expect(computeLayout(1, 3, 3).mode).toBe('wide');
    expect(computeLayout(1, 3, 3, true).mode).toBe('compact');
  });

  it('isNearHome theo ngưỡng của game: cùng khoảng lệch, game chặt không bắt còn game dễ thì bắt', () => {
    const home = homePosition(wide, 5);
    const tol = snapTolerance(wide, 8);
    const near = { x: home.x + tol * 0.9, y: home.y };
    expect(isNearHome(wide, near, 5, 8)).toBe(true);
    expect(isNearHome(wide, near, 5, 4)).toBe(false); // game chặt hơn (ngưỡng một nửa)
    expect(isNearHome(wide, near, 5, 20)).toBe(true);
    const farther = { x: home.x + tol * 1.6, y: home.y };
    expect(isNearHome(wide, farther, 5, 8)).toBe(false);
    expect(isNearHome(wide, farther, 5, 14)).toBe(true); // ngưỡng 14 = 1.75 lần chuẩn
    expect(isNearHome(wide, farther, 5, 20)).toBe(true);
  });

  it('điện thoại bắt được khoảng lệch mà máy tính không bắt (cùng game)', () => {
    const home = homePosition(wide, 5);
    const tol = snapTolerance(wide, 8);
    const off = { x: home.x + tol * 1.1, y: home.y }; // ngoài ngưỡng máy tính, trong ngưỡng ×1.2
    const phone = { ...wide, mode: 'compact' as const };
    expect(isNearHome(wide, off, 5, 8)).toBe(false);
    expect(isNearHome(phone, off, 5, 8)).toBe(true);
  });

  it('ghép cụm cũng theo ngưỡng của game và hệ số điện thoại', () => {
    const groups = Array.from({ length: 16 }, (_, i) => i);
    const placed = Array<boolean>(16).fill(false);
    const h0 = homePosition(wide, 0);
    const h1 = homePosition(wide, 1);
    const tol = snapTolerance(wide, 8);
    // Mảnh 0 ở (300,300); mảnh 1 đặt lệch so với vị trí tương đối đúng 1.1 lần ngưỡng
    const positions = Array.from({ length: 16 }, () => ({ x: 9000, y: 9000 }));
    positions[0] = { x: 300, y: 300 };
    positions[1] = { x: 300 + (h1.x - h0.x) + tol * 1.1, y: 300 + (h1.y - h0.y) };
    expect(findMerge(wide, positions, groups, placed, [1], 8)).toBeNull();
    expect(findMerge(wide, positions, groups, placed, [1], 20)?.target).toBe(0);
    const phone = { ...wide, mode: 'compact' as const };
    expect(findMerge(phone, positions, groups, placed, [1], 8)?.target).toBe(0);
  });
});
