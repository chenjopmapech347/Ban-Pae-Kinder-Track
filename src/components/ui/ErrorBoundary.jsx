// ErrorBoundary.jsx — catches render errors so they don't blank the whole page
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.props.fallbackMessage ?? 'เกิดข้อผิดพลาดในการโหลดหน้านี้';
      return (
        <div style={{
          margin: '1.5rem auto', maxWidth: '520px', padding: '1.5rem',
          background: '#fff1f2', border: '2px solid #fda4af',
          borderRadius: '16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>⚠️</div>
          <div style={{ fontWeight: 700, color: '#be123c', fontSize: '.95rem', marginBottom: '.5rem' }}>
            {msg}
          </div>
          <div style={{ fontSize: '.78rem', color: '#9f1239', marginBottom: '1rem', wordBreak: 'break-word' }}>
            {this.state.error?.message}
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '.4rem 1.2rem', borderRadius: '8px', border: 'none',
              background: '#be123c', color: 'white', fontWeight: 700,
              cursor: 'pointer', fontSize: '.82rem',
            }}
          >
            ลองใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
