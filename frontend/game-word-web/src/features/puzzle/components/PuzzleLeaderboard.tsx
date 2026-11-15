import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { getErrorMessage, getPuzzleLeaderboard } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import type { PuzzleRankEntry } from '../../../types/api';
import { formatDuration } from '../utils/jigsaw';

interface PuzzleLeaderboardProps {
  imageId: number;
  rows: number;
  cols: number;
  /** Đổi giá trị này để tải lại (vd sau khi nộp kết quả) */
  refreshKey?: number;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; entries: PuzzleRankEntry[] };

export default function PuzzleLeaderboard({ imageId, rows, cols, refreshKey = 0 }: PuzzleLeaderboardProps) {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    getPuzzleLeaderboard(imageId, rows, cols)
      .then((entries) => {
        if (!cancelled) setState({ status: 'success', entries });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: getErrorMessage(error, 'Không tải được bảng xếp hạng.') });
      });
    return () => {
      cancelled = true;
    };
  }, [imageId, rows, cols, refreshKey]);

  return (
    <section className="card puzzle-board-rank" aria-label="Bảng xếp hạng ảnh này">
      <h2 className="section-title">
        <Trophy size={16} aria-hidden="true" /> Xếp hạng · {rows}×{cols} ({rows * cols} mảnh)
      </h2>
      {state.status === 'loading' && <p className="muted">Đang tải…</p>}
      {state.status === 'error' && <p className="muted">{state.message}</p>}
      {state.status === 'success' && state.entries.length === 0 && (
        <p className="muted">Chưa có ai hoàn thành ở độ khó này. Hãy là người đầu tiên!</p>
      )}
      {state.status === 'success' && state.entries.length > 0 && (
        <ol className="puzzle-rank-list">
          {state.entries.map((e) => (
            <li key={e.userId} className={e.userId === user?.id ? 'is-me' : undefined}>
              <span className="puzzle-rank-pos">{e.rank}</span>
              <span className="puzzle-rank-name">{e.username}</span>
              <span className="puzzle-rank-time">{formatDuration(e.durationMs, true)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
