// Tính toán vùng cắt ảnh. Mọi toạ độ là tỉ lệ 0..1 của ảnh SAU KHI XOAY (x, y: góc trên-trái; w, h: rộng, cao).

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** Vùng cắt nhỏ nhất (5% mỗi chiều) để không thu về một điểm */
export const MIN_CROP = 0.05;

export const FULL_RECT: CropRect = { x: 0, y: 0, w: 1, h: 1 };

export interface AspectOption {
  id: string;
  label: string;
  /** Tỉ lệ rộng/cao tính theo điểm ảnh; null = tự do */
  ratio: number | null;
}

export const ASPECTS: readonly AspectOption[] = [
  { id: 'free', label: 'Tự do', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '2:3', label: '2:3', ratio: 2 / 3 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Kích thước ảnh sau khi xoay `turns` lần 90° */
export function rotatedSize(width: number, height: number, turns: number): { width: number; height: number } {
  return Math.abs(turns) % 2 === 1 ? { width: height, height: width } : { width, height };
}

/** Tỉ lệ (w/h) của vùng cắt tính theo phần trăm ảnh, ứng với tỉ lệ điểm ảnh `aspect` */
export function fractionRatio(aspect: number, imgW: number, imgH: number): number {
  return (aspect * imgH) / imgW;
}

export function isFullRect(r: CropRect): boolean {
  const eps = 1e-6;
  return r.x <= eps && r.y <= eps && r.w >= 1 - eps && r.h >= 1 - eps;
}

/** Vùng lớn nhất có tỉ lệ điểm ảnh `aspect`, đặt quanh tâm `around` (mặc định giữa ảnh) và nằm trọn trong ảnh */
export function fitAspectRect(aspect: number, imgW: number, imgH: number, around?: CropRect): CropRect {
  const ratio = fractionRatio(aspect, imgW, imgH);
  let w = 1;
  let h = w / ratio;
  if (h > 1) {
    h = 1;
    w = h * ratio;
  }
  const cx = around ? around.x + around.w / 2 : 0.5;
  const cy = around ? around.y + around.h / 2 : 0.5;
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h };
}

/** Dời vùng cắt, giữ trong ảnh */
export function moveRect(r: CropRect, dx: number, dy: number): CropRect {
  return { ...r, x: clamp(r.x + dx, 0, 1 - r.w), y: clamp(r.y + dy, 0, 1 - r.h) };
}

/**
 * Kéo một tay nắm. dx, dy là độ dời theo tỉ lệ ảnh. `lockRatio` (w/h theo phần trăm ảnh) khác null thì giữ tỉ lệ:
 * khi đó chỉ 4 tay nắm ở góc có tác dụng, góc đối diện đứng yên.
 */
export function resizeRect(r: CropRect, handle: CropHandle, dx: number, dy: number, lockRatio: number | null): CropRect {
  const west = handle.includes('w');
  const east = handle.includes('e');
  const north = handle.includes('n');
  const south = handle.includes('s');

  if (lockRatio === null) {
    let left = r.x;
    let right = r.x + r.w;
    let top = r.y;
    let bottom = r.y + r.h;
    if (west) left = clamp(left + dx, 0, right - MIN_CROP);
    if (east) right = clamp(right + dx, left + MIN_CROP, 1);
    if (north) top = clamp(top + dy, 0, bottom - MIN_CROP);
    if (south) bottom = clamp(bottom + dy, top + MIN_CROP, 1);
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  if (!((west || east) && (north || south))) return r; // tay nắm cạnh không dùng khi khoá tỉ lệ
  // Góc đối diện đứng yên
  const anchorX = west ? r.x + r.w : r.x;
  const anchorY = north ? r.y + r.h : r.y;
  const wantW = r.w + (west ? -dx : dx);
  const wantH = r.h + (north ? -dy : dy);
  // Lấy trung bình hai hướng kéo để cử chỉ chéo mượt
  let w = (wantW + wantH * lockRatio) / 2;
  const maxW = Math.min(west ? anchorX : 1 - anchorX, (north ? anchorY : 1 - anchorY) * lockRatio);
  w = clamp(w, Math.max(MIN_CROP, MIN_CROP * lockRatio), Math.max(MIN_CROP, maxW));
  const h = w / lockRatio;
  return { x: west ? anchorX - w : anchorX, y: north ? anchorY - h : anchorY, w, h };
}

/** Kích thước điểm ảnh của vùng cắt */
export function cropPixels(r: CropRect, imgW: number, imgH: number): { width: number; height: number } {
  return { width: Math.max(1, Math.round(r.w * imgW)), height: Math.max(1, Math.round(r.h * imgH)) };
}
