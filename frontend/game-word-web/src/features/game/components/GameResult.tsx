import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PartyPopper, RotateCcw } from 'lucide-react';

interface GameResultProps {
  won: boolean;
  attempts: number;
  score: number | null;
  answer: string | null;
  loggedIn: boolean;
  onNext: () => void;
}

export default function GameResult({ won, attempts, score, answer, loggedIn, onNext }: GameResultProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => buttonRef.current?.focus(), []);

  return (
    <section className={`result ${won ? 'result-won' : 'result-lost'}`} aria-live="polite">
      {won ? (
        <>
          <h2>
            <PartyPopper size={22} aria-hidden="true" /> Chính xác!
          </h2>
          <p>
            Bạn đoán đúng <strong>{answer}</strong> sau {attempts} lượt.
            {score !== null && (loggedIn ? <> Được cộng <strong>{score}</strong> điểm.</> : <> Ván này đáng giá {score} điểm.</>)}
          </p>
        </>
      ) : (
        <>
          <h2>Hết lượt đoán</h2>
          <p>
            Từ đúng là <strong>{answer ?? '—'}</strong>.
          </p>
        </>
      )}
      {!loggedIn && (
        <p className="muted">
          <Link to="/login">Đăng nhập</Link> để lưu điểm và lên bảng xếp hạng.
        </p>
      )}
      <button ref={buttonRef} type="button" className="btn btn-primary" onClick={onNext}>
        <RotateCcw size={18} aria-hidden="true" /> {won ? 'Màn tiếp theo' : 'Chơi ván mới'}
      </button>
    </section>
  );
}
