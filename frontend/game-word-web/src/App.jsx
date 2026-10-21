import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { getRandomWord, startGame, makeGuess, getLeaderboard, getHistory } from './services/api';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import Leaderboard from './components/Leaderboard';
import GameBoard from './components/GameBoard';
import './App.css';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <Header user={user} onLogout={logout} />
      <main className="page">
        <Routes>
          <Route path="/" element={<GameBoardPage />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

function GameBoardPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [game, setGame] = useState(null);
  const [excludedIds, setExcludedIds] = useState([]);
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState(1);

  const startNewGame = useCallback(async () => {
    try {
      const res = await startGame(user?.id, excludedIds);
      setGame(res.data);
      setMessage(res.data.message);
    } catch (e) {
      setMessage('Khong the bat dau tro choi');
    }
  }, [user?.id, excludedIds]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleGuess = async (guessWord) => {
    if (!game || game.gameOver || game.correct) return;
    try {
      const res = await makeGuess({
        wordId: game.wordId,
        guess: guessWord,
        userId: user?.id || null,
      });
      const data = res.data;
      setGame(data);
      setMessage(data.message);
      if (data.correct) {
        setExcludedIds([...excludedIds, game.wordId]);
        setLevel((l) => l + 1);
      }
    } catch (e) {
      setMessage('Co loi xay ra khi doan');
    }
  };

  return (
    <section className="game-page">
      <div className="game-card">
        <h1>Game Do An Chu</h1>
        {user ? (
          <div className="user-info">Xin chao, {user.username} | Cap: {level}</div>
        ) : (
          <div className="guest-hint">Dang nhap de luu lich su va xep hang</div>
        )}
        <div className="status">{message}</div>
        {game && (
          <GameBoard game={game} onGuess={handleGuess} />
        )}
        {game && game.gameOver && game.correct && (
          <button className="btn-next" onClick={startNewGame}>Man tiep theo</button>
        )}
        {!user && (
          <div className="login-prompt">
            <a href="/login">Dang nhap</a> de luu ket qua va xem xep hang
          </div>
        )}
      </div>
    </section>
  );
}

function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getHistory(user.id)
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="page-wrap">Dang tai...</div>;
  if (!user) return <div className="page-wrap">Vui long dang nhap</div>;

  return (
    <section className="page-wrap">
      <h2>Lich su choi</h2>
      <table className="history-table">
        <thead>
          <tr><th>Tu</th><th>Doan</th><th>Lan thu</th><th>Ket qua</th><th>Thoi gian</th></tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id}>
              <td>{h.wordId}</td>
              <td>{h.guess}</td>
              <td>{h.attempt}</td>
              <td>{h.correct ? 'Dung' : 'Sai'}</td>
              <td>{h.playedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
