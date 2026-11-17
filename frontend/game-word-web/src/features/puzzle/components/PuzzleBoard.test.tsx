import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PuzzleBoard from './PuzzleBoard';
import { computeLayout, homePosition } from '../utils/jigsaw';

// jsdom không có layout nên đặt bề rộng khung = bề rộng logic (scale 1) và bỏ qua pointer capture
beforeEach(() => {
  // jsdom chưa có PointerEvent: dùng MouseEvent kèm pointerId để giữ được toạ độ
  if (!('PointerEvent' in window)) {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
      }
    }
    vi.stubGlobal('PointerEvent', PointerEventPolyfill);
  }
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderBoard(onFinish = vi.fn(), onExit = vi.fn()) {
  render(
    <PuzzleBoard imageUrl="/x.jpg" aspect={1} rows={2} cols={2} onFinish={onFinish} onExit={onExit} />,
  );
  return { onFinish, onExit };
}

// Kéo mảnh `index` tới vị trí tuyệt đối (x, y) của ô, theo toạ độ logic (scale 1)
function dragPieceTo(index: number, target: { x: number; y: number }) {
  const piece = screen.getAllByRole('img').filter((el) => el.classList.contains('jigsaw-piece'))[index];
  const left = parseFloat(piece.style.left);
  const top = parseFloat(piece.style.top);
  const layout = computeLayout(1, 2, 2);
  const startX = 100;
  const startY = 100;
  fireEvent.pointerDown(piece, { pointerId: 1, clientX: startX, clientY: startY, button: 0 });
  fireEvent.pointerMove(piece, {
    pointerId: 1,
    clientX: startX + (target.x - (left + layout.pad)),
    clientY: startY + (target.y - (top + layout.pad)),
  });
  fireEvent.pointerUp(piece, { pointerId: 1 });
}

