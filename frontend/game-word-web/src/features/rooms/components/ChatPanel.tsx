import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Send } from 'lucide-react';
import { getErrorMessage } from '../../../services/api';
import type { ChatMessage } from '../../../types/api';

interface ChatPanelProps {
  title: string;
  messages: ChatMessage[];
  myId: number;
  onSend: (content: string) => Promise<void>;
  /** Hiển thị riêng cho tin ROOM_INVITE (tin nhắn riêng) */
  renderInvite?: (message: ChatMessage) => ReactNode;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_LENGTH = 500;

function time(epoch: number): string {
  return new Date(epoch).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({
  title,
  messages,
  myId,
  onSend,
  renderInvite,
  disabled = false,
  placeholder = 'Nhập tin nhắn…',
}: ChatPanelProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const stickToBottom = useRef(true);

  // Chỉ tự cuộn xuống khi người dùng đang ở cuối danh sách (không giật khi đang đọc tin cũ)
  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const list = listRef.current;
    if (list) stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(content);
      setText('');
      stickToBottom.current = true;
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi được tin nhắn.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card chat" aria-label={title}>
      <h2 className="chat-title">{title}</h2>
      <ol className="chat-list" ref={listRef} onScroll={onScroll} aria-live="polite">
        {messages.length === 0 && <li className="chat-empty muted">Chưa có tin nhắn.</li>}
        {messages.map((m) => {
          if (m.type === 'SYSTEM') {
            return (
              <li key={m.id} className="chat-system">
                {m.content}
              </li>
            );
          }
          const mine = m.senderId === myId;
          return (
            <li key={m.id} className={`chat-msg${mine ? ' chat-mine' : ''}`}>
              <span className="chat-meta">
                {mine ? 'Bạn' : m.senderName} · {time(m.createdAt)}
              </span>
              <span className="chat-bubble">
                {m.type === 'ROOM_INVITE' && renderInvite ? renderInvite(m) : m.content}
              </span>
            </li>
          );
        })}
      </ol>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          value={text}
          maxLength={MAX_LENGTH}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          aria-label="Tin nhắn"
        />
        <button type="submit" className="btn btn-primary" disabled={disabled || sending || !text.trim()} aria-label="Gửi">
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
