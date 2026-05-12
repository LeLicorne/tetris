import React from 'react';

type State = { hasError: boolean; error: Error | null };

type Props = React.PropsWithChildren;

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for now
    console.error('ErrorBoundary caught error', error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, color: '#fff' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
