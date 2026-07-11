import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, clearAllStorage } from '../constants/storageKeys';
import { DEFAULT_AUTH_CONFIG, TEST_ACCOUNTS } from '../constants/auth';
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
import { getMondayOf } from '../utils/helpers';
import { buildAppSnapshot, validateSnapshot } from '../utils/appSnapshot';
import { pullSnapshotFromCloud, pushSnapshotToCloud } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { isFirebaseConfigured, db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
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

  // ── ตารางกิจกรรม (Firestore-backed) ──────────────────────────────────────
  const [activitySchedule, setActivitySchedule] = useState([]);
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const unsub = onSnapshot(collection(db, 'activitySchedule'), snap => {
      if (!snap.empty) {
        setActivitySchedule(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }
    });
    return () => unsub();
  }, []);

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
  const [schoolPhilosophy, setSchoolPhilosophy] = useLocalStorage(STORAGE_KEYS.schoolPhilosophy,
    'การศึกษาปฐมวัย เป็นการพัฒนาเด็กตั้งแต่แรกเกิดถึง 6 ปีบริบูรณ์ อย่างเป็นองค์รวมบนพื้นฐานการอบรมเลี้ยงดูและการส่งเสริมกระบวนการเรียนรู้ที่สนองต่อธรรมชาติและพัฒนาการตามวัยของเด็กแต่ละคนให้เต็มตามศักยภาพ ภายใต้บริบทสังคมและวัฒนธรรมที่เด็กอาศัยอยู่ ด้วยความรัก ความเอื้ออาทร และความเข้าใจของทุกคน เพื่อสร้างรากฐานคุณภาพชีวิตให้เด็กพัฒนาไปสู่ความเป็นมนุษย์ที่สมบูรณ์ เกิดคุณค่าต่อตนเอง ครอบครัว ชุมชน สังคม และประเทศชาติ');
  const [schoolVision, setSchoolVision] = useLocalStorage(STORAGE_KEYS.schoolVision,
    'หลักสูตรการศึกษาปฐมวัยมุ่งพัฒนาเด็กทุกคนให้ได้รับการพัฒนาด้านร่างกาย อารมณ์ จิตใจ สังคมและสติปัญญา อย่างมีคุณภาพและต่อเนื่อง ได้รับการจัดประสบการณ์การเรียนรู้อย่างมีความสุขและเหมาะสมตามวัย มีทักษะชีวิต และปฏิบัติตนตามหลักปรัชญาของเศรษฐกิจพอเพียง เป็นคนดี มีวินัย และสำนึกความเป็นไทย โดยความร่วมมือระหว่างสถานศึกษา พ่อแม่ ครอบครัว ชุมชน และทุกฝ่ายที่เกี่ยวข้องกับการพัฒนาเด็ก');
  const [localGovSlogan, setLocalGovSlogan] = useLocalStorage(STORAGE_KEYS.localGovSlogan,
    'เด็กเล็กเบิกบาน วิชาการก้าวหน้า เยาวชนพัฒนา ปวงประชาร่วมใจ');
  const [schoolSlogan, setSchoolSlogan] = useLocalStorage(STORAGE_KEYS.schoolSlogan,
    'วินัยดี มีวิชา กีฬาเด่น เป็นโรงเรียนของชุมชน');
  const [schoolLogo, setSchoolLogo] = useLocalStorage(STORAGE_KEYS.schoolLogo, '');
  const [academicYear, setAcademicYear] = useLocalStorage(STORAGE_KEYS.academicYear, '2569');
  const [dailyRecords, setDailyRecords] = useLocalStorage(STORAGE_KEYS.dailyRecords, {});
  const [qaData, setQaData] = useLocalStorage(STORAGE_KEYS.qaData, null);
  const [indicators, setIndicators] = useLocalStorage(STORAGE_KEYS.indicators, INITIAL_INDICATORS);
  const [activities, setActivities] = useLocalStorage(STORAGE_KEYS.activities, INITIAL_ACTIVITIES);
  const [schoolTerms, setSchoolTerms] = useLocalStorage(STORAGE_KEYS.schoolTerms, {});
  const [currentTerm, setCurrentTerm] = useLocalStorage(STORAGE_KEYS.currentTerm, '1');
  const [aiApiKey, setAiApiKey] = useLocalStorage(STORAGE_KEYS.aiApiKey, '');
  const [activityLogs, setActivityLogs] = useLocalStorage(STORAGE_KEYS.activityLogs, []);
  const [systemLogs, setSystemLogs]     = useLocalStorage(STORAGE_KEYS.systemLogs, []);
  const [pickupRecords, setPickupRecords] = useLocalStorage(STORAGE_KEYS.pickupRecords, {});
  const [mediaRecords,        setMediaRecords]        = useLocalStorage(STORAGE_KEYS.mediaRecords,        []);
  const [mediaBorrowRecords,  setMediaBorrowRecords]  = useLocalStorage(STORAGE_KEYS.mediaBorrowRecords,  []);
  const [cornerRecords,      setCornerRecords]      = useLocalStorage(STORAGE_KEYS.cornerRecords,      {});
  const [innerCornerRecords, setInnerCornerRecords] = useLocalStorage(STORAGE_KEYS.innerCornerRecords, {});
  const [cornerDefs, setCornerDefs] = useLocalStorage(STORAGE_KEYS.cornerDefs, [
    { key: 'wasteSort',    label: 'คัดแยกขยะ' },
    { key: 'organicWaste', label: 'ขยะอินทรีย์' },
    { key: 'garden',       label: 'แปลงปลูกผัก' },
    { key: 'learningRoom', label: 'ห้องแหล่งเรียนรู้' },
    { key: 'computerRoom', label: 'ห้องคอมพิวเตอร์' },
    { key: 'trafficSign',  label: 'เครื่องหมายจราจร' },
  ]);
  const [innerCornerDefs, setInnerCornerDefs] = useLocalStorage(STORAGE_KEYS.innerCornerDefs, [
    { key: 'block',    label: 'มุมบล็อก' },
    { key: 'story',    label: 'มุมนิทาน' },
    { key: 'lego',     label: 'มุมเลโก้' },
    { key: 'creative', label: 'มุมสร้างสรรค์' },
    { key: 'roleplay', label: 'มุมบทบาทสมมติ' },
    { key: 'media',    label: 'มุมสื่อ' },
  ]);
  const [healthCheckRecords,  setHealthCheckRecords]  = useLocalStorage(STORAGE_KEYS.healthCheckRecords,  {});
  const [illnessCheckRecords, setIllnessCheckRecords] = useLocalStorage(STORAGE_KEYS.illnessCheckRecords, {});
  const [toothBrushRecords,   setToothBrushRecords]   = useLocalStorage(STORAGE_KEYS.toothBrushRecords,   {});
  const [lunchRecords,        setLunchRecords]        = useLocalStorage(STORAGE_KEYS.lunchRecords,        {});
  const [milkRecords,         setMilkRecords]         = useLocalStorage(STORAGE_KEYS.milkRecords,         {});
  const [nutritionRecords,    setNutritionRecords]    = useLocalStorage(STORAGE_KEYS.nutritionRecords,    {});
  const [studentReportRecords, setStudentReportRecords] = useLocalStorage(STORAGE_KEYS.studentReportRecords, {});
  const [measurementDates, setMeasurementDates] = useLocalStorage(STORAGE_KEYS.measurementDates, {
    t1m1: '', // ภาคเรียน 1 ครั้งที่ 1 (อ้างอิง มิ.ย.)
    t1m2: '', // ภาคเรียน 1 ครั้งที่ 2 (อ้างอิง ก.ย.)
    t2m1: '', // ภาคเรียน 2 ครั้งที่ 1 (อ้างอิง ธ.ค.)
    t2m2: '', // ภาคเรียน 2 ครั้งที่ 2 (อ้างอิง ก.พ.)
  });

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

  // ─── Auto-pull จาก Firebase เมื่อ role เปลี่ยนเป็น parent ──
  useEffect(() => {
    if (role !== 'parent') return;
    if (!isFirebaseConfigured) return;
    // ดึงข้อมูลล่าสุดจาก Firebase ในเบื้องหลัง (fire-and-forget)
    pullSnapshotFromFirebase().then(result => {
      if (!result.ok) return;
      const check = validateSnapshot(result.payload);
      if (check.ok) restoreSnapshotData(check.snapshot);
    }).catch(() => {});
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-sync to Firebase (debounced 4s) ──────────────
  const [autoSyncStatus, setAutoSyncStatus] = useState('idle'); // 'idle' | 'pending' | 'syncing' | 'done' | 'error'
  const autoSyncTimer  = useRef(null);
  const isMounted      = useRef(false);   // skip initial mount

  useEffect(() => {
    // ครั้งแรกที่ mount ข้าม — ไม่ต้องการ overwrite Firebase ด้วยข้อมูลเริ่มต้น
    if (!isMounted.current) { isMounted.current = true; return; }
    if (!isFirebaseConfigured) return;

    // บอก UI ว่ามีการเปลี่ยนแปลงรอ sync
    setAutoSyncStatus('pending');

    // ล้าง timer เก่า แล้วเริ่มนับใหม่
    clearTimeout(autoSyncTimer.current);
    autoSyncTimer.current = setTimeout(async () => {
      setAutoSyncStatus('syncing');
      try {
        const payload = buildAppSnapshot(getSnapshotData());
        const result  = await pushSnapshotToFirebase(payload);
        setAutoSyncStatus(result.ok ? 'done' : 'error');
      } catch {
        setAutoSyncStatus('error');
      }
      // reset กลับ idle หลัง 3 วินาที
      setTimeout(() => setAutoSyncStatus('idle'), 3000);
    }, 4000);   // debounce 4 วินาที

    return () => clearTimeout(autoSyncTimer.current);
  }, [
    // ข้อมูลทั้งหมดที่ต้องการ watch
    students, teachers, classes, schools, holidays, authConfig,
    assessmentTopics, announcements, academicYears, schoolName, academicYear,
    dailyRecords, qaData, indicators, activities, activityLogs,
    pickupRecords, mediaRecords, cornerRecords, innerCornerRecords,
    healthCheckRecords, illnessCheckRecords, toothBrushRecords,
    lunchRecords, milkRecords, nutritionRecords, studentReportRecords,
    cornerDefs, innerCornerDefs,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── System Log ───────────────────────────────────────────────────────────
  // action: ประเภทการกระทำ (login, logout, add_student, edit_teacher, delete_class, ...)
  // detail: รายละเอียดเพิ่มเติม
  // userName: ชื่อผู้ใช้ที่กระทำ (ถ้าไม่ระบุใช้ค่าจาก role/user ปัจจุบัน)
  const addSystemLog = useCallback((action, detail = '', userName = '') => {
    setSystemLogs((prev) => [{
      id: Date.now() + Math.random(),
      ts: new Date().toISOString(),
      action,
      detail,
      userName,
    }, ...prev].slice(0, 2000));
  }, [setSystemLogs]);

  // Master PIN — ใช้กู้คืนเมื่อ admin ลืม PIN (ไม่แสดงใน UI / ไม่เก็บใน localStorage)
  const MASTER_PIN = 'KT@irpct2568';

  const login = useCallback(
    (nextRole, credentials) => {
      if (nextRole === 'admin') {
        if (credentials.username !== 'admin') {
          return { ok: false, message: 'ชื่อผู้ใช้ไม่ถูกต้อง' };
        }
        const validPin =
          credentials.pin === authConfig.admin.pin ||
          credentials.pin === MASTER_PIN ||
          credentials.pin === TEST_ACCOUNTS.admin.pin;
        if (!validPin) {
          return { ok: false, message: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' };
        }
        setRole('admin');
        setUser({ name: authConfig.admin.name });
        setSystemLogs(prev => [{ id: Date.now() + Math.random(), ts: new Date().toISOString(), action: 'login', detail: 'เข้าสู่ระบบสำเร็จ', userName: 'admin (ผู้ดูแลระบบ)' }, ...prev].slice(0, 2000));
        return { ok: true };
      }
      if (nextRole === 'teacher') {
        // test account — ทำงานได้เสมอ ไม่ขึ้นกับ localStorage
        // แต่ดึง className/level จาก teachers array ก่อน เพื่อให้การแก้ไขข้อมูลครูจาก admin มีผล
        if (credentials.username === TEST_ACCOUNTS.teacher.username &&
            credentials.pin     === TEST_ACCOUNTS.teacher.pin) {
          const testTeacherRecord = teachers.find(
            t => String(t.id) === String(TEST_ACCOUNTS.teacher.id)
          );
          setRole('teacher');
          setUser({
            name:      testTeacherRecord?.name      ?? TEST_ACCOUNTS.teacher.name,
            teacherId: TEST_ACCOUNTS.teacher.id,
            level:     testTeacherRecord?.level     ?? TEST_ACCOUNTS.teacher.level,
            className: testTeacherRecord?.className ?? TEST_ACCOUNTS.teacher.className,
          });
          return { ok: true };
        }
        // ตรวจสอบ username + PIN กับครูทุกคนในระบบ
        // fallback: ถ้าไม่มี username ให้ลองจับคู่ด้วย email หรือชื่อ-นามสกุล
        const matchedTeacher = teachers.find((t) => {
          const inputU = credentials.username?.trim().toLowerCase();
          const byUsername = t.username?.trim().toLowerCase() === inputU;
          const byEmail    = t.email?.trim().toLowerCase() === inputU;
          const byName     = t.name?.trim() === credentials.username?.trim();
          return (byUsername || byEmail || byName) && t.pin === credentials.pin;
        });
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
        setSystemLogs(prev => [{ id: Date.now() + Math.random(), ts: new Date().toISOString(), action: 'login', detail: `เข้าสู่ระบบสำเร็จ — ห้อง ${matchedTeacher.className ?? '-'}`, userName: `${matchedTeacher.name} (ครู)` }, ...prev].slice(0, 2000));
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
        const guardianName = student.guardianName?.trim() || `ผู้ปกครอง ${student.name.split(' ').slice(-1)[0]}`;
        setRole('parent');
        setUser({
          name: guardianName,
          guardianName: student.guardianName?.trim() || '',
          studentId: student.id,
        });
        setSystemLogs(prev => [{ id: Date.now() + Math.random(), ts: new Date().toISOString(), action: 'login', detail: `เข้าสู่ระบบสำเร็จ — นักเรียน ${student.name}`, userName: `${guardianName} (ผู้ปกครอง)` }, ...prev].slice(0, 2000));
        return { ok: true };
      }
      return { ok: false, message: 'บทบาทไม่ถูกต้อง' };
    },
    [students, teachers, authConfig, setSystemLogs],
  );

  // ─── เปลี่ยนรหัสผ่าน ──────────────────────────────────────
  const changePassword = useCallback(
    (role, { currentPin, newPin, teacherId } = {}) => {
      if (!newPin || newPin.length < 4)
        return { ok: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' };

      if (role === 'admin') {
        if (currentPin !== authConfig.admin.pin && currentPin !== MASTER_PIN)
          return { ok: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
        setAuthConfig((prev) => ({ ...prev, admin: { ...prev.admin, pin: newPin } }));
        return { ok: true };
      }

      if (role === 'teacher') {
        const idx = teachers.findIndex((t) => t.id === teacherId);
        if (idx === -1) return { ok: false, message: 'ไม่พบข้อมูลครู' };
        if (currentPin !== teachers[idx].pin && currentPin !== MASTER_PIN)
          return { ok: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
        const updated = teachers.map((t) =>
          t.id === teacherId ? { ...t, pin: newPin } : t
        );
        setTeachers(updated);
        return { ok: true };
      }

      return { ok: false, message: 'บทบาทไม่รองรับการเปลี่ยนรหัสผ่าน' };
    },
    [authConfig, teachers, setAuthConfig, setTeachers]
  );

  const logout = useCallback(() => {
    // บันทึก log ก่อน clear user
    setSystemLogs(prev => [{
      id: Date.now() + Math.random(),
      ts: new Date().toISOString(),
      action: 'logout',
      detail: 'ออกจากระบบ',
      userName: user?.name ?? 'ผู้ใช้',
    }, ...prev].slice(0, 2000));
    setRole(null);
    setUser(null);
    setSelectedStudent(null);
    setEvaluatingStudent(null);
    if (isFirebaseConfigured) firebaseLogout();
  }, [user, setSystemLogs]);

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
          // Header columns (full template):
          // 0:ชื่อ-นามสกุล 1:ชื่อเล่น 2:เพศ 3:เลขประจำตัว 4:เลขบัตรประชาชน
          // 5:ระดับ 6:ห้องเรียน 7:วันเกิด(YYYY-MM-DD) 8:อายุ 9:น้ำหนัก 10:ส่วนสูง 11:parentPin
          // 12:ชื่อบิดา 13:อาชีพบิดา 14:ชื่อมารดา 15:อาชีพมารดา 16:เบอร์ผู้ปกครอง 17:ที่อยู่
          const header = rows[0];
          const idx = (col) => header.findIndex(h => h === col);
          const iName   = idx('ชื่อ-นามสกุล');
          const iNick   = idx('ชื่อเล่น');
          const iGender = idx('เพศ');
          const iCode   = idx('เลขประจำตัว');
          const iNid    = idx('เลขบัตรประชาชน');
          const iLevel  = idx('ระดับ');
          const iClass  = idx('ห้องเรียน');
          const iBirth  = idx('วันเกิด');
          const iAge    = idx('อายุ');
          const iWeight = idx('น้ำหนัก');
          const iHeight = idx('ส่วนสูง');
          const iPin    = idx('parentPin');
          const iFather = idx('ชื่อบิดา');
          const iMother = idx('ชื่อมารดา');
          const iPhone  = idx('เบอร์ผู้ปกครอง');
          const iAddr   = idx('ที่อยู่');
          // คำนวณอายุจากวันเกิด ISO (YYYY-MM-DD)
          const calcAgeFromISO = (iso) => {
            if (!iso) return null;
            const birth = new Date(iso);
            if (isNaN(birth)) return null;
            const today = new Date();
            let a = today.getFullYear() - birth.getFullYear();
            if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) a--;
            return a < 0 ? 0 : a;
          };
          // Fallback for minimal CSV (name,level,age,weight,height)
          const isMinimal = iName === -1;
          const newStudents = dataRows
            .filter(row => row.some(c => c))
            .map((row) => {
              const name         = isMinimal ? row[0] : (row[iName]   || '');
              const level        = isMinimal ? (row[1] || 'K1')        : (row[iLevel]  || 'K1');
              const className    = isMinimal ? ''                       : (row[iClass]  || '');
              const birthDate    = isMinimal ? '' : (row[iBirth] || '');
              const ageFromBirth = calcAgeFromISO(birthDate);
              const age          = ageFromBirth ?? (isMinimal ? parseInt(row[2]) || 5 : (parseInt(row[iAge]) || 5));
              const weight       = isMinimal ? parseFloat(row[3]) || 0 : (parseFloat(row[iWeight]) || 0);
              const height       = isMinimal ? parseFloat(row[4]) || 0 : (parseFloat(row[iHeight]) || 0);
              return {
                id:           Date.now() + Math.random(),
                name,
                nickname:     isMinimal ? '' : (row[iNick]   || ''),
                gender:       isMinimal ? '' : (row[iGender] || ''),
                studentCode:  isMinimal ? '' : (row[iCode]   || ''),
                nationalId:   isMinimal ? '' : (row[iNid]    || ''),
                level,
                className,
                birthDate,
                age,
                weight,
                height,
                parentPin:    isMinimal ? String(1000 + Math.floor(Math.random() * 9000)) : (row[iPin]    || String(1000 + Math.floor(Math.random() * 9000))),
                fatherName:   isMinimal ? '' : (row[iFather] || ''),
                motherName:   isMinimal ? '' : (row[iMother] || ''),
                guardianPhone:isMinimal ? '' : (row[iPhone]  || ''),
                address:      isMinimal ? '' : (row[iAddr]   || ''),
                assessments:  {},
                attendance:   { present: 0, absent: 0, total: 0 },
              };
            });
          setStudents((prev) => [...prev, ...newStudents]);
          return { ok: true, count: newStudents.length };
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

      // ── Auto-sync: เมื่อครูบันทึกการมาเรียน → เช็คอัตโนมัติในทุก tab ──
      // เฉพาะนักเรียนที่สถานะ "มา" และยังไม่มีข้อมูลในวันนั้น (ไม่ overwrite)
      const [jsYear, moNum, dayNum] = date.split('-').map(Number);
      const thaiYear = jsYear + 543;
      const month    = moNum;
      const day      = dayNum;

      // รวบรวม studentId จัดกลุ่มตามห้อง แยกมา / ขาด-ลา / ป่วย
      const byClass        = {}; // มา
      const byClassAbsent  = {}; // ขาด / ลา
      const byClassSick    = {}; // ป่วย
      Object.entries(recordsByStudentId).forEach(([id, rec]) => {
        const stu = students.find(s => String(s.id) === String(id));
        if (!stu) return;
        if (rec.attendance === 'มา') {
          (byClass[stu.className] ??= []).push(String(id));
        } else if (['ขาด', 'ลา'].includes(rec.attendance)) {
          (byClassAbsent[stu.className] ??= []).push(String(id));
        } else if (rec.attendance === 'ป่วย') {
          (byClassSick[stu.className] ??= []).push(String(id));
        }
      });

      // รวม ขาด/ลา + ป่วย สำหรับกรณีที่ต้องการ X ทั้งคู่
      const mergeClassMaps = (a, b) => {
        const result = { ...a };
        Object.entries(b).forEach(([cls, ids]) => { (result[cls] ??= []).push(...ids); });
        return result;
      };
      const byClassAllAbsent = mergeClassMaps(byClassAbsent, byClassSick);

      const monthStr = String(month).padStart(2, '0');
      const makeKey  = (cls) => `${cls}__${academicYear}__${thaiYear}-${monthStr}`;

      // ── Milk, Lunch, ToothBrush → H (มา) และ X (ขาด/ลา/ป่วย) ──
      // ใช้ functional updater setter(prev => ...) เพื่อให้ H และ X ถูก apply ใน
      // setState เดียวกัน ป้องกัน React batch ทำให้ patchX ทับ patchH
      const applyHX = (setter) => {
        setter(prev => {
          const next = { ...prev };
          // H สำหรับนักเรียนที่มา
          Object.entries(byClass).forEach(([cls, ids]) => {
            const k   = makeKey(cls);
            const rec = next[k]
              ? { ...next[k], students: { ...next[k].students } }
              : { id: k, className: cls, academicYear, year: thaiYear, month, students: {} };
            ids.forEach(id => {
              const sData = rec.students[id] ?? { days: {} };
              if (!(day in (sData.days ?? {}))) {
                rec.students[id] = { ...sData, days: { ...(sData.days ?? {}), [day]: 'H' } };
              }
            });
            next[k] = rec;
          });
          // X สำหรับนักเรียนที่ขาด/ลา/ป่วย
          Object.entries(byClassAllAbsent).forEach(([cls, ids]) => {
            const k   = makeKey(cls);
            const rec = next[k]
              ? { ...next[k], students: { ...next[k].students } }
              : { id: k, className: cls, academicYear, year: thaiYear, month, students: {} };
            ids.forEach(id => {
              const sData = rec.students[id] ?? { days: {} };
              if (!(day in (sData.days ?? {}))) {
                rec.students[id] = { ...sData, days: { ...(sData.days ?? {}), [day]: 'X' } };
              }
            });
            next[k] = rec;
          });
          return next;
        });
      };
      applyHX(setMilkRecords);
      applyHX(setLunchRecords);
      applyHX(setToothBrushRecords);

      // ── IllnessCheck → มา:'√' | ขาด/ลา:'X' | ป่วย:'C' ──
      setIllnessCheckRecords(prev => {
        const next = { ...prev };
        const applyIllness = (classMap, statusVal) => {
          Object.entries(classMap).forEach(([cls, ids]) => {
            const k   = makeKey(cls);
            const rec = next[k]
              ? { ...next[k], students: { ...next[k].students } }
              : { id: k, className: cls, academicYear, year: thaiYear, month, students: {} };
            ids.forEach(id => {
              const sData = rec.students[id] ?? { days: {}, weight: 0, height: 0 };
              if (!(day in (sData.days ?? {}))) {
                rec.students[id] = {
                  ...sData,
                  days: { ...(sData.days ?? {}), [day]: { v: statusVal, sep: 0, home: false, fam: false, note: '' } },
                };
              }
            });
            next[k] = rec;
          });
        };
        applyIllness(byClass,       '√');
        applyIllness(byClassAbsent, 'X');
        applyIllness(byClassSick,   'C'); // ป่วย → C (ไข้ทั่วไป) ครูเปลี่ยน H/D เองภายหลัง
        return next;
      });

      // ── HealthCheck → เฉพาะวันจันทร์ (หรืออังคารถ้าจันทร์เป็นวันหยุด) ──
      // key: className__academicYear__YYYY-MM-DD
      // ค่า: null=ยังไม่ตรวจ | 1|2|3 = ครั้งที่ในเดือน
      (() => {
        const weekday = new Date(date).getDay(); // 0=อาทิตย์ 1=จันทร์ 2=อังคาร

        // ฟังก์ชันตรวจสอบว่า ISO date ตรงกับวันหยุดใน holidays หรือไม่
        const isHoliday = (isoDate) => holidays.some(h => {
          const [dd, mm, bYear] = h.date.split('/');
          return `${parseInt(bYear, 10) - 543}-${mm}-${dd}` === isoDate;
        });

        let isHealthCheckDay = false;
        if (weekday === 1) {
          isHealthCheckDay = !isHoliday(date);       // จันทร์ที่ไม่ใช่วันหยุด
        } else if (weekday === 2) {
          // อังคาร — ตรวจสอบว่าจันทร์ก่อนหน้าเป็นวันหยุดไหม
          const prevMon = new Date(date);
          prevMon.setDate(prevMon.getDate() - 1);
          const prevMonISO = prevMon.toISOString().split('T')[0];
          isHealthCheckDay = isHoliday(prevMonISO);
        }

        if (!isHealthCheckDay) return;

        // คำนวณครั้งที่ในเดือน (1–3) จากวันที่
        const weekNum = Math.min(Math.ceil(dayNum / 7), 3);
        const healthEntry = (val) => ({
          body: val, hair: val, cloth: val,
          ear: val,  mouth: val, nail: val, note: '',
        });

        setHealthCheckRecords(prev => {
          const next = { ...prev };
          // มา → เติมค่าครั้งที่ (weekNum)
          Object.entries(byClass).forEach(([cls, ids]) => {
            const k   = `${cls}__${academicYear}__${date}`;
            const rec = next[k]
              ? { ...next[k], students: { ...next[k].students } }
              : { id: k, className: cls, academicYear, date, students: {} };
            ids.forEach(id => { if (!rec.students[id]) rec.students[id] = healthEntry(weekNum); });
            next[k] = rec;
          });
          // ขาด/ลา/ป่วย → บันทึก record เปล่า (null = ยังไม่ได้ตรวจ)
          Object.entries(byClassAllAbsent).forEach(([cls, ids]) => {
            const k   = `${cls}__${academicYear}__${date}`;
            const rec = next[k]
              ? { ...next[k], students: { ...next[k].students } }
              : { id: k, className: cls, academicYear, date, students: {} };
            ids.forEach(id => { if (!rec.students[id]) rec.students[id] = healthEntry(null); });
            next[k] = rec;
          });
          return next;
        });
      })();

      // ── Corner & InnerCorner (รายสัปดาห์) ──
      // corner  = แหล่งเรียนรู้นอกห้อง: เติมตามกิจกรรมที่กำหนดในตาราง
      // innerCorner = มุมประสบการณ์ในห้อง: เติมทุก key เมื่อนักเรียนมาเรียน
      const monday = getMondayOf(date);

      // แผนที่ประเภทกิจกรรม → key ของ cornerDefs
      const ACT_TO_CORNER = {
        wst: ['wasteSort', 'organicWaste'],
        gar: ['garden'],
        ef:  ['learningRoom'],
        com: ['computerRoom'],
        res: ['learningRoom'],
      };

      // ชื่อวันภาษาไทยตาม index ของ getDay()
      const THAI_DAY_NAMES = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
      const thaiDayName = THAI_DAY_NAMES[new Date(date).getDay()];

      setCornerRecords(prev => {
        const next = { ...prev };
        Object.entries(byClass).forEach(([cls, ids]) => {
          const weekKey  = `${cls}||${monday}`;
          const weekData = { ...(next[weekKey] ?? {}) };
          const emptyRec = Object.fromEntries((cornerDefs ?? []).map(c => [c.key, false]));

          // หาห้องที่ตรงกับ className แล้วดูกิจกรรมวันนี้
          const room        = activitySchedule.find(r => r.name === `ห้อง ${cls}`);
          const dayActs     = room?.days?.[thaiDayName] ?? [];
          const keysToMark  = new Set(
            dayActs.flatMap(([type]) => ACT_TO_CORNER[type] ?? [])
          );

          ids.forEach(id => {
            const existing = weekData[id] ?? { ...emptyRec };
            const updated  = { ...existing };
            keysToMark.forEach(k => { updated[k] = true; });
            weekData[id]   = updated;
          });
          next[weekKey] = weekData;
        });
        return next;
      });

      setInnerCornerRecords(prev => {
        const next = { ...prev };
        // เติม innerCorner ทุก key = true สำหรับนักเรียนที่มา (มุมประสบการณ์ใช้ทุกวัน)
        const allTrueRec = Object.fromEntries((innerCornerDefs ?? []).map(c => [c.key, true]));
        const emptyRec   = Object.fromEntries((innerCornerDefs ?? []).map(c => [c.key, false]));
        Object.entries(byClass).forEach(([cls, ids]) => {
          const weekKey  = `${cls}||${monday}`;
          const weekData = { ...(next[weekKey] ?? {}) };
          ids.forEach(id => {
            weekData[id] = { ...emptyRec, ...(weekData[id] ?? {}), ...allTrueRec };
          });
          next[weekKey] = weekData;
        });
        return next;
      });

      return { ok: true };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      dailyRecords, setDailyRecords, setStudents, students, academicYear,
      milkRecords,       setMilkRecords,
      lunchRecords,      setLunchRecords,
      toothBrushRecords, setToothBrushRecords,
      setIllnessCheckRecords,
      healthCheckRecords, setHealthCheckRecords,
      cornerRecords,      setCornerRecords,      cornerDefs,
      innerCornerRecords, setInnerCornerRecords, innerCornerDefs,
      holidays, activitySchedule,
    ],
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

  // รายชื่อห้องเรียนทั้งหมด (dynamic — ไม่ hardcode)
  const allClassNames = useMemo(
    () => (classes ?? []).map(c => c.name ?? c.id).filter(Boolean).sort(),
    [classes],
  );

  // แผนที่ห้องเรียนจัดกลุ่มตามระดับชั้น { K1: ['อ.1/1', ...], K2: [...], K3: [...] }
  const classMap = useMemo(() => {
    const map = { K1: [], K2: [], K3: [] };
    (classes ?? []).forEach(c => {
      const name = c.name ?? c.id;
      if (name && map[c.level]) map[c.level].push(name);
    });
    return map;
  }, [classes]);

  const value = {
    role,
    user,
    login,
    logout,
    changePassword,
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
    schoolPhilosophy,
    setSchoolPhilosophy,
    schoolVision,
    setSchoolVision,
    localGovSlogan,
    setLocalGovSlogan,
    schoolSlogan,
    setSchoolSlogan,
    schoolLogo,
    setSchoolLogo,
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
    currentTerm,
    setCurrentTerm,
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
    allClassNames,
    classMap,
    // Firebase
    isFirebaseConfigured,
    firebaseUser,
    loginWithFirebase,
    syncPushToFirebase,
    syncPullFromFirebase,
    autoSyncStatus,
    // Activity Log (evaluation-specific)
    activityLogs,
    addActivityLog,
    // System Log (ระดับระบบ — login, CRUD, รายงาน)
    systemLogs,
    setSystemLogs,
    addSystemLog,
    // AI
    aiApiKey,
    setAiApiKey,
    // Pickup
    pickupRecords,
    setPickupRecords,
    // Media
    mediaRecords,
    setMediaRecords,
    mediaBorrowRecords,
    setMediaBorrowRecords,
    // Corner / Outside Learning
    cornerRecords,
    setCornerRecords,
    cornerDefs,
    setCornerDefs,
    // Inner Corner / Inside Learning
    innerCornerRecords,
    setInnerCornerRecords,
    innerCornerDefs,
    setInnerCornerDefs,
    // Health Check
    healthCheckRecords,
    setHealthCheckRecords,
    // Illness Check
    illnessCheckRecords,
    setIllnessCheckRecords,
    // Tooth Brush
    toothBrushRecords,
    setToothBrushRecords,
    // Lunch
    lunchRecords,
    setLunchRecords,
    // Milk
    milkRecords,
    setMilkRecords,
    // Nutrition
    nutritionRecords,
    setNutritionRecords,
    // Student Report Book (อ.01)
    studentReportRecords,
    setStudentReportRecords,
    // Measurement dates config (อ.01 physical section)
    measurementDates,
    setMeasurementDates,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
