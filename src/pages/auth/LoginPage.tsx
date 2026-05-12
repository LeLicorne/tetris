import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { authService, type UserProfile } from '../../services/authService';
import { setUser, setError, setLoading } from '../../store/slice/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      const user = await authService.login(email, password);

      // Try to fetch profile, but don't fail if it doesn't exist
      let profile: UserProfile | null = null;
      try {
        profile = await authService.getUserProfile(user.uid);
      } catch {
        // Profile might not exist yet - that's OK
      }

      dispatch(
        setUser({
          uid: user.uid,
          email: user.email || email,
          username: profile?.username || email.split('@')[0],
          createdAt: Date.now(),
        })
      );

      navigate({ to: '/' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setLocalError(message);
      dispatch(setError(message));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="app-page" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="app-container" style={{ maxWidth: 520 }}>
        <div className="app-card app-section app-stack">
          <div style={{ textAlign: 'center' }}>
            <p className="app-eyebrow">Account</p>
            <h1 className="app-title" style={{ fontSize: '2.2rem' }}>
              Login
            </h1>
            <p className="app-subtitle" style={{ marginTop: 10 }}>
              Sign in to save your scores automatically.
            </p>
          </div>

          {localError && (
            <div
              className="app-card app-card--soft app-section"
              style={{ borderColor: 'rgba(220,38,38,0.25)' }}
            >
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="app-stack">
            <div className="app-field">
              <label className="app-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="app-input"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="app-field">
              <label className="app-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="app-input"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="app-button app-button--primary"
              style={{ width: '100%' }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p className="app-subtitle" style={{ fontSize: '0.95rem' }}>
              Don&apos;t have an account?{' '}
              <Link to="/auth/register" className="app-label">
                Register here
              </Link>
            </p>
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--app-border)' }}>
            <Link
              to="/"
              className="app-subtitle"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Back to menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
