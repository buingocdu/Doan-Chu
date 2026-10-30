import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DoorOpen, Plus } from 'lucide-react';
import { createRoom, getErrorMessage, getMyRooms } from '../../../services/api';
import type { GameType, RoomSummary } from '../../../types/api';
import { GAME_TYPE_LABELS } from '../utils/roomState';

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

export default function LobbyPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomSummary[] | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getMyRooms()
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  const handleCreate = async (gameType: GameType) => {
    setCreating(true);
    setError(null);
    try {
      const room = await createRoom(gameType);
      navigate(`/rooms/${room.code}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Không tạo được phòng.'));
      setCreating(false);
    }
  };

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      setError('Mã phòng gồm 6 ký tự chữ và số.');
      return;
    }
    navigate(`/rooms/${code}`);
  };

  return (
    <div className="page lobby">
      <h1>Chơi cùng bạn bè</h1>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="lobby-grid">
        <section className="card lobby-card" aria-labelledby="create-title">
          <h2 id="create-title" className="section-title">
            Tạo phòng mới
          </h2>
          <p className="muted">Tạo phòng rồi gửi mã cho bạn bè. Có chat chung trong phòng.</p>
          <div className="lobby-actions">
            {(Object.keys(GAME_TYPE_LABELS) as GameType[]).map((type) => (
              <button
                key={type}
                type="button"
                className="btn btn-primary"
                disabled={creating}
                onClick={() => void handleCreate(type)}
              >
                <Plus size={18} aria-hidden="true" />
                {GAME_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </section>

        <section className="card lobby-card" aria-labelledby="join-title">
          <h2 id="join-title" className="section-title">
            Vào phòng bằng mã
          </h2>
          <form className="join-form" onSubmit={handleJoin}>
            <input
              className="join-input"
              type="text"
              value={joinCode}
              maxLength={6}
              placeholder="VD: K7QM2X"
              autoComplete="off"
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError(null);
              }}
              aria-label="Mã phòng"
            />
            <button type="submit" className="btn btn-primary">
              <DoorOpen size={18} aria-hidden="true" />
              Vào
            </button>
          </form>
        </section>
      </div>

      <section className="lobby-rooms" aria-labelledby="mine-title">
        <h2 id="mine-title" className="section-title">
          Phòng của tôi
        </h2>
        {rooms === null ? (
          <p className="muted">Đang tải…</p>
        ) : rooms.length === 0 ? (
          <p className="muted">Bạn chưa ở phòng nào.</p>
        ) : (
          <ul className="room-list">
            {rooms.map((r) => (
              <li key={r.code} className="card room-item">
                <Link to={`/rooms/${r.code}`} className="room-item-link">
                  <span className="room-code">{r.code}</span>
                  <span>{GAME_TYPE_LABELS[r.gameType]}</span>
                  <span className="muted">
                    {r.memberCount} người · chủ phòng {r.hostName}
                    {r.status === 'PLAYING' && ' · đang chơi'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
