import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { getErrorMessage, getHistory, getHttpStatus } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import StatusMessage from '../../../components/common/StatusMessage';
import { COLOR_LABELS } from '../../game/utils/gameState';
import type { GameHistory } from '../../../types/api';
import { formatDateTime, groupHistory } from '../utils/groupHistory';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; items: GameHistory[] };

export default function HistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const userId = user?.id;

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (userId === undefined) return;
      setState({ status: 'loading' });
      try {
        const items = await getHistory(userId);
        if (!signal?.aborted) setState({ status: 'success', items });
      } catch (error) {
        if (signal?.aborted) return;
        const status = getHttpStatus(error);
        if (status === 401 || status === 403) {
          // Token không còn hợp lệ: đăng xuất và yêu cầu đăng nhập lại
          logout();
          navigate('/login', { replace: true, state: { from: '/history' } });
          return;
        }
        setState({ status: 'error', message: getErrorMessage(error, 'Không tải được lịch sử chơi.') });
      }
    },
    [userId, logout, navigate],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const games = useMemo(() => (state.status === 'success' ? groupHistory(state.items) : []), [state]);
  const wins = games.filter((g) => g.won).length;

  return (
    <section className="page">
      <h1>
        <History size={24} aria-hidden="true" /> Lịch sử chơi
      </h1>
      {state.status === 'loading' && <StatusMessage kind="loading">Đang tải lịch sử…</StatusMessage>}
      {state.status === 'error' && (
        <StatusMessage kind="error" onRetry={() => void load()}>
          {state.message}
        </StatusMessage>
      )}
      {state.status === 'success' && games.length === 0 && (
        <StatusMessage kind="empty">Bạn chưa chơi ván nào. Quay lại trang chơi để bắt đầu nhé!</StatusMessage>
      )}
      {games.length > 0 && (
        <>
          <p className="muted">
            {games.length} ván · thắng {wins}
          </p>
          <ul className="history-list">
            {games.map((game) => (
              <li key={game.key} className="card history-item">
                <div className="history-head">
                  <span className={`badge ${game.won ? 'badge-win' : 'badge-lose'}`}>{game.won ? 'Thắng' : 'Chưa đoán đúng'}</span>
                  <span className="muted">{formatDateTime(game.playedAt)}</span>
                </div>
                <p>
                  {game.won ? (
                    <>
                      Từ: <strong>{game.answer}</strong> · {game.guesses.length} lượt
                    </>
                  ) : (
                    <>{game.guesses.length} lượt đoán</>
                  )}
                </p>
                <div className="mini-board" aria-label="Kết quả từng lượt">
                  {game.guesses.map((g, i) => (
                    <div key={i} className="mini-row">
                      {g.colors.map((color, j) => (
                        <span
                          key={j}
                          className={`tile tile-mini tile-${color.toLowerCase()}`}
                          aria-label={`${g.letters[j] ?? ''}: ${COLOR_LABELS[color]}`}
                        >
                          {g.letters[j]}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
