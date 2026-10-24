import { useEffect, useRef, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { countLetters } from '../utils/gameState';

interface GuessInputProps {
  gameId: number | null;
  /** Chuỗi gõ nguyên bản (có thể có dấu, khoảng trắng) */
  input: string;
  wordLength: number;
  partLengths: number[];
  /** Đang chấm: chỉ đọc nhưng giữ focus để gõ tiếp ngay sau đó */
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

// Ô nhập như text thường. Giá trị KHÔNG bị sửa khi đang gõ (không bỏ dấu, không cắt chữ) vì bộ gõ
// Unikey/EVKey/Telex xóa rồi gõ đè dựa trên nội dung ô; sửa nội dung sẽ làm nhảy chữ.
export default function GuessInput({ gameId, input, wordLength, partLengths, busy, onChange, onSubmit }: GuessInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = countLetters(input);
  const extra = total - wordLength;

  // Tự focus khi bắt đầu ván mới
  useEffect(() => {
    if (gameId !== null) inputRef.current?.focus();
  }, [gameId]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!busy) onSubmit();
  };

  let hint = `${total}/${wordLength} chữ cái · nhớ gõ đúng dấu tiếng Việt`;
  let hintClass = 'guess-hint';
  if (extra > 0) {
    hint = `Thừa ${extra} chữ cái — hãy xóa bớt`;
    hintClass += ' guess-hint-over';
  } else if (extra === 0) {
    hintClass += ' guess-hint-full';
  }

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <label htmlFor="guess-input" className="guess-label">
        Nhập từ đoán ({partLengths.join(' + ')} chữ cái)
      </label>
      <div className="guess-row">
        <input
          ref={inputRef}
          id="guess-input"
          className="guess-input"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Gõ từ đoán, ví dụ: vui mừng"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          readOnly={busy}
          aria-invalid={extra > 0 ? true : undefined}
          aria-describedby="guess-hint"
        />
        {/* Không disable khi thiếu/thừa chữ: Enter vẫn phải gửi form để hiện cảnh báo */}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          <Send size={18} aria-hidden="true" />
          <span>Gửi</span>
        </button>
      </div>
      <p id="guess-hint" className={hintClass}>
        {hint}
      </p>
    </form>
  );
}
