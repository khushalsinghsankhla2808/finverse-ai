import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

/**
 * Global Error Boundary
 *
 * Catches unhandled React rendering errors and displays a user-friendly
 * fallback UI. For 500 errors, displays the errorId so users can
 * reference it when contacting support.
 *
 * This boundary does NOT catch:
 * - Event handler errors (use try/catch)
 * - Async errors (use .catch() or error state)
 * - Server-side rendering errors
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, errorId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }

    // Extract errorId from API error responses if available
    const axiosError = error as any;
    const errorId = axiosError?.response?.data?.errorId || null;
    this.setState({ errorId });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0F0A1C',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '2rem',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: '480px',
              padding: '3rem 2rem',
              borderRadius: '1rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1
              style={{
                color: '#FFFFFF',
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              An unexpected error occurred. Please try refreshing the page.
              If the problem persists, contact support.
            </p>

            {this.state.errorId && (
              <p
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.8rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  wordBreak: 'break-all',
                }}
              >
                Error Reference: {this.state.errorId}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#7C3AED',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
