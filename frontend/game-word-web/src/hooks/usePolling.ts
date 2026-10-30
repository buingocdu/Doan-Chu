import { useEffect, useRef } from 'react';

// Gọi task định kỳ. Không chồng request: chờ lần trước xong mới hẹn lần sau.
// Dừng khi tab bị ẩn và gọi ngay khi tab hiện lại (tiết kiệm request cho server gói Free).
export function usePolling(task: () => Promise<void>, intervalMs: number, enabled = true) {
  const taskRef = useRef(task);
  taskRef.current = task;

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    let running = false;
    let stopped = false;

    const schedule = () => {
      window.clearTimeout(timer);
      if (!stopped && document.visibilityState === 'visible') timer = window.setTimeout(run, intervalMs);
    };

    const run = async () => {
      if (running || stopped) return;
      running = true;
      try {
        await taskRef.current();
      } catch {
        // Lỗi do task tự xử lý; vẫn tiếp tục poll
      } finally {
        running = false;
        schedule();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void run();
      else window.clearTimeout(timer);
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}
