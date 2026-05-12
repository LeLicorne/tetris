import { useState } from 'react';

interface GuestScoreSaveDialogProps {
  score: number;
  onSave: (username: string) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
}

export default function GuestScoreSaveDialog({
  score,
  onSave,
  onSkip,
  isLoading = false,
}: GuestScoreSaveDialogProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(username.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save score';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0" style={{ background: 'rgba(15, 23, 42, 0.45)' }}>
      <div
        className="app-card app-section app-stack"
        style={{ maxWidth: 520, width: 'calc(100% - 32px)', margin: '10svh auto 0' }}
      >
        <div>
          <p className="app-eyebrow">Save score</p>
          <h2 className="app-title" style={{ fontSize: '1.8rem' }}>
            Save Your Score
          </h2>
          <p className="app-subtitle" style={{ marginTop: 8 }}>
            Enter your name to save this score to the leaderboard.
          </p>
        </div>

        <div className="app-card app-card--soft app-section">
          <p className="app-label">Your Score</p>
          <p className="app-title" style={{ fontSize: '2.4rem' }}>
            {score}
          </p>
        </div>

        {error && (
          <div
            className="app-card app-card--soft app-section"
            style={{ borderColor: 'rgba(220,38,38,0.25)' }}
          >
            {error}
          </div>
        )}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Enter your name..."
          className="app-input"
          disabled={isSubmitting || isLoading}
          maxLength={30}
          autoFocus
        />

        <div className="app-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            onClick={onSkip}
            disabled={isSubmitting || isLoading}
            className="app-button app-button--ghost"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || isLoading || !username.trim()}
            className="app-button app-button--primary"
          >
            {isSubmitting ? 'Saving...' : 'Save Score'}
          </button>
        </div>
      </div>
    </div>
  );
}
