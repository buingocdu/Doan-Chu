import type { CSSProperties } from 'react';
import { Lightbulb } from 'lucide-react';
import type { HintLetter } from '../../../types/api';
import { useNow } from '../hooks/useNow';
import { secondsLeft } from '../utils/roomState';

interface HintRowProps {
  hints: HintLetter[];
  nextHintAt: number | null | undefined;
  clockOffset: number;
  wordLength: number;
  partLengths: number[];
  maxAttempts: number;
}

// Dòng gợi ý riêng phía trên bảng đoán: chữ cái đã lộ nằm đúng vị trí, cùng cỡ ô với bảng
export default function HintRow({ hints, nextHintAt, clockOffset, wordLength, partLengths, maxAttempts }: HintRowProps) {
  const now = useNow(500, Boolean(nextHintAt));
  const byIndex = new Map(hints.map((h) => [h.index, h.letter]));
  const style = { '--cols': wordLength, '--rows': maxAttempts, '--parts': partLengths.length } as CSSProperties;
  const groups: number[][] = [];
  let start = 0;
  for (const len of partLengths) {
    groups.push(Array.from({ length: len }, (_, i) => start + i));
    start += len;
  }
  const wait = nextHintAt ? secondsLeft(nextHintAt, clockOffset, now) : null;

  return (
    <section className="hint" aria-label="Gợi ý">
      <p className="hint-head">
        <Lightbulb size={16} aria-hidden="true" />
        <strong>Gợi ý</strong>
        <span className="muted">
          {hints.length === 0 ? 'chưa có chữ nào' : `${hints.length} chữ cái đúng vị trí`}
          {wait !== null ? ` · chữ tiếp theo sau ${wait}s` : hints.length > 0 ? ' · đã hết gợi ý' : ''}
        </span>
      </p>
      <div className="board hint-board" style={style}>
        <div className="board-row">
          {groups.map((cols, g) => (
            <div key={g} className="tile-group">
              {cols.map((col) => {
                const letter = byIndex.get(col);
                return (
                  <div
                    key={col}
                    className={`tile${letter ? ' tile-green hint-tile' : ' hint-empty'}`}
                    aria-label={letter ? `Ô ${col + 1}: ${letter}` : `Ô ${col + 1}: chưa lộ`}
                  >
                    {letter ?? ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
