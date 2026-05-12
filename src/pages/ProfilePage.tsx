import { useEffect, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { authService } from '../services/authService';
import { scoreService, type GameScore } from '../services/scoreService';
import { clearTokens } from '../store/slice/authSlice';

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [userScores, setUserScores] = useState<GameScore[]>([]);
  const [bestScore, setBestScore] = useState<GameScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate({ to: '/auth/login' });
      return;
    }

    const loadUserData = async () => {
      try {
        const scores = await scoreService.getUserScores(user.uid);
        setUserScores(scores);

        if (scores.length > 0) {
          const best = scores[0];
          setBestScore(best);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load scores';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(clearTokens());
      navigate({ to: '/' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="app-page">
      <div className="app-container app-stack">
        <div className="app-actions">
          <Link to="/" className="app-link-button app-link-button--ghost">
            Back to menu
          </Link>
          <Link to="/game" className="app-link-button app-link-button--primary">
            Play Game
          </Link>
          <button onClick={handleLogout} className="app-button app-button--danger">
            Logout
          </button>
        </div>

        <section className="app-card app-section app-stack">
          <div>
            <p className="app-eyebrow">Profile</p>
            <h1 className="app-title" style={{ fontSize: '2.2rem' }}>
              {user.username}
            </h1>
            <p className="app-subtitle" style={{ marginTop: 8 }}>
              {user.email}
            </p>
          </div>
        </section>

        {bestScore && (
          <section className="app-card app-section app-stack">
            <h2 className="app-title" style={{ fontSize: '1.4rem' }}>
              Best Score
            </h2>
            <div className="app-grid-3">
              <div className="app-card app-card--soft app-section">
                <p className="app-label">Score</p>
                <p className="app-title" style={{ fontSize: '2rem' }}>
                  {bestScore.score}
                </p>
              </div>
              <div className="app-card app-card--soft app-section">
                <p className="app-label">Level</p>
                <p className="app-title" style={{ fontSize: '2rem' }}>
                  {bestScore.level || 'N/A'}
                </p>
              </div>
              <div className="app-card app-card--soft app-section">
                <p className="app-label">Lines</p>
                <p className="app-title" style={{ fontSize: '2rem' }}>
                  {bestScore.lines || 'N/A'}
                </p>
              </div>
            </div>
            <p className="app-subtitle">
              Date: {new Date(bestScore.timestamp).toLocaleDateString()}
            </p>
          </section>
        )}

        <section className="app-card app-section app-stack">
          <h2 className="app-title" style={{ fontSize: '1.4rem' }}>
            Game History
          </h2>

          {isLoading ? (
            <p className="app-subtitle">Loading scores...</p>
          ) : error ? (
            <p className="app-subtitle" style={{ color: '#b91c1c' }}>
              {error}
            </p>
          ) : userScores.length === 0 ? (
            <p className="app-subtitle">No scores yet. Play a game to get started!</p>
          ) : (
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Score</th>
                    <th>Level</th>
                    <th>Lines</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userScores.map((score, idx) => (
                    <tr key={score.id}>
                      <td>{idx + 1}</td>
                      <td>{score.score}</td>
                      <td>{score.level || '-'}</td>
                      <td>{score.lines || '-'}</td>
                      <td className="app-muted">
                        {new Date(score.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
