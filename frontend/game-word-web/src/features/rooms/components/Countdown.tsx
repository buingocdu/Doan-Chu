import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { secondsLeft } from '../utils/roomState';

interface CountdownProps {
  /** Hạn chót theo giờ server (epoch ms) */
  deadline: number | null | undefined;
  clockOffset: number;
  /** Đổi màu cảnh báo khi còn ít hơn số giây này */
  warnAt?: number;
}

function format(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function Countdown({ deadline, clockOffset, warnAt = 5 }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const left = secondsLeft(deadline, clockOffset, now);
  return (
    <span className={`countdown${left <= warnAt ? ' countdown-warn' : ''}`} role="timer" aria-live="off">
      <Clock size={16} aria-hidden="true" />
      {format(left)}
    </span>
  );
}
