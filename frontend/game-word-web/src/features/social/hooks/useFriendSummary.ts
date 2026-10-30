import { useCallback, useEffect, useState } from 'react';
import { usePolling } from '../../../hooks/usePolling';
import { getFriendSummary } from '../../../services/api';

const POLL_MS = 15_000;

// Số lời mời kết bạn đang chờ + tin nhắn chưa đọc, cho badge trên thanh điều hướng
export function useFriendSummary(enabled: boolean): number {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const summary = await getFriendSummary();
    setCount(summary.pendingRequests + summary.unreadMessages);
  }, []);

  useEffect(() => {
    if (enabled) void load().catch(() => undefined);
    else setCount(0);
  }, [enabled, load]);

  usePolling(load, POLL_MS, enabled);
  return count;
}
