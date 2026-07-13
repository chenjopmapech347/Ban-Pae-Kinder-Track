import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // แจ้งเตือน app เมื่อ localStorage เต็ม (quota exceeded) แทนที่จะเงียบ
      console.error('[useLocalStorage] บันทึกไม่ได้ — พื้นที่เต็ม:', key, e);
      window.dispatchEvent(new CustomEvent('ls-quota-error', { detail: { key } }));
    }
  }, [key, value]);

  return [value, setValue];
}
