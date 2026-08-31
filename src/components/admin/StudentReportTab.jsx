import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { INDICATORS_DATA_68 } from '../../data/indicatorsData_68';
const INDICATORS_DATA = INDICATORS_DATA_68; // alias — ใช้มาตรฐาน 2568 เท่านั้น
import { callClaude, buildTeacherCommentPrompt, buildDomainSummaryPrompt } from '../../utils/aiHelper';
import CompCard from './report/CompCard';
import SubDomainSummaryBox from './report/SubDomainSummaryBox';
import DomainSummaryBox from './report/DomainSummaryBox';
import DomainSummarySection from './report/DomainSummarySection';
import HighlightsSection from './report/HighlightsSection';
import { isoToThai, todayISO } from '../../utils/helpers';
import {
  GROWTH_ROWS, PHILOSOPHY_TEXT, VISION_TEXT,
  DEV_ASSESS_DOMAINS,
} from '../../data/reportConstants';
import {
  calcGrowthLevels, levelLabel, levelColor,
  getActivityTermScore, getIndicatorTermScore,
  gradeLabelOf, suggestLevelFromIndicator, rawScoreFromIndicator,
  genderOf, ageAt,
  PHYS_KEYS, PHYS_LABELS, PHYS_MONTH_HINTS, emptyPhys,
  GROWTH_MONTHS_T1, GROWTH_MONTHS_T2, GROWTH_MONTHS_ALL,
  monthRefDate, emptyGrowth,
  DOMAIN_LABELS, D4_STD_LABELS,
  domainAllComponents, emptyDevAssess, devAssessDomainAvg,
} from '../../utils/reportHelpers';
import { printReport } from '../../utils/printReport';

