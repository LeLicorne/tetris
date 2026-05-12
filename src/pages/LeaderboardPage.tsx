import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAppSelector } from '../hooks/useAppSelector';
import { scoreService, type GameScore } from '../services/scoreService';

export default function LeaderboardPage() {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const loadScores = async () => {
      try {
        const topScores = await scoreService.getTopScores(50);
        setScores(topScores);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadScores();
  }, []);

  const userRank = user ? scores.findIndex((s) => s.userId === user.uid) + 1 : -1;
  const userBestScore = user ? scores.find((s) => s.userId === user.uid) : null;

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
          {user && (
            <Link to="/profile" className="app-link-button app-link-button--ghost">
              My Profile
            </Link>
          )}
        </div>

        <section className="app-card app-section app-stack">
          <div>
            <p className="app-eyebrow">Scores</p>
            <h1 className="app-title" style={{ fontSize: '2.2rem' }}>
              Leaderboard
            </h1>
            <p className="app-subtitle" style={{ marginTop: 8 }}>
              Global top scores
            </p>
          </div>

          {/* User Rank Card (if authenticated) */}
        </section>
        {user && userBestScore && (
          <div className="app-card app-card--soft app-section">
            <div className="app-grid-2">
              <div>
                <p className="app-label">Your Best Rank</p>
                <p className="app-title" style={{ fontSize: '2.4rem' }}>
                  #{userRank}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="app-label">Your Best Score</p>
                <p className="app-title" style={{ fontSize: '2.4rem' }}>
                  {userBestScore.score}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="app-card app-section app-stack">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p className="app-subtitle">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p className="app-subtitle" style={{ color: '#b91c1c' }}>
                {error}
              </p>
            </div>
          ) : scores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p className="app-subtitle">No scores yet. Be the first to play!</p>
            </div>
          ) : (
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Rank</th>
                    <th>Player</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                    <th style={{ textAlign: 'right' }}>Level</th>
                    <th style={{ textAlign: 'right' }}>Lines</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score, idx) => {
                    const isCurrentUser = user && score.userId === user.uid;

                    return (
                      <tr
                        key={score.id}
                        style={isCurrentUser ? { background: '#eff6ff' } : undefined}
                      >
                        <td>
                          <span className="app-label">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                        </td>
                        <td>
                          {score.username}
                          {isCurrentUser && (
                            <span className="app-chip" style={{ marginLeft: 8 }}>
                              (You)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="app-label">{score.score}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{score.level || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{score.lines || '-'}</td>
                        <td className="app-muted">
                          {new Date(score.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
