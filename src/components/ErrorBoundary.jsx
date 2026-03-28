import React from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * 100/100 Quality: System-wide Error Boundary.
 * Catches any React rendering crashes and displays a professional recovery screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("System-level Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0b',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
            Emergency Protocol Interrupted
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '500px', lineHeight: '1.6', marginBottom: '2rem' }}>
            The application encountered an unexpected internal state. Your security and data are still protected.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.8rem 2rem',
              background: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Restart Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
