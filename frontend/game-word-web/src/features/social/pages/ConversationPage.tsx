import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import StatusMessage from '../../../components/common/StatusMessage';
import { useAuth } from '../../../hooks/useAuth';
import { usePolling } from '../../../hooks/usePolling';
import { getConversation, getErrorMessage, getFriends, sendDirectMessage } from '../../../services/api';
import type { ChatMessage } from '../../../types/api';
import ChatPanel from '../../rooms/components/ChatPanel';
import { appendMessages } from '../../rooms/utils/roomState';

const POLL_MS = 2000;

export default function ConversationPage() {
  const { userId: param = '' } = useParams();
  const friendId = Number(param);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [friendName, setFriendName] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef<number | null>(null);

  const fetchNew = useCallback(async () => {
    const next = await getConversation(friendId, lastId.current);
    if (next.length > 0) lastId.current = next[next.length - 1].id;
    setMessages((prev) => appendMessages(prev ?? [], next));
  }, [friendId]);

  useEffect(() => {
    lastId.current = null;
    setMessages(null);
    setError(null);
    fetchNew().catch((err) => setError(getErrorMessage(err, 'Không tải được tin nhắn.')));
    getFriends()
      .then((list) => {
        const friend = list.friends.find((f) => f.userId === friendId);
        setIsFriend(friend !== undefined);
        setFriendName(friend?.username ?? null);
      })
      .catch(() => setIsFriend(false));
  }, [friendId, fetchNew]);

  usePolling(fetchNew, POLL_MS, messages !== null && Number.isFinite(friendId));

  if (!user) return null;
  if (!Number.isFinite(friendId)) return <StatusMessage kind="error">Không tìm thấy hội thoại.</StatusMessage>;
  if (error) return <StatusMessage kind="error">{error}</StatusMessage>;
  if (messages === null) return <StatusMessage kind="loading">Đang tải tin nhắn…</StatusMessage>;

  const send = async (content: string) => {
    await sendDirectMessage(friendId, content);
    await fetchNew();
  };

  return (
    <div className="page conversation">
      <p>
        <Link to="/friends" className="back-link">
          <ArrowLeft size={16} aria-hidden="true" /> Bạn bè
        </Link>
      </p>
      <ChatPanel
        title={friendName ? `Trò chuyện với ${friendName}` : 'Trò chuyện'}
        messages={messages}
        myId={user.id}
        onSend={send}
        disabled={!isFriend}
        placeholder={isFriend ? 'Nhập tin nhắn…' : 'Hai bạn không còn là bạn bè'}
        renderInvite={(m) =>
          m.senderId === user.id ? (
            <>Bạn đã mời vào phòng {m.content}</>
          ) : (
            <span className="invite-msg">
              Mời bạn vào phòng <strong>{m.content}</strong>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/rooms/${m.content}`)}>
                <DoorOpen size={16} aria-hidden="true" />
                Vào phòng
              </button>
            </span>
          )
        }
      />
    </div>
  );
}
