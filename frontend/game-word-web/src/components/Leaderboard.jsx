import { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/api';

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((res) => setEntries(res.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-wrap">Dang tai xep hang...</div>;

  return (
    <section className="page-wrap">
      <h2>Xep hang</h2>
      <table className="leaderboard-table">
        <thead>
          <tr><th>Hang</th><th>Tai khoan</th><th>Diem</th><th>Tro choi</th><th>Thang</th></tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.userId}>
              <td>#{e.rank}</td>
              <td>{e.username}</td>
              <td>{e.totalScore}</td>
              <td>{e.gamesPlayed}</td>
              <td>{e.gamesWon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
