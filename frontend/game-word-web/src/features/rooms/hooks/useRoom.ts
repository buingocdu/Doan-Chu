import { useCallback, useEffect, useRef, useState } from 'react';
import { usePolling } from '../../../hooks/usePolling';
import {
  getErrorMessage,
  getHttpStatus,
  getRoomState,
  joinRoom,
  leaveRoom,
  roomChain,
  roomGuess,
  sendRoomMessage,
  startMatch,
} from '../../../services/api';
import type { GameType, RoomState } from '../../../types/api';
import { lastMessageId, mergeRoomState, type RoomView } from '../utils/roomState';

const POLL_PLAYING_MS = 1000;
const POLL_WAITING_MS = 2000;

// Trạng thái một phòng: vào phòng khi mở trang, poll theo version, các thao tác trả về trạng thái mới
export function useRoom(code: string) {
  const [view, setView] = useState<RoomView | null>(null);
  // Lỗi không thể tiếp tục (phòng không tồn tại, không vào được)
  const [fatal, setFatal] = useState<string | null>(null);
  // Mất kết nối tạm thời; vẫn tiếp tục poll
  const [offline, setOffline] = useState(false);
  const viewRef = useRef<RoomView | null>(null);
  viewRef.current = view;

  const apply = useCallback((state: RoomState) => {
    setView((prev) => mergeRoomState(prev, state));
    setOffline(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setView(null);
    setFatal(null);
    joinRoom(code)
      .then((state) => {
        if (!cancelled) apply(state);
      })
      .catch((error) => {
        if (!cancelled) setFatal(getErrorMessage(error, 'Không vào được phòng.'));
      });
    return () => {
      cancelled = true;
    };
  }, [code, apply]);

  const refresh = useCallback(async () => {
    const current = viewRef.current;
    if (!current) return;
    try {
      apply(await getRoomState(code, current.version, lastMessageId(current)));
    } catch (error) {
      const status = getHttpStatus(error);
      if (status === 400) setFatal(getErrorMessage(error, 'Phòng không còn tồn tại.'));
      else setOffline(true);
    }
  }, [code, apply]);

  const playing = view?.status === 'PLAYING';
  usePolling(refresh, playing ? POLL_PLAYING_MS : POLL_WAITING_MS, view !== null && fatal === null);

  const start = useCallback(async (gameType: GameType) => apply(await startMatch(code, gameType)), [code, apply]);

  const guess = useCallback(
    async (text: string) => apply(await roomGuess(code, text, lastMessageId(viewRef.current))),
    [code, apply],
  );

  const chain = useCallback(
    async (word: string) => apply(await roomChain(code, word, lastMessageId(viewRef.current))),
    [code, apply],
  );

  // Không tự chèn tin vừa gửi (có thể bỏ sót tin người khác gửi xen giữa); poll ngay để lấy đúng thứ tự
  const sendMessage = useCallback(
    async (content: string) => {
      await sendRoomMessage(code, content);
      await refresh();
    },
    [code, refresh],
  );

  const leave = useCallback(() => leaveRoom(code), [code]);

  return { view, fatal, offline, start, guess, chain, sendMessage, leave, refresh };
}
