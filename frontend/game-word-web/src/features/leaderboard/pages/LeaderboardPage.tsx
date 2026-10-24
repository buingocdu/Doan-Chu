import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { getErrorMessage, getLeaderboard } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import StatusMessage from '../../../components/common/StatusMessage';
import type { LeaderboardEntry } from '../../../types/api';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; entries: LeaderboardEntry[] };

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ status: 'loading' });
    try {
      const entries = await getLeaderboard();
      if (!signal?.aborted) setState({ status: 'success', entries });
    } catch (error) {
      if (!signal?.aborted) setState({ status: 'error', message: getErrorMessage(error, 'Không tải được bảng xếp hạng.') });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <section className="page">
      <h1>
        <Trophy size={24} aria-hidden="true" /> Bảng xếp hạng
      </h1>
      {state.status === 'loading' && <StatusMessage kind="loading">Đang tải bảng xếp hạng…</StatusMessage>}
      {state.status === 'error' && (
        <StatusMessage kind="error" onRetry={() => void load()}>
          {state.message}
        </StatusMessage>
      )}
      {state.status === 'success' && state.entries.length === 0 && (
        <StatusMessage kind="empty">Chưa có ai trên bảng xếp hạng. Hãy là người đầu tiên!</StatusMessage>
      )}
      {state.status === 'success' && state.entries.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Hạng</th>
                <th scope="col">Người chơi</th>
                <th scope="col" className="num">Điểm</th>
                <th scope="col" className="num">Số ván</th>
                <th scope="col" className="num">Thắng</th>
              </tr>
            </thead>
            <tbody>
              {state.entries.map((e) => (
                <tr key={e.userId} className={user?.id === e.userId ? 'is-me' : undefined}>
                  <td>
                    <span className={`rank rank-${Math.min(e.rank, 4)}`}>{e.rank}</span>
                  </td>
                  <td>
                    {e.username}
                    {user?.id === e.userId && <span className="badge">Bạn</span>}
                  </td>
                  <td className="num strong">{e.totalScore}</td>
                  <td className="num">{e.gamesPlayed}</td>
                  <td className="num">{e.gamesWon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
