import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPuzzlePage from './AdminPuzzlePage';
import * as api from '../../../services/api';
import type { PuzzleGame, PuzzleImage } from '../../../types/api';

vi.mock('../../../services/api', async () => {
  const actual = await vi.importActual<typeof import('../../../services/api')>('../../../services/api');
  return {
    ...actual,
    getAdminPuzzleImages: vi.fn(),
    getAdminPuzzleGames: vi.fn(),
    deletePuzzleImage: vi.fn(),
    rotatePuzzleImage: vi.fn(),
    updatePuzzleImage: vi.fn(),
    uploadPuzzleImage: vi.fn(),
  };
});

const image = (id: number, title: string): PuzzleImage => ({
  id,
  title,
  width: 900,
  height: 600,
  sizeBytes: 1000 + id,
  active: true,
  version: 0,
  createdAt: '2026-11-17T10:00:00',
});

const game = (id: number, imageId: number): PuzzleGame => ({
  id,
  title: `Game ${id}`,
  imageId,
  width: 900,
  height: 600,
  imageVersion: 1000 + imageId,
  rows: 3,
  cols: 3,
  active: true,
  createdAt: '2026-11-17T10:00:00',
});

let images: PuzzleImage[];

beforeEach(() => {
  images = [image(1, 'Hoa sen'), image(2, 'Bien xanh'), image(3, 'Nui cao')];
  vi.mocked(api.getAdminPuzzleImages).mockImplementation(() => Promise.resolve(images));
  // Ảnh 1 được dùng trong 2 game, ảnh 2 trong 1 game, ảnh 3 chưa dùng
  vi.mocked(api.getAdminPuzzleGames).mockResolvedValue([game(1, 1), game(2, 1), game(3, 2)]);
  vi.mocked(api.deletePuzzleImage).mockImplementation((id: number) => {
    images = images.filter((i) => i.id !== id);
    return Promise.resolve(undefined);
  });
  vi.mocked(api.rotatePuzzleImage).mockResolvedValue(image(1, 'Hoa sen'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

async function openImagesTab() {
  render(<AdminPuzzlePage />);
  fireEvent.click(await screen.findByRole('tab', { name: 'Kho ảnh' }));
  await screen.findByText('Hoa sen');
}

describe('Quản trị kho ảnh', () => {
  it('xóa một ảnh: cảnh báo số game bị xóa theo, hủy thì không xóa', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await openImagesTab();
    const row = screen.getByText('Hoa sen').closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: /Xóa/ }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(String(confirm.mock.calls[0][0])).toContain('2 game');
    expect(api.deletePuzzleImage).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(within(row).getByRole('button', { name: /Xóa/ }));
    await waitFor(() => expect(api.deletePuzzleImage).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('Hoa sen')).not.toBeInTheDocument());
  });

  it('ảnh chưa dùng trong game nào thì cảnh báo nhẹ hơn', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await openImagesTab();
    const row = screen.getByText('Nui cao').closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: /Xóa/ }));
    expect(String(confirm.mock.calls[0][0])).toContain('chưa được dùng trong game nào');
  });

  it('chọn nhiều ảnh rồi xóa một lượt, cảnh báo tổng số game bị ảnh hưởng', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await openImagesTab();
    const bulkButton = screen.getByRole('button', { name: /Xóa đã chọn/ });
    expect(bulkButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn ảnh Hoa sen' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn ảnh Bien xanh' }));
    expect(screen.getByText('Đã chọn 2/3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Xóa đã chọn \(2\)/ }));

    await waitFor(() => expect(api.deletePuzzleImage).toHaveBeenCalledTimes(2));
    expect(String(confirm.mock.calls[0][0])).toContain('Xóa 2 ảnh đã chọn');
    expect(String(confirm.mock.calls[0][0])).toContain('3 game'); // 2 + 1
    await waitFor(() => expect(screen.getByText('Đã xóa 2 ảnh.')).toBeInTheDocument());
    expect(screen.queryByText('Hoa sen')).not.toBeInTheDocument();
    expect(screen.getByText('Nui cao')).toBeInTheDocument();
  });

  it('chọn tất cả rồi bỏ chọn', async () => {
    await openImagesTab();
    const all = screen.getByRole('checkbox', { name: 'Chọn tất cả' });
    fireEvent.click(all);
    expect(screen.getByText('Đã chọn 3/3')).toBeInTheDocument();
    fireEvent.click(all);
    expect(screen.getByText('3 ảnh')).toBeInTheDocument();
  });

  it('lỗi khi xóa một ảnh trong lô thì báo rõ và vẫn xóa các ảnh còn lại', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.deletePuzzleImage).mockImplementation((id: number) => {
      if (id === 2) return Promise.reject(new Error('boom'));
      images = images.filter((i) => i.id !== id);
      return Promise.resolve(undefined);
    });
    await openImagesTab();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả' }));
    fireEvent.click(screen.getByRole('button', { name: /Xóa đã chọn/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Đã xóa 2 ảnh'));
    expect(screen.getByRole('alert')).toHaveTextContent('Bien xanh');
    expect(screen.getByText('Bien xanh')).toBeInTheDocument();
  });

  it('nút xoay trái/phải gọi API với -90 và 90 độ', async () => {
    await openImagesTab();
    fireEvent.click(screen.getByRole('button', { name: 'Xoay phải ảnh Hoa sen' }));
    await waitFor(() => expect(api.rotatePuzzleImage).toHaveBeenCalledWith(1, 90));
    fireEvent.click(screen.getByRole('button', { name: 'Xoay trái ảnh Hoa sen' }));
    await waitFor(() => expect(api.rotatePuzzleImage).toHaveBeenCalledWith(1, -90));
  });
});
