// ErrorBoundary.jsx — catches render errors so they don't blank the whole page
import { Component } from 'react';

/** ตรวจว่า error เกิดจาก chunk เก่าหายหลัง deploy ใหม่ */
function isChunkLoadError(error) {
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('is not a valid JavaScript MIME type') ||
    msg.includes('ChunkLoadError') ||
    error.name === 'ChunkLoadError'
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunk: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, isChunk: isChunkLoadError(error) };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
    // Auto-reload เมื่อเป็น chunk error (อัปเดตแอปใหม่)
    if (isChunkLoadError(error)) {
      // รอ 1 วินาทีให้ user เห็นข้อความก่อน reload
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunk) {
        // Chunk load error — แสดง "กำลังอัปเดต..." และ reload อัตโนมัติ
        return (
          <div style={{
            margin: '1.5rem auto', maxWidth: '520px', padding: '1.5rem',
            background: '#eff6ff', border: '2px solid #93c5fd',
            borderRadius: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🔄</div>
            <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '.95rem', marginBottom: '.5rem' }}>
              แอปมีการอัปเดตเวอร์ชันใหม่
            </div>
            <div style={{ fontSize: '.82rem', color: '#1e40af', marginBottom: '1rem' }}>
              กำลังโหลดเวอร์ชันล่าสุด…
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '.4rem 1.2rem', borderRadius: '8px', border: 'none',
                background: '#1d4ed8', color: 'white', fontWeight: 700,
                cursor: 'pointer', fontSize: '.82rem',
              }}
            >
              โหลดใหม่ทันที
            </button>
          </div>
        );
      }

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
            onClick={() => this.setState({ hasError: false, error: null, isChunk: false })}
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
