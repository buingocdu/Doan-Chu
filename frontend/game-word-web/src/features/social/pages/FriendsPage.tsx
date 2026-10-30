import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle, UserPlus, UserX, X } from 'lucide-react';
import StatusMessage from '../../../components/common/StatusMessage';
import { usePolling } from '../../../hooks/usePolling';
import {
  acceptFriendRequest,
  getErrorMessage,
  getFriends,
  removeFriendRequest,
  searchUsers,
  sendFriendRequest,
  unfriend,
} from '../../../services/api';
import type { FriendList, UserSearchResult } from '../../../types/api';

const SEARCH_DELAY_MS = 300;
const REFRESH_MS = 10_000;

const RELATION_LABELS: Record<string, string> = {
  FRIEND: 'Bạn bè',
  OUTGOING: 'Đã gửi lời mời',
  INCOMING: 'Đang mời bạn',
};

export default function FriendsPage() {
  const [list, setList] = useState<FriendList | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await getFriends());
      setLoadError(null);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Không tải được danh sách bạn bè.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  usePolling(load, REFRESH_MS);

  // Tìm kiếm có trễ để không gọi API mỗi lần gõ phím
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchUsers(q)
        .then((r) => {
          if (!cancelled) setResults(r);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await load();
      if (query.trim().length >= 2) setResults(await searchUsers(query.trim()));
    } catch (err) {
      setError(getErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  if (!list && loadError) return <StatusMessage kind="error" onRetry={() => void load()}>{loadError}</StatusMessage>;
  if (!list) return <StatusMessage kind="loading">Đang tải…</StatusMessage>;

  return (
    <div className="page friends">
      <h1>Bạn bè</h1>
      {message && (
        <p className="alert alert-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <section className="card friends-section" aria-labelledby="search-title">
        <h2 id="search-title" className="section-title">
          Tìm bạn
        </h2>
        <input
          className="search-input"
          type="search"
          value={query}
          placeholder="Nhập tên tài khoản (ít nhất 2 ký tự)"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Tìm theo tên tài khoản"
        />
        {results.length > 0 && (
          <ul className="people-list">
            {results.map((u) => (
              <li key={u.userId} className="person">
                <span>{u.username}</span>
                {u.relation === 'NONE' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => void run(() => sendFriendRequest(u.username), `Đã gửi lời mời tới ${u.username}.`)}
                  >
                    <UserPlus size={16} aria-hidden="true" />
                    Kết bạn
                  </button>
                ) : u.relation === 'INCOMING' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => void run(() => acceptFriendRequest(u.userId), `Đã kết bạn với ${u.username}.`)}
                  >
                    <Check size={16} aria-hidden="true" />
                    Chấp nhận
                  </button>
                ) : (
                  <span className="muted">{RELATION_LABELS[u.relation]}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {list.incoming.length > 0 && (
        <section className="card friends-section" aria-labelledby="incoming-title">
          <h2 id="incoming-title" className="section-title">
            Lời mời kết bạn ({list.incoming.length})
          </h2>
          <ul className="people-list">
            {list.incoming.map((f) => (
              <li key={f.userId} className="person">
                <span>{f.username}</span>
                <span className="person-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => void run(() => acceptFriendRequest(f.userId), `Đã kết bạn với ${f.username}.`)}
                  >
                    <Check size={16} aria-hidden="true" />
                    Chấp nhận
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void run(() => removeFriendRequest(f.userId), 'Đã từ chối lời mời.')}
                  >
                    <X size={16} aria-hidden="true" />
                    Từ chối
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card friends-section" aria-labelledby="friends-title">
        <h2 id="friends-title" className="section-title">
          Danh sách bạn ({list.friends.length})
        </h2>
        {list.friends.length === 0 ? (
          <p className="muted">Chưa có bạn bè. Tìm theo tên tài khoản ở trên để kết bạn.</p>
        ) : (
          <ul className="people-list">
            {list.friends.map((f) => (
              <li key={f.userId} className="person">
                <span>
                  {f.username}
                  {f.unread > 0 && (
                    <span className="badge" aria-label={`${f.unread} tin chưa đọc`}>
                      {f.unread}
                    </span>
                  )}
                </span>
                <span className="person-actions">
                  <Link to={`/messages/${f.userId}`} className="btn btn-primary btn-sm">
                    <MessageCircle size={16} aria-hidden="true" />
                    Nhắn tin
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label={`Hủy kết bạn với ${f.username}`}
                    onClick={() => {
                      if (window.confirm(`Hủy kết bạn với ${f.username}?`)) {
                        void run(() => unfriend(f.userId), `Đã hủy kết bạn với ${f.username}.`);
                      }
                    }}
                  >
                    <UserX size={16} aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {list.outgoing.length > 0 && (
        <section className="card friends-section" aria-labelledby="outgoing-title">
          <h2 id="outgoing-title" className="section-title">
            Lời mời đã gửi
          </h2>
          <ul className="people-list">
            {list.outgoing.map((f) => (
              <li key={f.userId} className="person">
                <span>{f.username}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void run(() => removeFriendRequest(f.userId), 'Đã hủy lời mời.')}
                >
                  Hủy lời mời
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
