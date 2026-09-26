/**
 * VersionChecker.jsx
 * ตรวจสอบว่า browser ของครูใช้เวอร์ชั่นล่าสุดหรือไม่
 * - fetch /version.json จาก server (ล่าสุดเสมอ)
 * - เปรียบกับ __APP_VERSION__ ที่ฝังไว้ตอน build
 * - ถ้าไม่ตรง → แสดง banner พร้อมคำแนะนำตามอุปกรณ์
 */

import { useEffect, useState } from 'react';

/* เวอร์ชั่นที่ฝังไว้ตอน build โดย vite.config.js */
const CURRENT_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

/* ตรวจสอบชนิดอุปกรณ์ */
function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  return 'desktop'; // Windows / Linux
}

/* วิธีแก้ cache ตามอุปกรณ์ */
const INSTRUCTIONS = {
  ios: {
    icon: '📱',
    device: 'iPhone / iPad',
    steps: [
      'เปิด "การตั้งค่า" (Settings)',
      'เลื่อนลงหา Safari → กด "ล้างประวัติและข้อมูลเว็บไซต์"',
      'กลับมาเปิดเว็บใหม่อีกครั้ง',
    ],
    alt: 'หรือกดปุ่มรีเฟรช 🔄 ค้างไว้ แล้วเลือก "Reload Without Content Blockers"',
  },
  android: {
    icon: '📱',
    device: 'Android',
    steps: [
      'กดปุ่ม ⋮ (เมนู 3 จุด) มุมบนขวาของ Chrome',
      'เลือก "รีเฟรช" หรือกด Ctrl+Shift+R',
      'ถ้ายังไม่ได้ → ไปที่ การตั้งค่า → ความเป็นส่วนตัว → ล้างข้อมูลการท่องเว็บ',
    ],
    alt: null,
  },
  mac: {
    icon: '💻',
    device: 'Mac',
    steps: [
      'กด Cmd ⌘ + Shift + R (Chrome / Firefox)',
      'หรือ Cmd ⌘ + Option + R (Safari)',
    ],
    alt: 'เพื่อโหลดหน้าใหม่แบบข้าม cache',
  },
  desktop: {
    icon: '🖥️',
    device: 'คอมพิวเตอร์',
    steps: [
      'กด Ctrl + Shift + R (Windows / Linux)',
    ],
    alt: 'เพื่อโหลดหน้าใหม่แบบข้าม cache',
  },
};

export default function VersionChecker() {
  const [outdated, setOutdated]     = useState(false);
  const [serverVer, setServerVer]   = useState('');
  const [dismissed, setDismissed]   = useState(false);
  const [device]                    = useState(detectDevice);

  useEffect(() => {
    // fetch /version.json พร้อม no-cache เพื่อดึงล่าสุดเสมอ
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.version && data.version !== CURRENT_VERSION) {
          setServerVer(data.version);
          setOutdated(true);
        }
      })
      .catch(() => {/* ถ้า fetch ไม่ได้ → ไม่แสดง */});
  }, []);

  if (!outdated || dismissed) return null;

  const info = INSTRUCTIONS[device] ?? INSTRUCTIONS.desktop;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 9999,
      background: '#1e40af',
      color: '#fff',
      fontFamily: 'sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#1d4ed8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            เวอร์ชั่นไม่ตรงกัน — กรุณาโหลดหน้าใหม่
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 99,
            padding: '2px 10px',
            fontSize: 12,
          }}>
            คุณ: v{CURRENT_VERSION} → ล่าสุด: v{serverVer}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          ✕ ปิด
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '10px 16px 12px',
        background: '#1e40af',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>
            {info.icon} วิธีแก้สำหรับ {info.device}
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
            {info.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          {info.alt && (
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>{info.alt}</div>
          )}
        </div>

        <button
          onClick={() => window.location.reload(true)}
          style={{
            background: '#fff',
            color: '#1e40af',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            alignSelf: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          🔄 โหลดใหม่ทันที
        </button>
      </div>
    </div>
  );
}
