import type { CSSProperties } from 'react';
import type { CellColor } from '../../../types/api';
import { COLOR_LABELS } from '../../game/utils/gameState';

interface MiniBoardProps {
  /** Chỉ có màu, không có chữ: đối thủ không được thấy đáp án */
  rows: CellColor[][];
  wordLength: number;
  maxAttempts: number;
}

export default function MiniBoard({ rows, wordLength, maxAttempts }: MiniBoardProps) {
  return (
    <div className="mini-board" style={{ '--cols': wordLength } as CSSProperties} aria-hidden="true">
      {Array.from({ length: maxAttempts }, (_, r) => (
        <div key={r} className="mini-row">
          {Array.from({ length: wordLength }, (_, c) => {
            const color = rows[r]?.[c];
            return (
              <span
                key={c}
                className={`mini-cell${color ? ` tile-${color.toLowerCase()}` : ''}`}
                title={color ? COLOR_LABELS[color] : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
