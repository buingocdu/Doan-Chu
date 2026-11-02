import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HintRow from './HintRow';

describe('HintRow', () => {
  it('đặt chữ gợi ý đúng vị trí, các ô khác để trống', () => {
    render(
      <HintRow
        hints={[
          { index: 2, letter: 'Ô' },
          { index: 6, letter: 'À' },
        ]}
        nextHintAt={Date.now() + 12_000}
        clockOffset={0}
        wordLength={7}
        partLengths={[4, 3]}
        maxAttempts={10}
      />,
    );
    expect(screen.getByLabelText('Ô 3: Ô')).toHaveClass('tile-green');
    expect(screen.getByLabelText('Ô 7: À')).toBeInTheDocument();
    expect(screen.getByLabelText('Ô 1: chưa lộ')).toHaveTextContent('');
    expect(screen.getByText(/2 chữ cái đúng vị trí · chữ tiếp theo sau 12s/)).toBeInTheDocument();
  });

  it('báo đã hết gợi ý khi không còn chữ tiếp theo', () => {
    render(
      <HintRow
        hints={[{ index: 0, letter: 'N' }]}
        nextHintAt={null}
        clockOffset={0}
        wordLength={3}
        partLengths={[3]}
        maxAttempts={10}
      />,
    );
    expect(screen.getByText(/đã hết gợi ý/)).toBeInTheDocument();
  });
});
