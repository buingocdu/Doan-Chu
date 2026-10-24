import { useCallback, useEffect, useReducer, useRef } from 'react';
import { getCurrentGame, getErrorMessage, makeGuess, startGame } from '../../../services/api';
import { clearGameId, loadGameId, ownerKey, saveGameId } from '../utils/currentGameStorage';
import { countLetters, formatGuess, gameReducer, initialGameState } from '../utils/gameState';

export function useGame(userId: number | null) {
  const owner = ownerKey(userId);
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  // Các từ đã chơi trong phiên này, gửi lên để không bị lặp từ
  const playedWordIds = useRef<number[]>([]);
  // Bỏ qua response của request cũ (StrictMode, bấm "ván mới" liên tục)
  const requestId = useRef(0);

  // resume = true: tiếp tục ván đang dở nếu có (khi mở/tải lại trang); false: luôn bắt đầu ván mới
  const load = useCallback(
    async (resume: boolean) => {
      const id = ++requestId.current;
      dispatch({ type: 'start_request' });
      try {
        const current = resume ? await getCurrentGame(loadGameId(owner)) : null;
        if (id !== requestId.current) return;
        if (current) {
          saveGameId(owner, current.gameId);
          dispatch({ type: 'restore_success', game: current });
          return;
        }
        const response = await startGame(playedWordIds.current);
        if (id !== requestId.current) return;
        saveGameId(owner, response.gameId);
        dispatch({ type: 'start_success', response });
      } catch (error) {
        if (id === requestId.current) {
          dispatch({ type: 'start_failure', message: getErrorMessage(error, 'Không thể bắt đầu ván chơi.') });
        }
      }
    },
    [owner],
  );

  const newGame = useCallback(() => load(false), [load]);
  const retry = useCallback(() => load(true), [load]);

  useEffect(() => {
    void load(true);
    return () => {
      requestId.current++;
    };
  }, [load]);

  const submit = useCallback(async () => {
    if (state.status !== 'playing' || state.gameId === null) return;
    const total = countLetters(state.input);
    if (total > state.wordLength) {
      dispatch({ type: 'notice', message: `Thừa ${total - state.wordLength} chữ cái, hãy xóa bớt.` });
      return;
    }
    if (state.current.length !== state.wordLength) {
      dispatch({ type: 'notice', message: `Hãy nhập đủ ${state.wordLength} chữ cái.` });
      return;
    }
    const id = requestId.current;
    dispatch({ type: 'submit_request' });
    try {
      // Gửi cả cụm từ có dấu và dấu cách, ví dụ "TIẾNG ANH"; backend tự chuẩn hóa để chấm
      const guess = formatGuess(state.display.join(''), state.partLengths);
      const response = await makeGuess({ gameId: state.gameId, guess });
      if (id !== requestId.current) return;
      if (response.gameOver) {
        clearGameId();
        if (state.wordId !== null) playedWordIds.current.push(state.wordId);
      }
      dispatch({ type: 'submit_success', response });
    } catch (error) {
      if (id === requestId.current) {
        dispatch({ type: 'submit_failure', message: getErrorMessage(error, 'Không gửi được lượt đoán.') });
      }
    }
  }, [state.status, state.gameId, state.wordId, state.input, state.current, state.display, state.partLengths, state.wordLength]);

  const typeLetter = useCallback((letter: string) => dispatch({ type: 'type_letter', letter }), []);
  const backspace = useCallback(() => dispatch({ type: 'backspace' }), []);
  const setInput = useCallback((value: string) => dispatch({ type: 'set_input', value }), []);

  return { state, newGame, retry, submit, typeLetter, backspace, setInput };
}
