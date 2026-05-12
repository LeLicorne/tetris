import { Link } from '@tanstack/react-router';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { authService } from '../services/authService';
import { clearTokens } from '../store/slice/authSlice';

export default function HomePage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(clearTokens());
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="app-page">
      <div className="app-container app-stack">
        <header className="app-card app-section" style={{ textAlign: 'center' }}>
          <p className="app-eyebrow">Arcade</p>
          <h1 className="app-title">Tetris</h1>
          <p className="app-subtitle" style={{ marginTop: 12 }}>
            Jump in, play a round, save a score, or just browse around.
          </p>
        </header>

        {user && (
          <div className="app-card app-section" style={{ textAlign: 'center' }}>
            <p className="app-subtitle">
              Welcome back, <strong>{user.username}</strong>
            </p>
          </div>
        )}

        <div className="app-grid-2">
          <Link
            to="/game"
            className="app-card app-section app-link-button app-link-button--primary"
            style={{
              minHeight: 140,
              justifyContent: 'center',
              textAlign: 'center',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>Play Game</span>
            <span className="app-subtitle" style={{ color: 'rgba(255,255,255,0.86)' }}>
              Start a new game
            </span>
          </Link>
          <Link
            to="/leaderboard"
            className="app-card app-section app-link-button app-link-button--ghost"
            style={{
              minHeight: 140,
              justifyContent: 'center',
              textAlign: 'center',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>Leaderboard</span>
            <span className="app-subtitle">See the top scores</span>
          </Link>
        </div>

        <div className="app-grid-2">
          {user ? (
            <>
              <Link
                to="/profile"
                className="app-card app-section app-link-button app-link-button--ghost"
                style={{
                  minHeight: 140,
                  justifyContent: 'center',
                  textAlign: 'center',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>My Profile</span>
                <span className="app-subtitle">View your stats</span>
              </Link>
              <button
                onClick={handleLogout}
                className="app-card app-section app-button app-button--ghost"
                style={{ minHeight: 140, justifyContent: 'center', flexDirection: 'column' }}
              >
                <span style={{ fontSize: '1.6rem' }}>Logout</span>
                <span className="app-subtitle">Sign out of your account</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="app-card app-section app-link-button app-link-button--ghost"
                style={{
                  minHeight: 140,
                  justifyContent: 'center',
                  textAlign: 'center',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>Login</span>
                <span className="app-subtitle">Sign in to save scores</span>
              </Link>
              <Link
                to="/auth/register"
                className="app-card app-section app-link-button app-link-button--ghost"
                style={{
                  minHeight: 140,
                  justifyContent: 'center',
                  textAlign: 'center',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>Register</span>
                <span className="app-subtitle">Create an account</span>
              </Link>
            </>
          )}
        </div>

        <section className="app-card app-section">
          <p className="app-eyebrow">Quick note</p>
          <p className="app-subtitle">
            {user
              ? 'Your scores save automatically, so you can keep playing and check the leaderboard later.'
              : 'You can play as a guest or sign in if you want your scores tied to an account.'}
          </p>
        </section>
      </div>
    </div>
  );
}
