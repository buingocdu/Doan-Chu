import { describe, expect, it } from 'vitest';
import {
  cropPixels,
  FULL_RECT,
  fitAspectRect,
  fractionRatio,
  isFullRect,
  MIN_CROP,
  moveRect,
  resizeRect,
  rotatedSize,
} from './cropMath';

describe('rotatedSize', () => {
  it('xoay lẻ lần 90° thì đổi rộng với cao', () => {
    expect(rotatedSize(800, 600, 1)).toEqual({ width: 600, height: 800 });
    expect(rotatedSize(800, 600, 3)).toEqual({ width: 600, height: 800 });
    expect(rotatedSize(800, 600, 2)).toEqual({ width: 800, height: 600 });
    expect(rotatedSize(800, 600, 0)).toEqual({ width: 800, height: 600 });
  });
});

describe('fitAspectRect', () => {
  it('ảnh ngang 800x600 cắt 1:1: vùng vuông lớn nhất, đặt giữa', () => {
    const r = fitAspectRect(1, 800, 600);
    expect(r.h).toBeCloseTo(1);
    expect(r.w * 800).toBeCloseTo(600); // 600px
    expect(r.x).toBeCloseTo((1 - r.w) / 2);
    expect(r.y).toBeCloseTo(0);
  });

  it('tỉ lệ rộng hơn ảnh thì giữ trọn chiều rộng', () => {
    const r = fitAspectRect(16 / 9, 800, 600);
    expect(r.w).toBeCloseTo(1);
    expect((r.w * 800) / (r.h * 600)).toBeCloseTo(16 / 9);
  });

  it('đặt quanh tâm vùng cũ nhưng không tràn ra ngoài ảnh', () => {
    const r = fitAspectRect(1, 800, 600, { x: 0.8, y: 0, w: 0.2, h: 1 });
    expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9);
    expect(r.x).toBeCloseTo(0.25); // vuông 600px rộng 75%: sát mép phải
  });
});

describe('moveRect', () => {
  it('giữ vùng trong ảnh', () => {
    const r = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };
    expect(moveRect(r, 0.1, -0.1)).toEqual({ x: 0.30000000000000004, y: 0.1, w: 0.5, h: 0.5 });
    expect(moveRect(r, 5, 5)).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 });
    expect(moveRect(r, -5, -5)).toEqual({ x: 0, y: 0, w: 0.5, h: 0.5 });
  });
});

describe('resizeRect (tự do)', () => {
  const r = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };

  it('kéo cạnh phải và cạnh dưới', () => {
    const out = resizeRect(r, 'se', 0.1, 0.1, null);
    expect(out.x).toBeCloseTo(0.2);
    expect(out.w).toBeCloseTo(0.6);
    expect(out.h).toBeCloseTo(0.6);
  });

  it('kéo cạnh trái: cạnh phải đứng yên', () => {
    const out = resizeRect(r, 'w', -0.1, 0, null);
    expect(out.x).toBeCloseTo(0.1);
    expect(out.x + out.w).toBeCloseTo(0.7);
    expect(out.y).toBeCloseTo(r.y);
    expect(out.h).toBeCloseTo(r.h);
  });

  it('không tràn ra ngoài ảnh và không nhỏ hơn mức tối thiểu', () => {
    const big = resizeRect(r, 'se', 9, 9, null);
    expect(big.x + big.w).toBeCloseTo(1);
    expect(big.y + big.h).toBeCloseTo(1);
    const tiny = resizeRect(r, 'se', -9, -9, null);
    expect(tiny.w).toBeCloseTo(MIN_CROP);
    expect(tiny.h).toBeCloseTo(MIN_CROP);
    const left = resizeRect(r, 'nw', -9, -9, null);
    expect(left.x).toBe(0);
    expect(left.y).toBe(0);
  });
});

describe('resizeRect (khoá tỉ lệ)', () => {
  // Ảnh 800x600, khoá 1:1 => w/h theo phần trăm = 0.75
  const ratio = fractionRatio(1, 800, 600);
  const start = fitAspectRect(1, 800, 600); // vuông 600px ở giữa
  const small = { x: start.x, y: 0.2, w: start.w * 0.5, h: start.h * 0.5 };

  it('luôn giữ đúng tỉ lệ điểm ảnh khi kéo góc, góc đối diện đứng yên', () => {
    for (const handle of ['nw', 'ne', 'sw', 'se'] as const) {
      const out = resizeRect(small, handle, 0.05, 0.02, ratio);
      expect((out.w * 800) / (out.h * 600)).toBeCloseTo(1);
      const anchorX = handle.includes('w') ? small.x + small.w : small.x;
      const anchorY = handle.includes('n') ? small.y + small.h : small.y;
      const ax = handle.includes('w') ? out.x + out.w : out.x;
      const ay = handle.includes('n') ? out.y + out.h : out.y;
      expect(ax).toBeCloseTo(anchorX);
      expect(ay).toBeCloseTo(anchorY);
    }
  });

  it('không tràn ra ngoài ảnh khi phóng to và giữ tỉ lệ', () => {
    const out = resizeRect(small, 'se', 5, 5, ratio);
    expect(out.x + out.w).toBeLessThanOrEqual(1 + 1e-9);
    expect(out.y + out.h).toBeLessThanOrEqual(1 + 1e-9);
    expect((out.w * 800) / (out.h * 600)).toBeCloseTo(1);
  });

  it('tay nắm cạnh không có tác dụng khi khoá tỉ lệ', () => {
    expect(resizeRect(small, 'e', 0.1, 0, ratio)).toEqual(small);
    expect(resizeRect(small, 'n', 0, 0.1, ratio)).toEqual(small);
  });
});

describe('tiện ích', () => {
  it('isFullRect và cropPixels', () => {
    expect(isFullRect(FULL_RECT)).toBe(true);
    expect(isFullRect({ x: 0, y: 0, w: 0.9, h: 1 })).toBe(false);
    expect(cropPixels({ x: 0, y: 0, w: 0.5, h: 0.25 }, 800, 600)).toEqual({ width: 400, height: 150 });
  });
});
