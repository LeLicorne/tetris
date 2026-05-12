import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { authService } from '../../services/authService';
import { setUser, setError, setLoading } from '../../store/slice/authSlice';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      const profile = await authService.register(email, password, username);
      dispatch(setUser(profile));
      dispatch(setError(null));
      navigate({ to: '/' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
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
              Register
            </h1>
            <p className="app-subtitle" style={{ marginTop: 10 }}>
              Create an account to save scores automatically.
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
              <label className="app-label">Username (optional)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="app-input"
                placeholder="Choose a username"
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
              <p className="app-subtitle" style={{ fontSize: '0.85rem' }}>
                Minimum 6 characters
              </p>
            </div>

            <div className="app-field">
              <label className="app-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p className="app-subtitle" style={{ fontSize: '0.95rem' }}>
              Already have an account?{' '}
              <Link to="/auth/login" className="app-label">
                Login here
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
