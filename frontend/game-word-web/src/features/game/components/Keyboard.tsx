import { Delete, CornerDownLeft } from 'lucide-react';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

interface KeyboardProps {
  disabled: boolean;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
}

export default function Keyboard({ disabled, onLetter, onEnter, onBackspace }: KeyboardProps) {
  return (
    <div className="keyboard" aria-label="Bàn phím">
      {ROWS.map((row, i) => (
        <div className="keyboard-row" key={row}>
          {i === 2 && (
            <button type="button" className="key key-wide" onClick={onEnter} disabled={disabled} aria-label="Gửi lượt đoán">
              <CornerDownLeft size={18} aria-hidden="true" />
              <span>Gửi</span>
            </button>
          )}
          {row.split('').map((letter) => (
            <button type="button" key={letter} className="key" onClick={() => onLetter(letter)} disabled={disabled}>
              {letter}
            </button>
          ))}
          {i === 2 && (
            <button type="button" className="key key-wide" onClick={onBackspace} disabled={disabled} aria-label="Xóa chữ">
              <Delete size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
