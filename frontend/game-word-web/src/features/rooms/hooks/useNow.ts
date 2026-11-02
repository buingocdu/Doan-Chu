import { useEffect, useState } from 'react';

// Giờ máy, cập nhật mỗi intervalMs (để vẽ đồng hồ đếm ngược); dừng khi active = false
export function useNow(intervalMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, active]);
  return now;
}
