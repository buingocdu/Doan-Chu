// Lưu gameId của ván đang chơi để tải lại trang vẫn tiếp tục đúng ván đó.
// Tách theo người chơi (khách / user id) để không lấy nhầm ván của tài khoản khác trên cùng trình duyệt.
const KEY = 'gw.currentGame';

interface Saved {
  owner: string;
  gameId: number;
}

export const ownerKey = (userId: number | null) => (userId === null ? 'guest' : `user:${userId}`);

export function loadGameId(owner: string): number | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    return saved && saved.owner === owner && typeof saved.gameId === 'number' ? saved.gameId : null;
  } catch {
    return null;
  }
}

export function saveGameId(owner: string, gameId: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ owner, gameId } satisfies Saved));
  } catch {
    // Trình duyệt chặn localStorage: vẫn chơi được, chỉ không khôi phục sau khi tải lại
  }
}

export function clearGameId() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
}