export default function StudentReportTab({ teacherClassFilter = null, initialStudentId = null }) {
  const {
    role,
    students, classes, teachers, academicYear, schoolName,
    schoolPhilosophy, schoolVision, schoolLogo, schoolDirectorName, schools,
    dailyRecords,
    studentReportRecords, setStudentReportRecords,
    indicators, activities, assessmentTopics,
    aiApiKey,
    measurementDates,
  } = useApp();

  const [aiCommentLoading, setAiCommentLoading] = useState({ 1: false, 2: false });
  const [aiCommentError,   setAiCommentError]   = useState({ 1: '', 2: '' });
  const [aiDomainLoading,  setAiDomainLoading]  = useState({});
  const [aiDomainError,    setAiDomainError]    = useState({});

  const [selStudentId, setSelStudentId] = useState(initialStudentId ? String(initialStudentId) : null);
  const [activeSection, setActiveSection] = useState('physical');
  const [devAssessTab, setDevAssessTab] = useState('physical');
  const [newHs, setNewHs] = useState({ date: todayISO(), service: '', note: '' });

  // ── filtered students ─────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (teacherClassFilter) return students.filter(s => s.className === teacherClassFilter);
    return students;
  }, [students, teacherClassFilter]);

  // sorted students by class then name
  const sortedStudents = useMemo(() =>
    [...filteredStudents].sort((a, b) =>
      (a.className ?? '').localeCompare(b.className ?? '', 'th') ||
      (a.name ?? '').localeCompare(b.name ?? '', 'th')
    ), [filteredStudents]);

  const student = useMemo(() =>
    students.find(s => String(s.id) === String(selStudentId)) ?? null
  , [students, selStudentId]);

  // ── record key ────────────────────────────────────────────────────────────
  const recKey = selStudentId ? `${selStudentId}__${academicYear}` : null;

  const rec = useMemo(() => {
    if (!recKey) return null;
    return studentReportRecords[recKey] ?? {
      studentId: selStudentId,
      academicYear,
      physicalRecords: emptyPhys(),
      growthRecords: emptyGrowth(),
      devAssessment: emptyDevAssess(),
      healthServices: [],
      teacherComments:  { term1: '', term2: '' },
      parentComments:   { term1: '', term2: '' },
      directorsComment: '',
      highlights: {},
    };
  }, [recKey, studentReportRecords, selStudentId, academicYear]);

  // ดึงข้อมูลจากบันทึก — ถ้ายังไม่มีวันที่ ให้ใช้ค่าเริ่มต้นจากเมนู "กำหนดวันวัดน้ำหนัก/ส่วนสูง"
  const physData = (() => {
    const raw = rec?.physicalRecords ?? emptyPhys();
    if (!measurementDates) return raw;
    const result = {};
    PHYS_KEYS.forEach(k => {
      result[k] = { ...raw[k], date: raw[k].date || (measurementDates[k] ?? '') };
    });
    return result;
  })();
  const growthData     = rec?.growthRecords  ?? emptyGrowth();
  const devAssessData  = rec?.devAssessment  ?? emptyDevAssess();
  const healthServices = rec?.healthServices ?? [];
  const teacherComments  = rec?.teacherComments  ?? { term1: '', term2: '' };
  const parentComments   = rec?.parentComments   ?? { term1: '', term2: '' };
  const directorsComment = rec?.directorsComment ?? '';
  const highlights       = rec?.highlights       ?? {};

  // ── save helper ───────────────────────────────────────────────────────────
  const saveRec = useCallback((patch) => {
    if (!recKey) return;
    setStudentReportRecords(prev => ({
      ...prev,
      [recKey]: { ...(prev[recKey] ?? { studentId: selStudentId, academicYear, physicalRecords: emptyPhys(), growthRecords: emptyGrowth(), devAssessment: emptyDevAssess(), healthServices: [], teacherComments: { term1: '', term2: '' }, parentComments: { term1: '', term2: '' }, directorsComment: '', highlights: {} }), ...patch },
    }));
  }, [recKey, setStudentReportRecords, selStudentId, academicYear]);

  // ── highlights update helper ──────────────────────────────────────────────
  // rowKey: 'd0','d1','d2','d3s0'–'d3s4'  |  term: 'term1'|'term2'  |  role: 'teacher'|'parent'
  const saveHighlight = useCallback((rowKey, term, role, value) => {
    const current = highlights[rowKey] ?? { term1: { teacher: '', parent: '' }, term2: { teacher: '', parent: '' } };
    const updated  = { ...current, [term]: { ...current[term], [role]: value } };
    saveRec({ highlights: { ...highlights, [rowKey]: updated } });
  }, [highlights, saveRec]);

  // ── physical record update ────────────────────────────────────────────────
  const updatePhys = useCallback((key, field, value) => {
    const current = physData[key] ?? { date: '', weight: '', height: '', weightLevel: 0, heightLevel: 0 };
    const updated  = { ...current, [field]: value };

    // auto-calc levels if we have weight/height + student birth date
    if ((field === 'weight' || field === 'height' || field === 'date') && updated.date && student?.birthDate) {
      const { ageYear, ageMonth } = ageAt(student.birthDate, updated.date);
      const gender = genderOf(student);
      const lvls = calcGrowthLevels(ageYear, ageMonth, updated.weight, updated.height, gender);
      if (updated.weight) updated.weightLevel = lvls.weightLevel;
      if (updated.height) updated.heightLevel = lvls.heightLevel;
    }

    saveRec({ physicalRecords: { ...physData, [key]: updated } });
  }, [physData, saveRec, student]);

  // ── monthly growth record update ──────────────────────────────────────────
  const updateGrowth = useCallback((key, field, value) => {
    const current = growthData[key] ?? { weight: '', height: '' };
    saveRec({ growthRecords: { ...growthData, [key]: { ...current, [field]: value } } });
  }, [growthData, saveRec]);

  // ── dev assess update ─────────────────────────────────────────────────────
  const updateDevAssess = useCallback((key, field, value) => {
    const current = devAssessData[key] ?? { t1level: 0, t1highlight: '', t2level: 0, t2highlight: '', summary: 0 };
    saveRec({ devAssessment: { ...devAssessData, [key]: { ...current, [field]: value } } });
  }, [devAssessData, saveRec]);

  // ── suggest levels from indicator scores for a whole domain ──────────────
  const handleSuggestDomain = useCallback((domain) => {
    if (!student) return;
    const comps = domainAllComponents(domain);
    const updates = {};
    let hasAny = false;
    comps.forEach(comp => {
      const t1 = suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 1);
      const t2 = suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 2);
      if (t1 > 0 || t2 > 0) {
        const current = devAssessData[comp.key] ?? { t1level: 0, t1highlight: '', t2level: 0, t2highlight: '', summary: 0 };
        const summary = t2 > 0 ? t2 : (t1 > 0 ? t1 : current.summary);
        updates[comp.key] = {
          ...current,
          ...(t1 > 0 ? { t1level: t1 } : {}),
          ...(t2 > 0 ? { t2level: t2 } : {}),
          summary,
        };
        hasAny = true;
      }
    });
    if (hasAny) {
      saveRec({ devAssessment: { ...devAssessData, ...updates } });
    } else {
      alert('ไม่พบข้อมูลประเมินผลพัฒนาการสำหรับด้านนี้');
    }
  }, [student, devAssessData, saveRec]);

  // ── AI domain summary ─────────────────────────────────────────────────────
  const handleAIDomainSummary = useCallback(async (domain) => {
    if (!aiApiKey || !student) return;
    const comps = domainAllComponents(domain);
    const compScores = comps.map(comp => {
      const d = devAssessData[comp.key] ?? {};
      return { code: comp.code, label: comp.label, t1level: d.t1level ?? 0, t2level: d.t2level ?? 0 };
    });
    setAiDomainLoading(p => ({ ...p, [domain.id]: true }));
    setAiDomainError(p => ({ ...p, [domain.id]: '' }));
    try {
      const result = await callClaude(aiApiKey, buildDomainSummaryPrompt(student, domain, compScores));
      const key = `__domainSummary_${domain.id}`;
      saveRec({ devAssessment: { ...devAssessData, [key]: result } });
    } catch (e) {
      setAiDomainError(p => ({ ...p, [domain.id]: e.message }));
    } finally {
      setAiDomainLoading(p => ({ ...p, [domain.id]: false }));
    }
  }, [aiApiKey, student, devAssessData, saveRec]);

  // ── auto-fill devAssess levels from indicator scores on student select ───────
  // เมื่อเลือกนักเรียนใหม่ ดึงคะแนนจากระบบประเมินพัฒนาการมาเติมให้อัตโนมัติ
  // (เติมเฉพาะช่องที่ยังเป็น 0 — ไม่ทับค่าที่ครูกรอกแล้ว)
  const autoFilledRecRef = useRef(null);

  useEffect(() => {
    if (!student || !recKey) return;
    if (autoFilledRecRef.current === recKey) return; // ป้องกันรัน 2 ครั้งสำหรับ student เดิม
    autoFilledRecRef.current = recKey;

    const currentDA = studentReportRecords[recKey]?.devAssessment ?? emptyDevAssess();
    const updates = {};
    let hasAny = false;

    DEV_ASSESS_DOMAINS.forEach(domain => {
      domainAllComponents(domain).forEach(comp => {
        if (!comp.domainId || !comp.standardId || !comp.indicatorId) return;
        const cur = currentDA[comp.key] ?? { t1level: 0, t2level: 0, summary: 0 };
        const fillT1 = (cur.t1level ?? 0) === 0
          ? suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 1)
          : 0;
        const fillT2 = (cur.t2level ?? 0) === 0
          ? suggestLevelFromIndicator(student, comp.domainId, comp.standardId, comp.indicatorId, 2)
          : 0;
        if (fillT1 > 0 || fillT2 > 0) {
          const fillSummary = (cur.summary ?? 0) === 0 ? (fillT2 || fillT1) : 0;
          updates[comp.key] = {
            ...cur,
            ...(fillT1 > 0 && { t1level: fillT1 }),
            ...(fillT2 > 0 && { t2level: fillT2 }),
            ...(fillSummary > 0 && { summary: fillSummary }),
          };
          hasAny = true;
        }
      });
    });

    if (!hasAny) return;
    setStudentReportRecords(prev => ({
      ...prev,
      [recKey]: {
        ...(prev[recKey] ?? {
          studentId: selStudentId, academicYear,
          physicalRecords: emptyPhys(), growthRecords: emptyGrowth(),
          devAssessment: emptyDevAssess(), healthServices: [],
          teacherComments: { term1: '', term2: '' },
          parentComments: { term1: '', term2: '' },
          directorsComment: '',
        }),
        devAssessment: { ...currentDA, ...updates },
      },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, recKey]);

  // ── attendance summary (computed from dailyRecords) ───────────────────────
  const attendanceSummary = useMemo(() => {
    if (!student) return { term1: {}, term2: {} };
    // gather all dates with a record for this student
    const summary = { term1: { totalDays: 0, presentDays: 0, absentDays: 0 },
                      term2: { totalDays: 0, presentDays: 0, absentDays: 0 } };
    Object.entries(dailyRecords).forEach(([date, dayRecs]) => {
      const stuRec = dayRecs?.[String(student.id)];
      if (!stuRec) return;
      const m = new Date(date).getMonth() + 1; // 1-12
      // term1 = May–Sep (5–9), term2 = Oct–Mar (10–12, 1–4)
      const term = (m >= 5 && m <= 9) ? 1 : 2;
      const t = `term${term}`;
      summary[t].totalDays++;
      if (stuRec.status === 'present' || stuRec.present) summary[t].presentDays++;
      else summary[t].absentDays++;
    });
    return summary;
  }, [dailyRecords, student]);

  // ── developmental domains (from indicators + student.assessments) ─────────
  const devDomains = useMemo(() => {
    if (!student) return [];
    return INDICATORS_DATA_68.map(domain => ({
      ...domain,
      standards: domain.standards.map(std => ({
        ...std,
        indicators: std.indicators.map(ind => {
          const indKey  = `${domain.id}__${std.id}__${ind.id}`;
          const indData = student.assessments?.indicators?.[indKey] ?? {};
          const actIds  = [];
          const actLabels = {};
          ind.items.forEach(item => {
            item.activities.forEach(act => {
              const actKey = `${indKey}__${item.id}__${act.no}`;
              // find in activities store (may have been renamed)
              const stored = activities.find(a => a.id === actKey);
              actIds.push(actKey);
              actLabels[actKey] = stored?.label ?? act.label;
            });
          });
          const scores = {};
          actIds.forEach(id => {
            scores[id] = {
              term1: getActivityTermScore(indData[id], 1),
              term2: getActivityTermScore(indData[id], 2),
            };
          });
          const indScores = {
            term1: getIndicatorTermScore(indData, actIds, 1),
            term2: getIndicatorTermScore(indData, actIds, 2),
          };
          return { ...ind, indKey, actIds, actLabels, scores, indScores };
        }),
      })),
    }));
  }, [student, activities]);

  // ── section tabs ──────────────────────────────────────────────────────────
  const SECTIONS = [
    { id: 'physical',    label: '⚖️ ร่างกาย'              },
    { id: 'attendance',  label: '📅 เวลาเรียน'             },  // อ.01: ส่วนที่ 2
    { id: 'devreport',   label: '📋 พัฒนาการ'              },
    { id: 'summary',     label: '📊 สรุป 4 มาตรฐาน'       },
    { id: 'domain4',     label: '🎯 สรุปพัฒนาการ 4 ด้าน'  },
    { id: 'comments',    label: '💬 ความคิดเห็น'           },
    { id: 'philosophy',  label: '📖 ปรัชญา/วิสัยทัศน์'    },
    { id: 'growthtable', label: '📏 เกณฑ์การเจริญเติบโต'  },
  ];

  // ── classes for selector ──────────────────────────────────────────────────
  const classNames = useMemo(() => {
    const all = teacherClassFilter
      ? [teacherClassFilter]
      : [...new Set(sortedStudents.map(s => s.className).filter(Boolean))].sort();
    return all;
  }, [sortedStudents, teacherClassFilter]);

  const [selClass, setSelClass] = useState(classNames[0] ?? '');
  const studentsInClass = useMemo(() =>
    sortedStudents.filter(s => s.className === selClass),
  [sortedStudents, selClass]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const ACCENT = '#7c3aed';
  const BG     = '#f5f3ff';

  return (
    <div className="glass p-6 animate-fade">
      <div className="page-header mb-5">
        <h3>📒 สมุดรายงานประจำตัวเด็กปฐมวัย (อ.01)</h3>
      </div>

      {/* ── Selector (ซ่อนเมื่อ parent เปิดจาก ParentView) ── */}
      {!initialStudentId && <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {/* Class selector */}
        <div style={{ minWidth: '140px' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.25rem' }}>ห้องเรียน</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {classNames.map(cn => (
              <button key={cn} type="button"
                onClick={() => { setSelClass(cn); setSelStudentId(null); }}
                style={{
                  padding: '.28rem .65rem', borderRadius: '8px', border: `1.5px solid ${selClass === cn ? ACCENT : '#e5e7eb'}`,
                  background: selClass === cn ? ACCENT : 'white', color: selClass === cn ? 'white' : '#4b5563',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                }}>
                {cn}
              </button>
            ))}
          </div>
        </div>

        {/* Student selector */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', marginBottom: '.25rem' }}>
            นักเรียน ({studentsInClass.length} คน)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', maxHeight: '120px', overflowY: 'auto' }}>
            {studentsInClass.map(s => {
              const isActive = String(s.id) === String(selStudentId);
              return (
                <button key={s.id} type="button"
                  onClick={() => setSelStudentId(String(s.id))}
                  style={{
                    padding: '.28rem .65rem', borderRadius: '8px',
                    border: `1.5px solid ${isActive ? ACCENT : '#e5e7eb'}`,
                    background: isActive ? BG : 'white', color: isActive ? ACCENT : '#4b5563',
                    fontFamily: 'inherit', fontWeight: isActive ? 700 : 500, fontSize: '.8rem', cursor: 'pointer',
                  }}>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>}

      {!student ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '.9rem' }}>
          เลือกนักเรียนเพื่อดูสมุดรายงาน
        </div>
      ) : (
        <>
          {/* ── Student Info Bar ── */}
          <div style={{
            background: BG, border: `1.5px solid ${ACCENT}30`, borderRadius: '12px',
            padding: '.75rem 1.25rem', marginBottom: '1.25rem',
            display: 'flex', flexWrap: 'wrap', gap: '.5rem 2rem', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 800, fontSize: '.95rem', color: ACCENT }}>{student.name}</span>
            <span style={{ fontSize: '.82rem', color: '#6b7280' }}>ชั้น {student.className ?? student.level}</span>
            {student.birthDate && (
              <span style={{ fontSize: '.82rem', color: '#6b7280' }}>เกิด {isoToThai(student.birthDate)}</span>
            )}
            {student.parentName && (
              <span style={{ fontSize: '.82rem', color: '#6b7280' }}>ผู้ปกครอง: {student.parentName}</span>
            )}
            <button type="button"
              onClick={() => {
                const classTeacher = teachers?.find(t => t.className === (student?.className ?? student?.level));
                printReport({ student, physData, growthRecords: growthData, devAssessment: devAssessData, attendanceSummary, healthServices, devDomains, teacherComments, parentComments, directorsComment, highlights, academicYear, schoolName, schoolPhilosophy, schoolVision, schoolLogo, teacherName: classTeacher?.name ?? '', directorName: schoolDirectorName || schools?.[0]?.principal || '' });
              }}
              style={{
                marginLeft: 'auto', padding: '.35rem 1rem', borderRadius: '8px', border: 'none',
                background: ACCENT, color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
              }}>
              🖨️ พิมพ์รายงาน
            </button>
          </div>

          {/* ── Section Navigation ── */}
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {SECTIONS.map(sec => {
              const isAct = activeSection === sec.id;
              return (
                <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
                  style={{
                    padding: '.35rem .85rem', borderRadius: '8px', cursor: 'pointer',
                    border: `1.5px solid ${isAct ? ACCENT : '#e5e7eb'}`,
                    background: isAct ? ACCENT : 'white', color: isAct ? 'white' : '#4b5563',
                    fontFamily: 'inherit', fontWeight: isAct ? 700 : 500, fontSize: '.82rem',
                    transition: 'all .15s',
                  }}>
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════════════════
              SECTION 1: Physical Measurements
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'physical' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '1rem' }}>
                บันทึกพัฒนาการด้านร่างกาย (น้ำหนัก/ส่วนสูง)
              </div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '.75rem' }}>
                ระดับ 3 = ดี (ตามเกณฑ์) · ระดับ 2 = พอใช้ (ค่อนข้างเกิน/ต่ำ) · ระดับ 1 = ปรับปรุง (เกิน/ต่ำกว่าเกณฑ์)
                {student.birthDate ? '' : ' · ⚠️ ไม่พบวันเกิด — ไม่สามารถคำนวณระดับอัตโนมัติ'}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: '160px' }}>การวัด</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: '140px' }}>
                        วันที่วัด<br/>
                        <span style={{ fontWeight: 400, fontSize: '.72rem', color: '#9ca3af' }}>(เดือนอ้างอิง)</span>
                      </th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '110px' }}>น้ำหนัก (กก.)</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '90px' }}>ระดับ</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '110px' }}>ส่วนสูง (ซม.)</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', width: '90px' }}>ระดับ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PHYS_KEYS.map((k, i) => {
                      const p   = physData[k] ?? { date: '', weight: '', height: '', weightLevel: 0, heightLevel: 0 };
                      const wc  = levelColor(p.weightLevel);
                      const hc  = levelColor(p.heightLevel);
                      const isT2 = i >= 2;
                      return (
                        <tr key={k} style={{ background: isT2 ? '#f0fdf4' : 'white' }}>
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', fontWeight: 700 }}>
                            {PHYS_LABELS[i]}
                            <div style={{ fontSize: '.7rem', color: '#9ca3af', fontWeight: 400 }}>
                              อ้างอิงเดือน {PHYS_MONTH_HINTS[i]}
                            </div>
                          </td>
                          <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb' }}>
                            <input type="date" value={p.date}
                              onChange={e => updatePhys(k, 'date', e.target.value)}
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem' }} />
                          </td>
                          <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={p.weight} min={0} step={0.1}
                              onChange={e => updatePhys(k, 'weight', e.target.value)}
                              placeholder="0.0"
                              style={{ width: '80px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', textAlign: 'center' }} />
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <select value={p.weightLevel}
                              onChange={e => updatePhys(k, 'weightLevel', Number(e.target.value))}
                              style={{ padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', background: wc.bg, color: wc.color, fontWeight: 700 }}>
                              <option value={0}>—</option>
                              <option value={3}>3 ดี</option>
                              <option value={2}>2 พอใช้</option>
                              <option value={1}>1 ปรับปรุง</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={p.height} min={0} step={0.1}
                              onChange={e => updatePhys(k, 'height', e.target.value)}
                              placeholder="0.0"
                              style={{ width: '80px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', textAlign: 'center' }} />
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <select value={p.heightLevel}
                              onChange={e => updatePhys(k, 'heightLevel', Number(e.target.value))}
                              style={{ padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '.8rem', background: hc.bg, color: hc.color, fontWeight: 700 }}>
                              <option value={0}>—</option>
                              <option value={3}>3 ดี</option>
                              <option value={2}>2 พอใช้</option>
                              <option value={1}>1 ปรับปรุง</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', padding: '.75rem 1rem', background: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', fontSize: '.78rem', color: '#713f12' }}>
                <strong>หมายเหตุ:</strong> ระดับคุณภาพอ้างอิงเกณฑ์มาตรฐานน้ำหนักและส่วนสูงกรมอนามัย กระทรวงสาธารณสุข พ.ศ. 2543
                — อายุ 3–6 ปี · ระบบจะคำนวณอัตโนมัติเมื่อกรอกวันที่วัดและมีวันเกิดของนักเรียน
              </div>

              {/* ── บันทึกการเจริญเติบโตรายเดือน (แนวนอน) ── */}
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', margin: '1.5rem 0 .6rem' }}>
                📈 บันทึกการเจริญเติบโตของร่างกาย
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '.8rem', minWidth: '700px' }}>
                  <thead>
                    {/* แถว 1: รายการ | ภาคเรียน 1 | ภาคเรียน 2 */}
                    <tr style={{ background: '#f3f4f6' }}>
                      <th rowSpan={2} style={{ padding: '7px 12px', border: '1px solid #e5e7eb', textAlign: 'left', minWidth: '110px' }}>รายการ</th>
                      <th colSpan={6} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#dbeafe', color: '#1e40af' }}>
                        ภาคเรียนที่ 1
                      </th>
                      <th colSpan={5} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#d1fae5', color: '#065f46' }}>
                        ภาคเรียนที่ 2
                      </th>
                    </tr>
                    {/* แถว 2: เดือน */}
                    <tr>
                      {GROWTH_MONTHS_T1.map(m => (
                        <th key={m.key} style={{ padding: '5px 8px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#eff6ff', minWidth: '62px', fontSize: '.75rem' }}>
                          {m.label}
                        </th>
                      ))}
                      {GROWTH_MONTHS_T2.map(m => (
                        <th key={m.key} style={{ padding: '5px 8px', border: '1px solid #e5e7eb', textAlign: 'center', background: '#f0fdf4', minWidth: '62px', fontSize: '.75rem' }}>
                          {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* แถวอายุ — คำนวณอัตโนมัติ */}
                    <tr>
                      <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>อายุ</td>
                      {GROWTH_MONTHS_ALL.map(m => {
                        const { ageYear, ageMonth } = ageAt(student?.birthDate, monthRefDate(m.num, academicYear));
                        return (
                          <td key={m.key} style={{ padding: '5px 4px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563', fontSize: '.72rem' }}>
                            {student?.birthDate ? `${ageYear}ปี ${ageMonth}ด.` : ''}
                          </td>
                        );
                      })}
                    </tr>
                    {/* แถวน้ำหนัก */}
                    <tr>
                      <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>น้ำหนัก (กก.)</td>
                      {GROWTH_MONTHS_ALL.map(m => {
                        const g = growthData[m.key] ?? {};
                        return (
                          <td key={m.key} style={{ padding: '3px 4px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={g.weight ?? ''} min={0} step={0.1}
                              onChange={e => updateGrowth(m.key, 'weight', e.target.value)}
                              placeholder="—"
                              style={{ width: '52px', padding: '3px 4px', border: '1px solid #d1d5db', borderRadius: '5px', fontFamily: 'inherit', fontSize: '.78rem', textAlign: 'center' }} />
                          </td>
                        );
                      })}
                    </tr>
                    {/* แถวส่วนสูง */}
                    <tr>
                      <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontWeight: 600 }}>ส่วนสูง (ซม.)</td>
                      {GROWTH_MONTHS_ALL.map(m => {
                        const g = growthData[m.key] ?? {};
                        return (
                          <td key={m.key} style={{ padding: '3px 4px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <input type="number" value={g.height ?? ''} min={0} step={0.1}
                              onChange={e => updateGrowth(m.key, 'height', e.target.value)}
                              placeholder="—"
                              style={{ width: '52px', padding: '3px 4px', border: '1px solid #d1d5db', borderRadius: '5px', fontFamily: 'inherit', fontSize: '.78rem', textAlign: 'center' }} />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '.5rem', fontSize: '.72rem', color: '#9ca3af' }}>
                อายุคำนวณอัตโนมัติจากวันเกิด ณ วันที่ 15 ของแต่ละเดือน &nbsp;·&nbsp;
                ระดับ 3 = ปกติ / ตามเกณฑ์ &nbsp;·&nbsp; ระดับ 2 = ค่อนข้างปกติ &nbsp;·&nbsp; ระดับ 1 = ไม่ปกติ ควรส่งเสริม
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 2: Attendance
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'attendance' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '1rem' }}>
                เวลามาเรียน (คิดเป็นวัน)
              </div>
              <table style={{ borderCollapse: 'collapse', fontSize: '.84rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ภาคเรียน</th>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>เวลาเรียนเต็ม</th>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>มาเรียน</th>
                    <th style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ไม่มาเรียน</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2].map(t => {
                    const a = attendanceSummary[`term${t}`] ?? {};
                    return (
                      <tr key={t}>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', fontWeight: 700 }}>ภาคเรียนที่ {t}</td>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{a.totalDays ?? 0}</td>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{a.presentDays ?? 0}</td>
                        <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{a.absentDays ?? 0}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f0fdf4', fontWeight: 800 }}>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb' }}>ตลอดปี</td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {(attendanceSummary.term1?.totalDays ?? 0) + (attendanceSummary.term2?.totalDays ?? 0)}
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#059669' }}>
                      {(attendanceSummary.term1?.presentDays ?? 0) + (attendanceSummary.term2?.presentDays ?? 0)}
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#dc2626' }}>
                      {(attendanceSummary.term1?.absentDays ?? 0) + (attendanceSummary.term2?.absentDays ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '.75rem', fontSize: '.78rem', color: '#6b7280' }}>
                ข้อมูลคำนวณจากการบันทึกการมาเรียนในระบบ (ภาคเรียน 1 = พ.ค.–ก.ย., ภาคเรียน 2 = ต.ค.–เม.ย.)
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 3: Dev Assessment — 4 Domains (อ.01 form)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'devreport' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.25rem' }}>
                บันทึกผลการประเมินพัฒนาการ (ความสามารถผู้เรียน)
              </div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                ระดับ 3 = ดี · ระดับ 2 = พอใช้ · ระดับ 1 = ปรับปรุง · สรุประดับคุณภาพคำนวณจากค่าเฉลี่ยภาคเรียนที่ 2
              </div>

              {/* ── Domain tabs ── */}
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {DEV_ASSESS_DOMAINS.map(d => {
                  const avg = devAssessDomainAvg(devAssessData, d.id);
                  const isAct = devAssessTab === d.id;
                  const lc = avg > 0 ? levelColor(avg) : { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <button key={d.id} type="button" onClick={() => setDevAssessTab(d.id)}
                      style={{
                        padding: '.35rem .9rem', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${isAct ? d.color : '#e5e7eb'}`,
                        background: isAct ? d.bg : 'white',
                        color: isAct ? d.color : '#4b5563',
                        fontFamily: 'inherit', fontWeight: isAct ? 800 : 500, fontSize: '.82rem',
                        display: 'flex', alignItems: 'center', gap: '.45rem',
                        transition: 'all .15s',
                      }}>
                      <span>{d.emoji} {d.label}</span>
                      {avg > 0 && (
                        <span style={{
                          padding: '1px 7px', borderRadius: '12px', fontSize: '.72rem',
                          fontWeight: 800, ...lc,
                        }}>{avg}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Active domain content ── */}
              {DEV_ASSESS_DOMAINS.filter(d => d.id === devAssessTab).map(domain => {
                return (
                  <div key={domain.id}>
                    {/* domain header */}
                    <div style={{
                      background: domain.bg, border: `2px solid ${domain.color}30`,
                      borderRadius: '10px', padding: '.55rem 1rem', marginBottom: '1rem',
                      fontWeight: 900, fontSize: '.88rem', color: domain.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span>{domain.emoji} พัฒนาการ{domain.label}{gradeLabelOf(student) ? ` — ${gradeLabelOf(student)}` : ''}</span>
                      <button
                        onClick={() => handleSuggestDomain(domain)}
                        style={{
                          background: domain.color, color: 'white', border: 'none',
                          borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
                          fontSize: '.75rem', fontWeight: 700, flexShrink: 0,
                        }}
                        title="แนะนำระดับจากข้อมูลประเมินผลพัฒนาการ"
                      >
                        ✨ แนะนำระดับ
                      </button>
                    </div>

                    {domain.subDomains ? (
                      // domain with sub-domains: render per-sub section
                      (() => {
                        let globalIdx = 0;
                        return domain.subDomains.map(sub => (
                          <div key={sub.key} style={{ marginBottom: '1.25rem' }}>
                            <div style={{
                              background: `${domain.color}15`, borderLeft: `4px solid ${domain.color}`,
                              borderRadius: '6px', padding: '.4rem .9rem', marginBottom: '.6rem',
                              fontWeight: 800, fontSize: '.82rem', color: domain.color,
                            }}>
                              {sub.label}
                            </div>
                            {sub.components.map(comp => {
                              const ci = globalIdx++;
                              return (
                                <CompCard
                                  key={comp.key}
                                  comp={comp}
                                  ci={ci}
                                  domain={domain}
                                  devAssessData={devAssessData}
                                  student={student}
                                  saveRec={saveRec}
                                />
                              );
                            })}
                            <SubDomainSummaryBox
                              sub={sub}
                              domainColor={domain.color}
                              devAssessData={devAssessData}
                            />
                          </div>
                        ));
                      })()
                    ) : (
                      // flat components (D1–D3)
                      domain.components.map((comp, ci) => (
                        <CompCard
                          key={comp.key}
                          comp={comp}
                          ci={ci}
                          domain={domain}
                          devAssessData={devAssessData}
                          student={student}
                          saveRec={saveRec}
                        />
                      ))
                    )}

                    {/* ── Domain-level summary ─────────────────────────── */}
                    <DomainSummaryBox
                      domain={domain}
                      domAvg={devAssessDomainAvg(devAssessData, domain.id)}
                      dsValue={devAssessData[`__domainSummary_${domain.id}`] ?? ''}
                      aiApiKey={aiApiKey}
                      loading={aiDomainLoading[domain.id] ?? false}
                      error={aiDomainError[domain.id] ?? ''}
                      onAiSummary={() => handleAIDomainSummary(domain)}
                      onSave={val => saveRec({ devAssessment: { ...devAssessData, [`__domainSummary_${domain.id}`]: val } })}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 5: Summary — 12 Standards
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'summary' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.5rem' }}>
                สรุปผลการประเมินพัฒนาการตามมาตรฐานคุณลักษณะที่พึงประสงค์การศึกษาปฐมวัย
              </div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                คำนวณจากค่าเฉลี่ยของตัวบ่งชี้ในแต่ละมาตรฐาน · สรุปตลอดปี = นำค่าภาคเรียน 2 มาหารจำนวนมาตรฐานในด้านนั้น
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '40px' }}>ลำดับ</th>
                      <th style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>มาตรฐานคุณลักษณะที่พึงประสงค์</th>
                      <th colSpan={3} style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ภาคเรียน 1</th>
                      <th colSpan={3} style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>ภาคเรียน 2</th>
                      <th style={{ padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: '70px' }}>สรุปตลอดปี</th>
                    </tr>
                    <tr style={{ background: '#f9fafb', fontSize: '.72rem' }}>
                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}></th>
                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}></th>
                      {[1,2,3].map(n => (
                        <th key={`t1-${n}`} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '36px', ...levelColor(n) }}>{n}</th>
                      ))}
                      {[1,2,3].map(n => (
                        <th key={`t2-${n}`} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', width: '36px', ...levelColor(n) }}>{n}</th>
                      ))}
                      <th style={{ padding: '4px 8px', border: '1px solid #e5e7eb' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {devDomains.map(domain => {
                      const domainT2Scores = domain.standards.flatMap(std =>
                        std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null)
                      );
                      const domainYearly = domainT2Scores.length
                        ? Math.round(domainT2Scores.reduce((a,b)=>a+b,0)/domainT2Scores.length)
                        : null;
                      return [
                        <tr key={`dom-${domain.id}`} style={{ background: domain.bg }}>
                          <td colSpan={8} style={{ padding: '5px 10px', border: '1px solid #e5e7eb', fontWeight: 900, fontSize: '.82rem', color: domain.color }}>
                            {domain.emoji} ด้าน{domain.label}
                          </td>
                          <td style={{ padding: '5px 10px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 900, fontSize: '.82rem', color: domain.color,
                            ...(domainYearly ? levelColor(domainYearly) : {}) }}>
                            {domainYearly ?? '—'}
                          </td>
                        </tr>,
                        ...domain.standards.map((std, si) => {
                          const t1Scores = std.indicators.map(ind => ind.indScores.term1).filter(v => v !== null);
                          const t2Scores = std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null);
                          const t1 = t1Scores.length ? Math.round(t1Scores.reduce((a,b)=>a+b,0)/t1Scores.length) : null;
                          const t2 = t2Scores.length ? Math.round(t2Scores.reduce((a,b)=>a+b,0)/t2Scores.length) : null;
                          return (
                            <tr key={`std-${std.id}`} style={{ background: si % 2 === 0 ? 'white' : '#fafafa' }}>
                              <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, color: '#6b7280' }}>{std.stdNo ?? ''}</td>
                              <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontSize: '.78rem' }}>{std.title}</td>
                              {[3,2,1].map(n => (
                                <td key={`r1-${n}`} style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, ...( t1 === n ? levelColor(n) : {}) }}>
                                  {t1 === n ? '✓' : ''}
                                </td>
                              ))}
                              {[3,2,1].map(n => (
                                <td key={`r2-${n}`} style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, ...( t2 === n ? levelColor(n) : {}) }}>
                                  {t2 === n ? '✓' : ''}
                                </td>
                              ))}
                              <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 800, ...(t2 ? levelColor(t2) : {}) }}>
                                {t2 ?? '—'}
                              </td>
                            </tr>
                          );
                        }),
                      ];
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 6: 4-Domain Yearly Summary + Criteria
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'domain4' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '1rem' }}>
                ผลการประเมินความพร้อมด้านพัฒนาการทั้ง 4 ด้าน ตลอดปีการศึกษา
              </div>

              {/* ── 4-Domain summary table + bar chart ── */}
              <DomainSummarySection devDomains={devDomains} academicYear={academicYear} />


              {/* ── เกณฑ์สรุปผลการตัดสิน ── */}
              <div style={{
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.1rem 1.25rem',
                background: '#fafafa',
              }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#111', marginBottom: '1rem' }}>
                  เกณฑ์สรุปผลการตัดสิน
                </div>
                {[
                  { n: 3, label: 'ดี', desc: 'ผ่านเกณฑ์การประเมินในระดับดี มีพัฒนาการสูงกว่าหรือเป็นไปตามเกณฑ์มาตรฐาน' },
                  { n: 2, label: 'พอใช้', desc: 'ผ่านเกณฑ์การประเมินในระดับพอใช้ มีพัฒนาการเป็นไปตามเกณฑ์แต่ควรได้รับการส่งเสริมบางส่วน' },
                  { n: 1, label: 'ควรส่งเสริม', desc: 'ยังไม่ผ่านเกณฑ์การประเมินในบางรายการ ควรได้รับการดูแลช่วยเหลือเป็นพิเศษ' },
                ].map(({ n, label, desc }) => {
                  const lc = levelColor(n);
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem', marginBottom: '.75rem' }}>
                      <span style={{
                        flexShrink: 0,
                        background: lc.bg, color: lc.color,
                        borderRadius: '8px', padding: '3px 12px',
                        fontWeight: 800, fontSize: '.82rem',
                        border: `1.5px solid ${lc.color}55`,
                        whiteSpace: 'nowrap',
                      }}>
                        ระดับ {n} ({label})
                      </span>
                      <span style={{ fontSize: '.84rem', color: '#374151', lineHeight: 1.7, paddingTop: '2px' }}>
                        {desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 6b: จุดเด่นและความสามารถผู้เรียน (ทั้ง 2 ภาคเรียน)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'highlights' && (
            <HighlightsSection
              devDomains={devDomains}
              highlights={highlights}
              saveHighlight={saveHighlight}
            />
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 7: Comments (Teacher / Parent / Director)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Teacher Comments */}
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1d4ed8', marginBottom: '1rem' }}>
                  🧑‍🏫 ความคิดเห็นของครู
                </div>
                {[1, 2].map(t => {
                  const topicScores = assessmentTopics?.map(topic => {
                    const inds = indicators.filter(i => i.domainId === topic.id);
                    const scores = inds.flatMap(ind =>
                      activities.filter(a => a.indicatorId === ind.id)
                        .map(act => student?.assessments?.indicators?.[ind.id]?.[act.id]?.score ?? null)
                    ).filter(v => v !== null);
                    return { label: topic.label, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
                  }) ?? [];

                  const handleAiComment = async () => {
                    if (!aiApiKey || !student) return;
                    setAiCommentLoading(p => ({ ...p, [t]: true }));
                    setAiCommentError(p => ({ ...p, [t]: '' }));
                    try {
                      const result = await callClaude(aiApiKey, buildTeacherCommentPrompt(student, topicScores, t));
                      saveRec({ teacherComments: { ...teacherComments, [`term${t}`]: result } });
                    } catch (e) {
                      setAiCommentError(p => ({ ...p, [t]: e.message }));
                    } finally {
                      setAiCommentLoading(p => ({ ...p, [t]: false }));
                    }
                  };

                  return (
                    <div key={t} style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#374151' }}>ภาคเรียนที่ {t}</div>
                        {aiApiKey && student && (
                          <button type="button" onClick={handleAiComment} disabled={aiCommentLoading[t]}
                            style={{
                              padding: '.2rem .65rem', borderRadius: '6px', border: 'none',
                              background: '#dbeafe', color: '#1d4ed8', fontFamily: 'inherit',
                              fontWeight: 700, fontSize: '.75rem', cursor: aiCommentLoading[t] ? 'wait' : 'pointer',
                            }}>
                            {aiCommentLoading[t] ? '⏳ กำลังเขียน…' : '✨ AI ช่วยเขียน'}
                          </button>
                        )}
                      </div>
                      {aiCommentError[t] && (
                        <div style={{ fontSize: '.78rem', color: '#dc2626', marginBottom: '.3rem' }}>❌ {aiCommentError[t]}</div>
                      )}
                      <textarea
                        value={teacherComments[`term${t}`]}
                        onChange={e => saveRec({ teacherComments: { ...teacherComments, [`term${t}`]: e.target.value } })}
                        rows={4}
                        placeholder={`บันทึกความคิดเห็นของครูประจำชั้น ภาคเรียนที่ ${t}...`}
                        style={{
                          width: '100%', padding: '8px 10px', border: '1px solid #93c5fd',
                          borderRadius: '8px', fontFamily: 'inherit', fontSize: '.82rem',
                          resize: 'vertical', boxSizing: 'border-box', background: 'white',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '3rem', marginTop: '.5rem', fontSize: '.75rem', color: '#6b7280' }}>
                        <span>ลงชื่อ _________________________ (ครูประจำชั้น)</span>
                        <span>_________________________ ผู้อำนวยการ</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Parent Comments — removed input; data stored via ParentView */}

              {/* Director's Comment — removed input; data stored via Admin panel */}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 7: Philosophy & Vision (static)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'philosophy' && (
            <div>
              {/* Philosophy */}
              <div style={{
                background: '#fefce8', border: '2px solid #fde047',
                borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
              }}>
                <div style={{ fontWeight: 900, fontSize: '.95rem', color: '#713f12', textAlign: 'center', marginBottom: '.75rem', letterSpacing: '.04em' }}>
                  ปรัชญาการศึกษาปฐมวัย
                </div>
                <p style={{ fontSize: '.85rem', color: '#374151', lineHeight: 1.9, margin: 0, textAlign: 'justify', textIndent: '2em' }}>
                  {schoolPhilosophy?.trim() || PHILOSOPHY_TEXT}
                </p>
              </div>

              {/* Vision */}
              <div style={{
                background: '#f0fdf4', border: '2px solid #86efac',
                borderRadius: '12px', padding: '1.25rem 1.5rem',
              }}>
                <div style={{ fontWeight: 900, fontSize: '.95rem', color: '#15803d', textAlign: 'center', marginBottom: '.75rem', letterSpacing: '.04em' }}>
                  วิสัยทัศน์
                </div>
                <p style={{ fontSize: '.85rem', color: '#374151', lineHeight: 1.9, margin: 0, textAlign: 'justify', textIndent: '2em' }}>
                  {schoolVision?.trim() || VISION_TEXT}
                </p>
              </div>

              <div style={{ marginTop: '.75rem', fontSize: '.72rem', color: '#9ca3af', textAlign: 'center' }}>
                ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2568
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 8: Growth Standard Table (กรมอนามัย พ.ศ. 2543)
          ══════════════════════════════════════════════════════════ */}
          {activeSection === 'growthtable' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#111', marginBottom: '.25rem' }}>
                ตารางแสดงการเจริญเติบโตของเพศชายและหญิง อายุ 3–6 ปี
              </div>
              <div style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: '.75rem' }}>
                กองโภชนาการ กรมอนามัย กระทรวงสาธารณสุข พ.ศ. 2543 · ตั้งแต่ = –2SD · จนถึง = +2SD
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '.76rem', width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#1e3a5f', color: 'white' }}>
                      <th rowSpan={3} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>ปี</th>
                      <th rowSpan={3} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>เดือน</th>
                      <th colSpan={4} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>น้ำหนักมาตรฐาน (กิโลกรัม)</th>
                      <th colSpan={4} style={{ padding: '6px 10px', border: '1px solid #374151', textAlign: 'center' }}>ส่วนสูงมาตรฐาน (เซนติเมตร)</th>
                    </tr>
                    <tr style={{ background: '#1e3a5f', color: 'white' }}>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>ชาย</th>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>หญิง</th>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>ชาย</th>
                      <th colSpan={2} style={{ padding: '4px 8px', border: '1px solid #374151', textAlign: 'center' }}>หญิง</th>
                    </tr>
                    <tr style={{ background: '#2d4a6e', color: '#e5e7eb', fontSize: '.7rem' }}>
                      {['ตั้งแต่','จนถึง','ตั้งแต่','จนถึง','ตั้งแต่','จนถึง','ตั้งแต่','จนถึง'].map((l,i) => (
                        <th key={i} style={{ padding: '3px 6px', border: '1px solid #374151', textAlign: 'center', fontWeight: 500 }}>{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GROWTH_ROWS.map((r, idx) => {
                      const isFirstOfYear = r.month === 0;
                      return (
                        <tr key={idx} style={{ background: isFirstOfYear ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: isFirstOfYear ? 800 : 400 }}>{r.month === 0 ? r.year : ''}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.month}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bwl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bwh}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.gwl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.gwh}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bhl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.bhh}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.ghl}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{r.ghh}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{
                marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap',
                padding: '.75rem 1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '.78rem',
              }}>
                <div><strong>น้ำหนักตามเกณฑ์อายุ:</strong> ดัชนีบ่งชี้ภาวะโภชนาการที่เป็นอยู่ปัจจุบัน</div>
                <div><strong>ส่วนสูงตามเกณฑ์อายุ:</strong> ดัชนีบ่งชี้ภาวะโภชนาการระยะยาว (การเจริญเติบโตทางโครงสร้าง)</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
