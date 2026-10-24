import type { CSSProperties } from 'react';
import type { CellResult } from '../../../types/api';
import { COLOR_LABELS } from '../utils/gameState';

interface GameBoardProps {
  rows: CellResult[][];
  /** Chữ hiển thị của hàng đang nhập */
  current: string[];
  wordLength: number;
  partLengths: number[];
  maxAttempts: number;
  shake: boolean;
}

// Chỉ số ô của từng tiếng: [3, 4] -> [[0,1,2], [3,4,5,6]]
function groupColumns(partLengths: number[]): number[][] {
  let start = 0;
  return partLengths.map((len) => {
    const cols = Array.from({ length: len }, (_, i) => start + i);
    start += len;
    return cols;
  });
}

export default function GameBoard({ rows, current, wordLength, partLengths, maxAttempts, shake }: GameBoardProps) {
  const groups = groupColumns(partLengths);
  const style = { '--cols': wordLength, '--rows': maxAttempts, '--parts': partLengths.length } as CSSProperties;

  const renderTile = (rowIndex: number, col: number) => {
    const submitted = rows[rowIndex];
    if (submitted) {
      const cell = submitted[col];
      const letter = cell.letter;
      return (
        <div
          key={col}
          role="gridcell"
          className={`tile tile-${cell.color.toLowerCase()} revealed`}
          style={{ animationDelay: `${col * 60}ms` }}
          aria-label={`${letter}: ${COLOR_LABELS[cell.color]}`}
        >
          {letter}
        </div>
      );
    }
    const letter = rowIndex === rows.length ? current[col] ?? '' : '';
    return (
      <div key={col} role="gridcell" className={`tile${letter ? ' filled' : ''}`} aria-label={letter || 'trống'}>
        {letter}
      </div>
    );
  };

  return (
    <div
      className="board"
      style={style}
      role="grid"
      aria-label={`Bảng đoán ${maxAttempts} lượt, từ gồm ${partLengths.length} tiếng: ${partLengths.join(' + ')} chữ cái`}
    >
      {Array.from({ length: maxAttempts }, (_, rowIndex) => (
        <div
          key={rowIndex}
          role="row"
          className={`board-row${rowIndex === rows.length && shake ? ' shake' : ''}`}
          aria-label={`Lượt ${rowIndex + 1}`}
        >
          {groups.map((cols, g) => (
            <div key={g} className="tile-group">
              {cols.map((col) => renderTile(rowIndex, col))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
