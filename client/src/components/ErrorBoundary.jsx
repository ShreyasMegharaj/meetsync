import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#111', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#ff4b4b' }}>Something went wrong.</h1>
          <p>The application encountered an unexpected runtime error.</p>
          <pre style={{ background: '#222', padding: '15px', borderRadius: '8px', maxWidth: '80%', overflowX: 'auto', marginTop: '10px' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            style={{ marginTop: '20px', padding: '10px 20px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
