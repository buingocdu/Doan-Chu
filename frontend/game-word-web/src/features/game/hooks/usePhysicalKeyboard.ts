import { useEffect, useRef } from 'react';

export interface KeyboardHandlers {
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
}

// Nhận phím từ bàn phím thật; bỏ qua khi đang gõ trong ô nhập liệu hoặc có phím bổ trợ
export function usePhysicalKeyboard(handlers: KeyboardHandlers, enabled: boolean) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      // Để nút đang được focus tự xử lý Enter
      if (event.key === 'Enter' && target?.tagName === 'BUTTON') return;

      if (event.key === 'Enter') {
        event.preventDefault();
        ref.current.onEnter();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        ref.current.onBackspace();
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        ref.current.onLetter(event.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
