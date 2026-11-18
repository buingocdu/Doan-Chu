import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminGames from './AdminGames';
import * as api from '../../../services/api';
import type { PuzzleGame, PuzzleImage } from '../../../types/api';

vi.mock('../../../services/api', async () => {
  const actual = await vi.importActual<typeof import('../../../services/api')>('../../../services/api');
  return {
    ...actual,
    getAdminPuzzleGames: vi.fn(),
    createPuzzleGame: vi.fn(),
    updatePuzzleGame: vi.fn(),
    deletePuzzleGame: vi.fn(),
    getAdminPuzzleImageBlob: vi.fn(),
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

const game = (over: Partial<PuzzleGame> = {}): PuzzleGame => ({
  id: 11,
  title: 'Game cũ',
  imageId: 1,
  width: 900,
  height: 600,
  imageVersion: 0,
  snapPercent: 8,
  rows: 3,
  cols: 3,
  active: true,
  createdAt: '2026-11-17T10:00:00',
  ...over,
});

const images = [image(1, 'Hoa sen'), image(2, 'Bien xanh')];

beforeEach(() => {
  vi.mocked(api.getAdminPuzzleGames).mockResolvedValue([game()]);
  vi.mocked(api.createPuzzleGame).mockResolvedValue(game({ id: 12, title: 'Moi' }));
  vi.mocked(api.updatePuzzleGame).mockResolvedValue(game());
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderGames = () =>
  render(<AdminGames images={images} imagesLoading={false} preselectImageId={1} onNeedImages={vi.fn()} />);

// Khung "Tạo game mới" (danh sách game bên dưới cũng có thanh trượt riêng trong khung thu gọn)
const createCard = () => document.querySelector('.admin-upload') as HTMLElement;

describe('Tạo game: độ tự động khớp', () => {
  it('mặc định 8, ghi rõ là mặc định, và lưu game gửi đúng giá trị mặc định', async () => {
    renderGames();
    await screen.findByText('Game cũ');
    const card = within(createCard());
    const slider = card.getByLabelText('Độ tự động khớp') as HTMLInputElement;
    expect(slider.value).toBe('8');
    expect(card.getByText('8 (mặc định)')).toBeInTheDocument();
    expect(card.getByRole('button', { name: /Về mặc định/ })).toBeDisabled();
    expect(slider.min).toBe('2');
    expect(slider.max).toBe('20');

    fireEvent.click(card.getByRole('button', { name: /Lưu game/ }));
    await waitFor(() => expect(api.createPuzzleGame).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createPuzzleGame).mock.calls[0][0]).toMatchObject({ imageId: 1, snapPercent: 8 });
  });

  it('chỉnh thanh trượt rồi lưu: game được tạo với giá trị đã chọn; có thể về mặc định', async () => {
    renderGames();
    await screen.findByText('Game cũ');
    const card = within(createCard());
    fireEvent.change(card.getByLabelText('Độ tự động khớp'), { target: { value: '14' } });
    expect(card.getByText('14')).toBeInTheDocument();
    const reset = card.getByRole('button', { name: /Về mặc định/ });
    expect(reset).toBeEnabled();

    fireEvent.click(card.getByRole('button', { name: /Lưu game/ }));
    await waitFor(() => expect(api.createPuzzleGame).toHaveBeenCalled());
    expect(vi.mocked(api.createPuzzleGame).mock.calls[0][0]).toMatchObject({ snapPercent: 14 });

    fireEvent.click(reset);
    expect((card.getByLabelText('Độ tự động khớp') as HTMLInputElement).value).toBe('8');
  });

  it('nhắc rõ điện thoại tự cộng thêm 20%', async () => {
    renderGames();
    await screen.findByText('Game cũ');
    expect(within(createCard()).getByText(/tự tăng thêm 20%/)).toBeInTheDocument();
  });
});

describe('Chỉnh độ tự động khớp của game đã tạo', () => {
  it('mỗi game hiện độ khớp; chỉnh rồi lưu gọi cập nhật chỉ với snapPercent', async () => {
    vi.mocked(api.getAdminPuzzleGames).mockResolvedValue([game({ snapPercent: 6 })]);
    renderGames();
    const row = (await screen.findByText('Game cũ')).closest('li') as HTMLElement;
    expect(within(row).getByText('Độ tự động khớp: 6')).toBeInTheDocument();

    fireEvent.click(within(row).getByText('Độ tự động khớp: 6')); // mở khung chỉnh
    const slider = within(row).getByLabelText('Độ tự động khớp') as HTMLInputElement;
    expect(slider.value).toBe('6');
    const save = within(row).getByRole('button', { name: 'Lưu độ khớp' });
    expect(save).toBeDisabled(); // chưa đổi gì
    fireEvent.change(slider, { target: { value: '12' } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(api.updatePuzzleGame).toHaveBeenCalledWith(11, { snapPercent: 12 }));
  });

  it('Hoàn tác đưa về giá trị đang lưu', async () => {
    vi.mocked(api.getAdminPuzzleGames).mockResolvedValue([game({ snapPercent: 6 })]);
    renderGames();
    const row = (await screen.findByText('Game cũ')).closest('li') as HTMLElement;
    fireEvent.click(within(row).getByText('Độ tự động khớp: 6'));
    const slider = within(row).getByLabelText('Độ tự động khớp') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '15' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Hoàn tác' }));
    expect(slider.value).toBe('6');
    expect(api.updatePuzzleGame).not.toHaveBeenCalled();
  });
});
