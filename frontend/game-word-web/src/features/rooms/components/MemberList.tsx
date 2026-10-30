import { useState } from 'react';
import { Crown, UserPlus } from 'lucide-react';
import { getErrorMessage, getFriends, inviteToRoom } from '../../../services/api';
import type { Friend, RoomMember } from '../../../types/api';

interface MemberListProps {
  code: string;
  members: RoomMember[];
  myId: number;
  maxMembers?: number;
}

export default function MemberList({ code, members, myId, maxMembers = 8 }: MemberListProps) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invited, setInvited] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const openInvite = async () => {
    setInviteOpen((open) => !open);
    setError(null);
    if (friends === null) {
      try {
        setFriends((await getFriends()).friends);
      } catch (err) {
        setError(getErrorMessage(err, 'Không tải được danh sách bạn bè.'));
      }
    }
  };

  const invite = async (friendId: number) => {
    setError(null);
    try {
      await inviteToRoom(code, friendId);
      setInvited((s) => new Set(s).add(friendId));
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi được lời mời.'));
    }
  };

  const memberIds = new Set(members.map((m) => m.userId));
  const candidates = (friends ?? []).filter((f) => !memberIds.has(f.userId));

  return (
    <section className="card members" aria-label="Thành viên">
      <div className="members-head">
        <h2 className="section-title">
          Thành viên ({members.length}/{maxMembers})
        </h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void openInvite()} aria-expanded={inviteOpen}>
          <UserPlus size={16} aria-hidden="true" />
          Mời bạn
        </button>
      </div>
      <ul className="member-list">
        {members.map((m) => (
          <li key={m.userId} className="member">
            {m.host && <Crown size={14} aria-label="Chủ phòng" className="member-host" />}
            {m.username}
            {m.userId === myId && <span className="muted"> (bạn)</span>}
          </li>
        ))}
      </ul>
      {inviteOpen && (
        <div className="invite-box">
          {friends === null && !error && <p className="muted">Đang tải…</p>}
          {friends !== null && candidates.length === 0 && (
            <p className="muted">Không còn bạn nào để mời. Kết bạn ở trang Bạn bè.</p>
          )}
          <ul className="invite-list">
            {candidates.map((f) => (
              <li key={f.userId}>
                <span>{f.username}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={invited.has(f.userId)}
                  onClick={() => void invite(f.userId)}
                >
                  {invited.has(f.userId) ? 'Đã mời' : 'Mời'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
