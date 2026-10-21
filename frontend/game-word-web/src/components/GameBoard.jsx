import { useState, useEffect, useCallback } from 'react';

const COLORS = {
  GREEN: '#4ade80',
  YELLOW: '#fbbf24',
  BLUE: '#3b82f6',
  BLACK: '#3f4254',
};

export default function GameBoard({ game, onGuess }) {
  const [current, setCurrent] = useState('');
  const [animating, setAnimating] = useState(false);

  const maxLen = game.wordLength;

  const handleKey = (ch) => {
    if (animating || game.gameOver || game.correct) return;
    if (ch === 'BACKSPACE') {
      setCurrent(current.slice(0, -1));
    } else if (ch === 'ENTER') {
      submit();
    } else if (/^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬEÉÈẺẼẸÊẾỀỂỄỆIÍÌỈĨỌỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢUÚÙỦŨỤƯỨỪỬỮỰYÝỲỶỸỴ]$/.test(ch)) {
      if (current.length < maxLen) setCurrent(current + ch);
    }
  };

  const submit = async () => {
    if (current.length !== maxLen) {
      alert('Nhap du ' + maxLen + ' ki tu');
      return;
    }
    setAnimating(true);
    await new Promise((r) => setTimeout(r, 300));
    onGuess(current);
    setCurrent('');
    setAnimating(false);
  };

  return (
    <div className="board-wrap">
      <div className="grid">
        {Array.from({ length: game.maxAttempts }).map((_, row) => (
          <div key={row} className="row">
            {Array.from({ length: maxLen }).map((_, col) => {
              const cell = game.cells.find((c) => c.index === col && game.attempt === row + 1);
              const letter = current[col] || (cell ? cell.letter : '');
              const color = cell ? COLORS[cell.color] : '#1e293b';
              const revealed = cell ? true : row < game.attempt - 1;
              return (
                <div
                  key={col}
                  className={`cell ${revealed ? 'revealed' : ''} ${animating ? 'anim' : ''}`}
                  style={{ backgroundColor: revealed ? color : '#1e293b', borderColor: color }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          className="guess-input"
          value={current}
          onChange={(e) => setCurrent(e.target.value.toUpperCase().slice(0, maxLen))}
          maxLength={maxLen}
          placeholder={`Nhap ${maxLen} ki tu`}
          disabled={game.gameOver || game.correct}
        />
        <button className="btn-submit" onClick={submit} disabled={game.gameOver || game.correct || current.length !== maxLen}>
          Gui
        </button>
      </div>
    </div>
  );
}
