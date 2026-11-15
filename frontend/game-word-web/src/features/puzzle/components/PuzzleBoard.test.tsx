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
    <PuzzleBoard imageUrl="/x.jpg" aspect={1} rows={2} cols={2} showGhost onFinish={onFinish} onExit={onExit} />,
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

  it('nút Thoát gọi onExit; nút Xem ảnh mẫu bật tắt ảnh mẫu', () => {
    const { onExit } = renderBoard();
    const preview = screen.getByRole('button', { name: 'Xem ảnh mẫu' });
    fireEvent.click(preview);
    expect(screen.getByAltText('Ảnh mẫu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn ảnh mẫu' }));
    expect(screen.queryByAltText('Ảnh mẫu')).not.toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Thoát/ }));
    });
    expect(onExit).toHaveBeenCalled();
  });
});
