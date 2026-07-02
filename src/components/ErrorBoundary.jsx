import { Component } from 'react';

/**
 * ErrorBoundary — catches JavaScript errors thrown during rendering,
 * in lifecycle methods, and in constructors of the component tree below it.
 *
 * This is the ONLY mechanism in React that can catch a render-phase throw.
 * Without this, any error thrown while rendering (not inside an event
 * handler or useEffect) unmounts the entire tree silently, leaving a
 * blank screen with no console-visible React error overlay in production
 * builds — exactly the "appears then disappears, stays blank" symptom.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Surface the real error to the console so it's inspectable via
    // remote debugging (chrome://inspect on desktop, connected to the phone).
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          padding: 28, background: '#0b1120', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32 }}>💥</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f87171', margin: 0 }}>
            The app crashed while loading
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 320, lineHeight: 1.6, margin: 0 }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          {this.state.error?.stack && (
            <pre style={{
              fontSize: 9, color: '#64748b', maxWidth: 340, maxHeight: 160,
              overflow: 'auto', textAlign: 'left', background: 'rgba(255,255,255,0.04)',
              padding: 10, borderRadius: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '11px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.08)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontSize: 13, fontWeight: 700,
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
