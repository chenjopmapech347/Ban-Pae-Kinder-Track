import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, clearAllStorage } from '../constants/storageKeys';
import { DEFAULT_AUTH_CONFIG } from '../constants/auth';
import {
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_SCHOOLS,
  INITIAL_CLASSES,
  INITIAL_HOLIDAYS,
  DEFAULT_ASSESSMENT_TOPICS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_ACADEMIC_YEARS,
} from '../data/initialData';
import { INITIAL_INDICATORS, INITIAL_ACTIVITIES } from '../data/flatIndicators';
import { mergeDayRecords, recomputeAttendanceFromDailyRecords } from '../utils/attendance';
import { buildAppSnapshot, validateSnapshot } from '../utils/appSnapshot';
import { pullSnapshotFromCloud, pushSnapshotToCloud } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { isFirebaseConfigured } from '../lib/firebase';
import { pushSnapshotToFirebase, pullSnapshotFromFirebase } from '../lib/firebaseSync';
import { firebaseLogin, firebaseLogout, onFirebaseAuthChange } from '../lib/firebaseAuth';
import {
  readWorkbookFromFile,
  parseStudentAssessmentWorkbook,
  parseQaStandardWorkbook,
  mergeImportedStudents,
} from '../utils/importExcel2568';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // ฟัง Firebase Auth state
  useEffect(() => {
    return onFirebaseAuthChange(fbUser => setFirebaseUser(fbUser));
  }, []);

  const [students, setStudents] = useLocalStorage(STORAGE_KEYS.students, INITIAL_STUDENTS);
  const [teachers, setTeachers] = useLocalStorage(STORAGE_KEYS.teachers, INITIAL_TEACHERS);
  const [classes, setClasses] = useLocalStorage(STORAGE_KEYS.classes, INITIAL_CLASSES);
  const [schools, setSchools] = useLocalStorage(STORAGE_KEYS.schools, INITIAL_SCHOOLS);
  const [holidays, setHolidays] = useLocalStorage(STORAGE_KEYS.holidays, INITIAL_HOLIDAYS);
  const [authConfig, setAuthConfig] = useLocalStorage(STORAGE_KEYS.authConfig, DEFAULT_AUTH_CONFIG);
  const [assessmentTopics, setAssessmentTopics] = useLocalStorage(
    STORAGE_KEYS.assessmentTopics,
    DEFAULT_ASSESSMENT_TOPICS,
  );
  const [announcements, setAnnouncements] = useLocalStorage(
    STORAGE_KEYS.announcements,
    DEFAULT_ANNOUNCEMENTS,
  );
  const [academicYears, setAcademicYears] = useLocalStorage(
    STORAGE_KEYS.academicYears,
    DEFAULT_ACADEMIC_YEARS,
  );
  const [schoolName, setSchoolName] = useLocalStorage(
    STORAGE_KEYS.schoolName,
    INITIAL_SCHOOLS[0].name,
  );
  const [academicYear, setAcademicYear] = useLocalStorage(STORAGE_KEYS.academicYear, '2569');
  const [dailyRecords, setDailyRecords] = useLocalStorage(STORAGE_KEYS.dailyRecords, {});
  const [qaData, setQaData] = useLocalStorage(STORAGE_KEYS.qaData, null);
  const [indicators, setIndicators] = useLocalStorage(STORAGE_KEYS.indicators, INITIAL_INDICATORS);
  const [activities, setActivities] = useLocalStorage(STORAGE_KEYS.activities, INITIAL_ACTIVITIES);
  const [schoolTerms, setSchoolTerms] = useLocalStorage(STORAGE_KEYS.schoolTerms, {});
  const [aiApiKey, setAiApiKey] = useLocalStorage('kindertrack_ai_api_key', '');
  const [activityLogs, setActivityLogs] = useLocalStorage(STORAGE_KEYS.activityLogs, []);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [evaluatingStudent, setEvaluatingStudent] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getSnapshotData = useCallback(
    () => ({
      students,
      teachers,
      classes,
      schools,
      holidays,
      authConfig,
      assessmentTopics,
      announcements,
      academicYears,
      schoolName,
      academicYear,
      dailyRecords,
      qaData,
      indicators,
      activities,
      activityLogs,
    }),
    [
      students,
      teachers,
      classes,
      schools,
      holidays,
      authConfig,
      assessmentTopics,
      announcements,
      academicYears,
      schoolName,
      academicYear,
      dailyRecords,
      qaData,
      indicators,
      activities,
      activityLogs,
    ],
  );

  const restoreSnapshotData = useCallback((payload) => {
    if (payload.students) setStudents(payload.students);
    if (payload.teachers) setTeachers(payload.teachers);
    if (payload.classes) setClasses(payload.classes);
    if (payload.schools) setSchools(payload.schools);
    if (payload.holidays) setHolidays(payload.holidays);
    if (payload.authConfig) setAuthConfig(payload.authConfig);
    if (payload.assessmentTopics) setAssessmentTopics(payload.assessmentTopics);
    if (payload.announcements) setAnnouncements(payload.announcements);
    if (payload.academicYears) setAcademicYears(payload.academicYears);
    if (payload.schoolName) setSchoolName(payload.schoolName);
    if (payload.academicYear) setAcademicYear(payload.academicYear);
    if (payload.dailyRecords) setDailyRecords(payload.dailyRecords);
    if (payload.qaData) setQaData(payload.qaData);
    if (payload.indicators) setIndicators(payload.indicators);
    if (payload.activities) setActivities(payload.activities);
    if (payload.activityLogs) setActivityLogs(payload.activityLogs);
  }, [
    setStudents,
    setTeachers,
    setClasses,
    setSchools,
    setHolidays,
    setAuthConfig,
    setAssessmentTopics,
    setAnnouncements,
    setAcademicYears,
    setSchoolName,
    setAcademicYear,
    setDailyRecords,
    setQaData,
    setIndicators,
    setActivities,
    setActivityLogs,
  ]);

  const importStudentAssessmentExcel = useCallback(
    async (file, { replace = false } = {}) => {
      try {
        const wb = await readWorkbookFromFile(file);
        const parsed = parseStudentAssessmentWorkbook(wb);
        if (!parsed.ok) return parsed;

        const merged = mergeImportedStudents(students, parsed.students, { replace });
        setStudents(merged);
        if (parsed.topics?.length) setAssessmentTopics(parsed.topics);

        if (parsed.meta?.sheet) {
          setAnnouncements((prev) => [
            {
              id: Date.now(),
              date: new Date().toLocaleDateString('th-TH'),
              title: `นำเข้าประเมิน ${parsed.meta.count} คน จาก ${file.name}`,
            },
            ...prev,
          ]);
        }

        return {
          ok: true,
          message: `นำเข้านักเรียน ${parsed.meta.count} คน · หัวข้อประเมิน ${parsed.topics.length} รายการ`,
        };
      } catch {
        return { ok: false, message: 'อ่านไฟล์ Excel ไม่สำเร็จ' };
      }
    },
    [students, setStudents, setAssessmentTopics, setAnnouncements],
  );

  const importQaStandardExcel = useCallback(
    async (file) => {
      try {
        const wb = await readWorkbookFromFile(file);
        const parsed = parseQaStandardWorkbook(wb);
        if (!parsed.ok) return parsed;

        setQaData(parsed.qaData);
        const school = parsed.qaData.schoolSummary?.['โรงเรียน'];
        if (school) setSchoolName(String(school));

        return {
          ok: true,
          message: `นำเข้ามาตรฐาน QA แล้ว (ม.1–2: ${parsed.qaData.indicators12.length} ตัวบ่งชี้, ม.3ข: ${parsed.qaData.indicators3.length} ตัวบ่งชี้)`,
        };
      } catch {
        return { ok: false, message: 'อ่านไฟล์มาตรฐานไม่สำเร็จ' };
      }
    },
    [setQaData, setSchoolName],
  );

  const exportBackupJson = useCallback(() => {
    const snapshot = buildAppSnapshot(getSnapshotData());
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KinderTrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getSnapshotData]);

  const importBackupJson = useCallback(
    (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const raw = JSON.parse(reader.result);
            const check = validateSnapshot(raw);
            if (!check.ok) {
              resolve(check);
              return;
            }
            restoreSnapshotData(check.snapshot);
            resolve({ ok: true });
          } catch {
            resolve({ ok: false, message: 'อ่านไฟล์ JSON ไม่สำเร็จ' });
          }
        };
        reader.onerror = () => resolve({ ok: false, message: 'เปิดไฟล์ไม่สำเร็จ' });
        reader.readAsText(file);
      }),
    [restoreSnapshotData],
  );

  const syncPushToCloud = useCallback(async () => {
    const payload = buildAppSnapshot(getSnapshotData());
    return pushSnapshotToCloud(payload);
  }, [getSnapshotData]);

  const syncPullFromCloud = useCallback(async () => {
    const result = await pullSnapshotFromCloud();
    if (!result.ok) return result;
    const check = validateSnapshot(result.payload);
    if (!check.ok) return check;
    restoreSnapshotData(check.snapshot);
    return { ok: true, updatedAt: result.updatedAt };
  }, [restoreSnapshotData]);

  // ─── Firebase Sync ──────────────────────────────────────
  const syncPushToFirebase = useCallback(async () => {
    const payload = buildAppSnapshot(getSnapshotData());
    return pushSnapshotToFirebase(payload);
  }, [getSnapshotData]);

  const syncPullFromFirebase = useCallback(async () => {
    const result = await pullSnapshotFromFirebase();
    if (!result.ok) return result;
    const check = validateSnapshot(result.payload);
    if (!check.ok) return check;
    restoreSnapshotData(check.snapshot);
    return { ok: true, updatedAt: result.updatedAt };
  }, [restoreSnapshotData]);

  // ─── Firebase Auth login (async, admin/teacher) ─────────
  const loginWithFirebase = useCallback(async (nextRole, email, password) => {
    const result = await firebaseLogin(email, password);
    if (!result.ok) return result;

    if (nextRole === 'admin') {
      setRole('admin');
      setUser({ name: result.user.displayName || email.split('@')[0], email });
    } else {
      setRole('teacher');
      setUser({ name: result.user.displayName || email.split('@')[0], email });
    }
    return { ok: true };
  }, []);

  const updateAuthConfig = useCallback(
    (patch) => {
      setAuthConfig((prev) => ({
        admin: { ...prev.admin, ...patch.admin },
        teacher: { ...prev.teacher, ...patch.teacher },
      }));
    },
    [setAuthConfig],
  );

  // ─── Activity Log ─────────────────────────────────────────────────────────
  const addActivityLog = useCallback((entry) => {
    setActivityLogs((prev) => [entry, ...prev].slice(0, 500));
  }, [setActivityLogs]);

  const login = useCallback(
    (nextRole, credentials) => {
      if (nextRole === 'admin') {
        if (credentials.username !== 'admin') {
          return { ok: false, message: 'ชื่อผู้ใช้ไม่ถูกต้อง' };
        }
        if (credentials.pin !== authConfig.admin.pin) {
          return { ok: false, message: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' };
        }
        setRole('admin');
        setUser({ name: authConfig.admin.name });
        return { ok: true };
      }
      if (nextRole === 'teacher') {
        // ตรวจสอบ username + PIN กับครูทุกคนในระบบ
        const matchedTeacher = teachers.find(
          (t) => t.username === credentials.username && t.pin === credentials.pin
        );
        if (!matchedTeacher) {
          return { ok: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
        }
        setRole('teacher');
        setUser({
          name: matchedTeacher.name,
          teacherId: matchedTeacher.id,
          level: matchedTeacher.level,
          className: matchedTeacher.className,
        });
        return { ok: true };
      }
      if (nextRole === 'parent') {
        const student = students.find(
          (s) => String(s.id) === String(credentials.studentId)
        );
        if (!student) {
          return { ok: false, message: 'ไม่พบนักเรียน' };
        }
        if (credentials.pin !== student.parentPin) {
          return { ok: false, message: 'รหัส PIN ผู้ปกครองไม่ถูกต้อง' };
        }
        setRole('parent');
        setUser({
          name: `ผู้ปกครอง ${student.name.split(' ').slice(-1)[0]}`,
          studentId: student.id,
        });
        return { ok: true };
      }
      return { ok: false, message: 'บทบาทไม่ถูกต้อง' };
    },
    [students, teachers, authConfig],
  );

  const logout = useCallback(() => {
    setRole(null);
    setUser(null);
    setSelectedStudent(null);
    setEvaluatingStudent(null);
    if (isFirebaseConfigured) firebaseLogout();
  }, []);

  const resetAllData = useCallback(() => {
    clearAllStorage();
    window.location.reload();
  }, []);

  const handleImport = useCallback(
    (type, text) => {
      try {
        const rows = text.trim().split('\n').map((row) => row.split(',').map((cell) => cell.trim()));
        const dataRows = rows.slice(1);

        if (type === 'students') {
          const newStudents = dataRows.map((row) => ({
            id: Date.now() + Math.random(),
            name: row[0],
            level: row[1] || 'K1',
            age: parseInt(row[2], 10) || 5,
            weight: parseFloat(row[3]) || 0,
            height: parseFloat(row[4]) || 0,
            assessments: {},
            attendance: { present: 0, absent: 0, total: 0 },
            parentPin: String(1000 + Math.floor(Math.random() * 9000)),
          }));
          setStudents((prev) => [...prev, ...newStudents]);
        } else if (type === 'teachers') {
          const newTeachers = dataRows.map((row) => ({
            id: Date.now() + Math.random(),
            name: row[0],
            level: row[1] || 'K1',
            status: 'Active',
          }));
          setTeachers((prev) => [...prev, ...newTeachers]);
        }
        return { ok: true };
      } catch {
        return { ok: false, message: 'รูปแบบข้อมูลไม่ถูกต้อง' };
      }
    },
    [setStudents, setTeachers],
  );

  const handleSaveEvaluation = useCallback(
    (summary) => {
      if (!evaluatingStudent) return;
      setStudents((prev) =>
        prev.map((s) =>
          s.id === evaluatingStudent.id
            ? { ...s, assessments: { ...s.assessments, summary } }
            : s,
        ),
      );
      setEvaluatingStudent(null);
    },
    [evaluatingStudent, setStudents],
  );

  const saveDailyAttendance = useCallback(
    (date, recordsByStudentId) => {
      const merged = mergeDayRecords(dailyRecords, date, recordsByStudentId);
      setDailyRecords(merged);
      setStudents((prev) =>
        prev.map((s) => ({
          ...s,
          attendance: recomputeAttendanceFromDailyRecords(merged, s.id),
        })),
      );
      return { ok: true };
    },
    [dailyRecords, setDailyRecords, setStudents],
  );

  const saveDailyHygiene = useCallback(
    (date, recordsByStudentId) => {
      const merged = mergeDayRecords(dailyRecords, date, recordsByStudentId);
      setDailyRecords(merged);
      return { ok: true };
    },
    [dailyRecords, setDailyRecords],
  );

  const addStudent = useCallback(
    (data) => {
      setStudents((prev) => [
        ...prev,
        {
          ...data,
          id: Date.now(),
          assessments: {},
          attendance: { present: 0, absent: 0, total: 0 },
          parentPin: data.parentPin || String(1000 + Math.floor(Math.random() * 9000)),
        },
      ]);
      setIsAdding(false);
    },
    [setStudents],
  );

  const value = {
    role,
    user,
    login,
    logout,
    authConfig,
    updateAuthConfig,
    students,
    setStudents,
    teachers,
    setTeachers,
    classes,
    setClasses,
    schools,
    setSchools,
    holidays,
    setHolidays,
    assessmentTopics,
    setAssessmentTopics,
    announcements,
    setAnnouncements,
    academicYears,
    setAcademicYears,
    schoolName,
    setSchoolName,
    academicYear,
    setAcademicYear,
    dailyRecords,
    qaData,
    setQaData,
    indicators,
    setIndicators,
    activities,
    setActivities,
    schoolTerms,
    setSchoolTerms,
    importStudentAssessmentExcel,
    importQaStandardExcel,
    selectedStudent,
    setSelectedStudent,
    evaluatingStudent,
    setEvaluatingStudent,
    isAdding,
    setIsAdding,
    isSettingsOpen,
    setIsSettingsOpen,
    handleImport,
    handleSaveEvaluation,
    saveDailyAttendance,
    saveDailyHygiene,
    addStudent,
    resetAllData,
    exportBackupJson,
    importBackupJson,
    syncPushToCloud,
    syncPullFromCloud,
    isSupabaseConfigured,
    // Firebase
    isFirebaseConfigured,
    firebaseUser,
    loginWithFirebase,
    syncPushToFirebase,
    syncPullFromFirebase,
    // Activity Log
    activityLogs,
    addActivityLog,
    // AI
    aiApiKey,
    setAiApiKey,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
