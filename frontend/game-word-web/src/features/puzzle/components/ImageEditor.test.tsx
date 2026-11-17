import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageEditor from './ImageEditor';
import * as api from '../../../services/api';
import type { PuzzleImage } from '../../../types/api';

vi.mock('../../../services/api', async () => {
  const actual = await vi.importActual<typeof import('../../../services/api')>('../../../services/api');
  return { ...actual, editPuzzleImage: vi.fn(), getAdminPuzzleImageBlob: vi.fn() };
});

const photo = (over: Partial<PuzzleImage> = {}): PuzzleImage => ({
  id: 7,
  title: 'Hoa sen',
  width: 900,
  height: 600,
  sizeBytes: 5000,
  active: true,
  createdAt: '2026-11-17T10:00:00',
  ...over,
});

const renderEditor = (image = photo(), gameCount = 0) => {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<ImageEditor image={image} gameCount={gameCount} onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved };
};

beforeEach(() => {
  vi.mocked(api.editPuzzleImage).mockResolvedValue(photo({ width: 600, height: 600 }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ImageEditor', () => {
  it('mở với toàn bộ ảnh, chưa có gì để lưu', () => {
    renderEditor();
    expect(screen.getByRole('dialog', { name: 'Sửa ảnh Hoa sen' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('900×600 px');
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  });

  it('xoay phải đổi chiều rộng/cao và lưu gửi đúng góc xoay', async () => {
    const { onSaved } = renderEditor();
    fireEvent.click(screen.getByRole('button', { name: /Xoay phải/ }));
    expect(screen.getByRole('status')).toHaveTextContent('600×900 px');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(api.editPuzzleImage).toHaveBeenCalledTimes(1));
    expect(api.editPuzzleImage).toHaveBeenCalledWith(7, { degrees: 90, asCopy: false });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }), false));
  });

  it('xoay trái ba lần liên tiếp tương đương xoay phải một lần (góc luôn trong 0–270)', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: /Xoay trái/ }));
    expect(screen.getByRole('status')).toHaveTextContent('600×900 px');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(api.editPuzzleImage).toHaveBeenCalled());
    expect(api.editPuzzleImage).toHaveBeenCalledWith(7, { degrees: 270, asCopy: false });
  });

  it('chọn tỉ lệ 1:1 dựng vùng vuông lớn nhất và gửi vùng cắt theo tỉ lệ ảnh', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: '1:1' }));
    expect(screen.getByRole('status')).toHaveTextContent('600×600 px');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(api.editPuzzleImage).toHaveBeenCalled());
    const payload = vi.mocked(api.editPuzzleImage).mock.calls[0][1];
    expect(payload.degrees).toBe(0);
    expect(payload.cropHeight).toBeCloseTo(1);
    expect(payload.cropWidth).toBeCloseTo(600 / 900);
    expect(payload.cropX).toBeCloseTo((1 - 600 / 900) / 2);
    expect(payload.cropY).toBeCloseTo(0);
  });

  it('vùng cắt quá nhỏ (cạnh ngắn dưới 300px) thì cảnh báo và không cho lưu', () => {
    renderEditor(photo({ width: 700, height: 320 }));
    fireEvent.click(screen.getByRole('button', { name: '9:16' })); // 180x320
    expect(screen.getByRole('status')).toHaveTextContent('cạnh ngắn cần tối thiểu 300px');
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  });

  it('bàn phím: mũi tên dời vùng cắt, Shift + mũi tên đổi kích thước', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: '1:1' }));
    const rect = screen.getByTestId('crop-rect');
    const before = parseFloat(rect.style.left);
    fireEvent.keyDown(rect, { key: 'ArrowRight' });
    expect(parseFloat(rect.style.left)).toBeCloseTo(before + 1, 5); // dời 1% (đơn vị %)
    const widthBefore = parseFloat(rect.style.width);
    fireEvent.keyDown(rect, { key: 'ArrowLeft', shiftKey: true });
    expect(parseFloat(rect.style.width)).toBeLessThan(widthBefore);
    // Vẫn giữ tỉ lệ 1:1 sau khi đổi kích thước
    expect(screen.getByRole('status').textContent).toMatch(/(\d+)×\1 px/);
  });

  it('Lưu thành ảnh mới: gửi asCopy và tên; cảnh báo game chỉ hiện khi sửa trực tiếp', async () => {
    const { onSaved } = renderEditor(photo(), 2);
    expect(screen.getByText(/đang được dùng trong 2 game/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Lưu thành ảnh mới/));
    expect(screen.queryByText(/đang được dùng trong 2 game/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tên ảnh mới'), { target: { value: 'Hoa sen vuông' } });
    fireEvent.click(screen.getByRole('button', { name: '1:1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu ảnh mới' }));
    await waitFor(() => expect(api.editPuzzleImage).toHaveBeenCalled());
    expect(vi.mocked(api.editPuzzleImage).mock.calls[0][1]).toMatchObject({ asCopy: true, title: 'Hoa sen vuông' });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.anything(), true));
  });

  it('Đặt lại, Esc và Hủy; lỗi từ máy chủ hiện thông báo và cho thử lại', async () => {
    vi.mocked(api.editPuzzleImage).mockRejectedValueOnce(new Error('boom'));
    const { onClose } = renderEditor();
    fireEvent.click(screen.getByRole('button', { name: /Xoay phải/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại' }));
    expect(screen.getByRole('status')).toHaveTextContent('900×600 px');
    fireEvent.click(screen.getByRole('button', { name: /Xoay phải/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeEnabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('ảnh đang ẩn được tải bằng token quản trị', async () => {
    vi.mocked(api.getAdminPuzzleImageBlob).mockResolvedValue(new Blob(['x']));
    const createUrl = vi.fn(() => 'blob:preview');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }));
    renderEditor(photo({ active: false }));
    await waitFor(() => expect(api.getAdminPuzzleImageBlob).toHaveBeenCalledWith(7));
    await waitFor(() => expect(createUrl).toHaveBeenCalled());
    vi.unstubAllGlobals();
  });
});
