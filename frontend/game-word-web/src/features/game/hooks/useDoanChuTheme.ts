import { useEffect } from 'react';

export const DOANCHU_THEME_CLASS = 'theme-doanchu';

/** Bật giao diện nền chàm - vàng của game Đoán chữ trong lúc trang đang mở (gỡ ra khi rời trang để các trang khác giữ giao diện chung) */
export function useDoanChuTheme(): void {
  useEffect(() => {
    document.body.classList.add(DOANCHU_THEME_CLASS);
    return () => document.body.classList.remove(DOANCHU_THEME_CLASS);
  }, []);
}