describe('PuzzleBoard', () => {
  it('hiển thị đủ số mảnh, đồng hồ và nút thao tác', () => {
    renderBoard();
    expect(screen.getAllByRole('img').filter((el) => el.classList.contains('jigsaw-piece'))).toHaveLength(4);
    expect(screen.getByText('Đã đặt 0/4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gợi ý/ })).toBeInTheDocument();
  });

  it('thả đúng chỗ thì mảnh dính, thả sai chỗ thì không', () => {
    renderBoard();
    const layout = computeLayout(1, 2, 2);
    // Mảnh 0 thả xa vị trí đúng: không dính
    dragPieceTo(0, { x: layout.board.x + layout.cellW * 1.8, y: layout.board.y + layout.cellH * 1.8 });
    expect(screen.getByText('Đã đặt 0/4')).toBeInTheDocument();
    // Mảnh 0 thả gần vị trí đúng: dính
    dragPieceTo(0, homePosition(layout, 0));
    expect(screen.getByText('Đã đặt 1/4')).toBeInTheDocument();
    expect(screen.getByText('2 lượt kéo')).toBeInTheDocument();
  });

  it('ghép xong đủ mảnh thì báo hoàn thành đúng một lần kèm số lượt kéo', () => {
    const { onFinish } = renderBoard();
    const layout = computeLayout(1, 2, 2);
    for (let i = 0; i < 4; i++) dragPieceTo(i, homePosition(layout, i));
    expect(screen.getByText('Đã đặt 4/4')).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toMatchObject({ moves: 4, hintsUsed: 0 });
  });

  it('gợi ý đặt một mảnh, ghi nhận đã dùng gợi ý và cảnh báo không vào xếp hạng', () => {
    const { onFinish } = renderBoard();
    fireEvent.click(screen.getByRole('button', { name: /Gợi ý/ }));
    expect(screen.getByText('Đã đặt 1/4')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('không được ghi vào bảng xếp hạng');
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: /Gợi ý/ }));
    expect(onFinish.mock.calls[0][0]).toMatchObject({ hintsUsed: 4 });
  });

  it('nút Thoát gọi onExit; nút phóng to bật tắt ảnh mẫu', () => {
    const { onExit } = renderBoard();
    const preview = screen.getByRole('button', { name: 'Phóng to ảnh mẫu' });
    fireEvent.click(preview);
    expect(screen.getByAltText('Ảnh mẫu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thu nhỏ ảnh mẫu' }));
    expect(screen.queryByAltText('Ảnh mẫu')).not.toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Thoát/ }));
    });
    expect(onExit).toHaveBeenCalled();
  });

  it('hình mẫu thu nhỏ nằm ở góc, khu vực xếp để trống (không ảnh nền, không lưới)', () => {
    const { container } = render(
      <PuzzleBoard imageUrl="/x.jpg" aspect={1} rows={2} cols={2} onFinish={vi.fn()} onExit={vi.fn()} />,
    );
    expect(screen.getByAltText('Hình mẫu')).toBeInTheDocument();
    const board = container.querySelector('.puzzle-board');
    expect(board).not.toBeNull();
    expect(board?.querySelector('img, svg, line')).toBeNull();
  });

  it('kéo tới đúng vị trí thì viền sáng, kéo ra xa thì tắt, thả thì dính và loé sáng', () => {
    renderBoard();
    const layout = computeLayout(1, 2, 2);
    const piece = screen.getAllByRole('img').filter((el) => el.classList.contains('jigsaw-piece'))[0];
    const left = parseFloat(piece.style.left);
    const top = parseFloat(piece.style.top);
    const home = homePosition(layout, 0);
    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(piece, {
      pointerId: 1,
      clientX: 100 + (layout.board.x + layout.cellW * 1.9 - (left + layout.pad)),
      clientY: 100 + (layout.board.y + layout.cellH * 1.9 - (top + layout.pad)),
    });
    expect(piece.classList.contains('is-glowing')).toBe(false);
    fireEvent.pointerMove(piece, {
      pointerId: 1,
      clientX: 100 + (home.x + 4 - (left + layout.pad)),
      clientY: 100 + (home.y - 4 - (top + layout.pad)),
    });
    expect(piece.classList.contains('is-glowing')).toBe(true);
    fireEvent.pointerUp(piece, { pointerId: 1 });
    expect(piece.classList.contains('is-glowing')).toBe(false);
    expect(piece.classList.contains('is-placed')).toBe(true);
    expect(piece.classList.contains('is-flash')).toBe(true);
  });

  it('bộ lọc mảnh viền ẩn mảnh trong khỏi khay và bỏ lọc thì hiện lại', () => {
    render(<PuzzleBoard imageUrl="/x.jpg" aspect={1} rows={3} cols={3} onFinish={vi.fn()} onExit={vi.fn()} />);
    const pieces = () => screen.getAllByRole('img').filter((el) => el.classList.contains('jigsaw-piece'));
    expect(pieces().filter((p) => p.classList.contains('is-filtered'))).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Mảnh viền (8)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mảnh trong (1)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mảnh viền (8)' }));
    const hidden = pieces().filter((p) => p.classList.contains('is-filtered'));
    expect(hidden).toHaveLength(1); // chỉ mảnh giữa (hàng 2, cột 2) bị ẩn
    expect(hidden[0]).toHaveAttribute('aria-label', expect.stringContaining('hàng 2, cột 2'));

    fireEvent.click(screen.getByRole('button', { name: 'Mảnh trong (1)' }));
    expect(pieces().filter((p) => p.classList.contains('is-filtered'))).toHaveLength(8);

    fireEvent.click(screen.getByRole('button', { name: /^Tất cả/ }));
    expect(pieces().filter((p) => p.classList.contains('is-filtered'))).toHaveLength(0);
  });

  it('mảnh đã đặt luôn hiện dù lọc nhóm khác, và gợi ý lấy mảnh trong nhóm đang lọc', () => {
    render(<PuzzleBoard imageUrl="/x.jpg" aspect={1} rows={3} cols={3} onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mảnh trong (1)' }));
    fireEvent.click(screen.getByRole('button', { name: /Gợi ý/ }));
    // Gợi ý đặt đúng mảnh giữa, số mảnh trong còn 0 và có thông báo
    expect(screen.getByText('Đã đặt 1/9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mảnh trong (0)' })).toBeInTheDocument();
    expect(screen.getAllByRole('status').some((el) => el.textContent?.includes('Đã ghép hết mảnh trong'))).toBe(true);
    const placedPiece = screen.getAllByRole('img').find((el) => el.classList.contains('is-placed'));
    expect(placedPiece).toBeDefined();
    expect(placedPiece?.classList.contains('is-filtered')).toBe(false);
  });

  it('xoay ngang giữa ván: mảnh đã đặt về đúng chỗ mới, mảnh còn lại rải lại, tiến độ giữ nguyên', () => {
    const originalW = window.innerWidth;
    const originalH = window.innerHeight;
    try {
      renderBoard();
      const wide = computeLayout(1, 2, 2);
      dragPieceTo(0, homePosition(wide, 0));
      expect(screen.getByText('Đã đặt 1/4')).toBeInTheDocument();

      // Điện thoại xoay ngang 844x390
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });
      act(() => {
        window.dispatchEvent(new Event('orientationchange'));
        window.dispatchEvent(new Event('resize'));
      });

      const land = computeLayout(1, 2, 2, 'landscape');
      const pieces = screen.getAllByRole('img').filter((el) => el.classList.contains('jigsaw-piece'));
      expect(pieces).toHaveLength(4);
      expect(screen.getByText('Đã đặt 1/4')).toBeInTheDocument();
      const placedPiece = pieces[0];
      expect(placedPiece.classList.contains('is-placed')).toBe(true);
      const home = homePosition(land, 0);
      expect(parseFloat(placedPiece.style.left)).toBeCloseTo(home.x - land.pad);
      expect(parseFloat(placedPiece.style.top)).toBeCloseTo(home.y - land.pad);
      // Mảnh chưa đặt nằm trong khay bên phải
      for (const piece of pieces.slice(1)) {
        expect(parseFloat(piece.style.left) + land.pad).toBeGreaterThanOrEqual(land.tray.x);
      }

      // Kéo thả vẫn dùng được ở bố cục mới
      const piece1 = pieces[1];
      const left = parseFloat(piece1.style.left);
      const top = parseFloat(piece1.style.top);
      const h1 = homePosition(land, 1);
      // Khi ngang, khung co theo chiều cao màn hình (390 - 8) nên toạ độ con trỏ nhân với tỉ lệ này
      const k = Math.min(1, Math.max(0.35, (390 - 8) / land.height));
      fireEvent.pointerDown(piece1, { pointerId: 2, clientX: 100, clientY: 100, button: 0 });
      fireEvent.pointerMove(piece1, {
        pointerId: 2,
        clientX: 100 + (h1.x - (left + land.pad)) * k,
        clientY: 100 + (h1.y - (top + land.pad)) * k,
      });
      fireEvent.pointerUp(piece1, { pointerId: 2 });
      expect(screen.getByText('Đã đặt 2/4')).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalW });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalH });
    }
  });

  it('hệ điều hành huỷ thao tác (chụm zoom) thì không tính lượt kéo và không bắt vào khung', () => {
    renderBoard();
    const layout = computeLayout(1, 2, 2);
    const piece = screen.getAllByRole('img').filter((el) => el.classList.contains('jigsaw-piece'))[0];
    const left = parseFloat(piece.style.left);
    const top = parseFloat(piece.style.top);
    const home = homePosition(layout, 0);
    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(piece, {
      pointerId: 1,
      clientX: 100 + (home.x - (left + layout.pad)),
      clientY: 100 + (home.y - (top + layout.pad)),
    });
    fireEvent.pointerCancel(piece, { pointerId: 1 });
    expect(screen.getByText('0 lượt kéo')).toBeInTheDocument();
    expect(screen.getByText('Đã đặt 0/4')).toBeInTheDocument();
    expect(piece.classList.contains('is-glowing')).toBe(false);
  });

  it('nút Toàn màn hình phủ kín trang bằng CSS (trình duyệt không hỗ trợ API) và thoát được', () => {
    const { container } = render(
      <PuzzleBoard imageUrl="/x.jpg" aspect={1} rows={2} cols={2} onFinish={vi.fn()} onExit={vi.fn()} />,
    );
    const root = container.querySelector('.puzzle-play') as HTMLElement;
    expect(root.classList.contains('is-fullscreen')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Toàn màn hình' }));
    expect(root.classList.contains('is-fullscreen')).toBe(true);
    expect(document.body.classList.contains('puzzle-fullscreen-lock')).toBe(true);
    // Vẫn còn đủ mảnh và thanh công cụ trong chế độ toàn màn hình
    expect(screen.getAllByRole('img').filter((el) => el.classList.contains('jigsaw-piece'))).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Thoát toàn màn hình' }));
    expect(root.classList.contains('is-fullscreen')).toBe(false);
    expect(document.body.classList.contains('puzzle-fullscreen-lock')).toBe(false);
  });

  it('có Fullscreen API thì gọi requestFullscreen; thoát bằng Esc (fullscreenchange) thì tự bỏ lớp phủ', () => {
    const request = vi.fn(() => Promise.resolve());
    HTMLElement.prototype.requestFullscreen = request;
    const { container } = render(
      <PuzzleBoard imageUrl="/x.jpg" aspect={1} rows={2} cols={2} onFinish={vi.fn()} onExit={vi.fn()} />,
    );
    const root = container.querySelector('.puzzle-play') as HTMLElement;
    fireEvent.click(screen.getByRole('button', { name: 'Toàn màn hình' }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(root.classList.contains('is-fullscreen')).toBe(true);
    // Người dùng nhấn Esc: trình duyệt đã thoát (document.fullscreenElement rỗng) và phát sự kiện
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(root.classList.contains('is-fullscreen')).toBe(false);
    // @ts-expect-error dọn mock
    delete HTMLElement.prototype.requestFullscreen;
  });
});
