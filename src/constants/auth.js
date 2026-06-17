export const DEFAULT_AUTH_CONFIG = {
  admin:   { pin: 'admin2568', name: 'ผู้ดูแลระบบ' },
  teacher: { pin: 'kru01',    name: 'คุณครูชลดา เมืองใจ', teacherId: 1 },
};

// ── Test accounts (ใช้ทดสอบระบบ — ทำงานได้เสมอ ไม่ขึ้นกับ localStorage) ──
export const TEST_ACCOUNTS = {
  admin:   { username: 'admin',        pin: 'test1234' },
  teacher: { username: 'test_teacher', pin: 'test1234', name: 'ครูทดสอบระบบ', level: 'K1', className: 'อ.1/1', id: 9999 },
  parent:  { studentCode: 'test001',   pin: 'test1234', studentName: 'เด็กทดสอบ', className: 'อ.1/1' },
};
