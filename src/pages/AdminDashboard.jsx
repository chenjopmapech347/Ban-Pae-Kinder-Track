import { useState, lazy, Suspense } from 'react';

const OverviewTab            = lazy(() => import('../components/admin/OverviewTab'));
const StudentsTab            = lazy(() => import('../components/admin/StudentsTab'));
const TeachersTab            = lazy(() => import('../components/admin/TeachersTab'));
const ClassesTab             = lazy(() => import('../components/admin/ClassesTab'));
const HolidaysTab            = lazy(() => import('../components/admin/HolidaysTab'));
const TopicsTab              = lazy(() => import('../components/admin/TopicsTab'));
const SchoolsTab             = lazy(() => import('../components/admin/SchoolsTab'));
const ReportsTab             = lazy(() => import('../components/admin/ReportsTab'));
const IndicatorsTab          = lazy(() => import('../components/admin/IndicatorsTab'));
const ActivitiesTab          = lazy(() => import('../components/admin/ActivitiesTab'));
const StandardsMapTab        = lazy(() => import('../components/admin/StandardsMapTab'));
const TermsTab               = lazy(() => import('../components/admin/TermsTab'));
const EvaluationTab          = lazy(() => import('../components/admin/EvaluationTab'));
const ActivityLogTab         = lazy(() => import('../components/admin/ActivityLogTab'));
const AttendanceTab          = lazy(() => import('../components/admin/AttendanceTab'));
const PickupTab              = lazy(() => import('../components/admin/PickupTab'));
const NationalStandardsTab   = lazy(() => import('../components/admin/NationalStandardsTab'));
const AnnouncementsTab       = lazy(() => import('../components/admin/AnnouncementsTab'));
const MediaTab               = lazy(() => import('../components/admin/MediaTab'));
const CornerTab              = lazy(() => import('../components/admin/CornerTab'));
const InnerCornerTab         = lazy(() => import('../components/admin/InnerCornerTab'));
const DevelopmentalReportTab = lazy(() => import('../components/admin/DevelopmentalReportTab'));
const HealthCheckTab         = lazy(() => import('../components/admin/HealthCheckTab'));
const IllnessCheckTab        = lazy(() => import('../components/admin/IllnessCheckTab'));
const ToothBrushTab          = lazy(() => import('../components/admin/ToothBrushTab'));
const LunchTab               = lazy(() => import('../components/admin/LunchTab'));
const MilkTab                = lazy(() => import('../components/admin/MilkTab'));
const NutritionTab           = lazy(() => import('../components/admin/NutritionTab'));
const StudentReportTab       = lazy(() => import('../components/admin/StudentReportTab'));
const AIChatTab              = lazy(() => import('../components/AIChatTab'));
const ClassAssignTab         = lazy(() => import('../components/admin/ClassAssignTab'));

const TAB_GROUPS = [
  {
    label: 'ภาพรวม',
    color: '#7c3aed',
    tabs: [
      { id: 'overview',      label: '🏠 ภาพรวม'     },
      { id: 'announcements', label: '📢 ประกาศ'      },
      { id: 'aichat',        label: '🤖 AI ผู้ช่วย' },
    ],
  },
  {
    label: 'กิจกรรมประจำวัน',
    color: '#0891b2',
    tabs: [
      { id: 'attendance',   label: '📅 การมาเรียน'        },
      { id: 'pickup',       label: '🏠 รับกลับบ้าน'       },
      { id: 'healthcheck',  label: '🏥 ตรวจสุขภาพ'        },
      { id: 'illnesscheck', label: '🤒 คัดกรองอาการป่วย'  },
      { id: 'toothbrush',   label: '🪥 แปรงฟัน'           },
      { id: 'lunch',        label: '🍱 อาหารกลางวัน'      },
      { id: 'milk',         label: '🥛 ดื่มนม'             },
      { id: 'nutrition',    label: '⚖️ ภาวะโภชนาการ'      },
    ],
  },
  {
    label: 'รายงานและประเมินผล',
    color: '#4f46e5',
    tabs: [
      { id: 'studentreport', label: '📒 สมุดรายงานประจำตัวเด็กปฐมวัย (อ.01)' },
      { id: 'evaluation',    label: '📊 ประเมินผล'                             },
      { id: 'reports',       label: '📋 รายงานสรุปการประเมินผล'               },
      { id: 'activitylog',   label: '📜 ประวัติการประเมิน'                    },
      { id: 'nationalstd',   label: '🏛 มาตรฐานแห่งชาติ'                     },
    ],
  },
  {
    label: 'บุคลากรและสื่อ',
    color: '#059669',
    tabs: [
      { id: 'students',    label: '👶 นักเรียน'                },
      { id: 'classassign', label: '🚪 จัดนักเรียนเข้าห้อง'    },
      { id: 'teachers',    label: '👩‍🏫 ครู'                    },
      { id: 'classes',     label: '🏫 ห้องเรียน'               },
      { id: 'media',       label: '📚 ทะเบียนผลิตสื่อ'         },
      { id: 'corner',      label: '🌿 แหล่งเรียนรู้นอกห้อง'   },
      { id: 'innercorner', label: '🏠 มุมประสบการณ์ในห้อง'    },
      { id: 'devreport',   label: '📋 รายงานพัฒนาการ'          },
    ],
  },
  {
    label: 'ตั้งค่าระบบ',
    color: '#6b7280',
    tabs: [
      { id: 'schools',     label: '🏛️ โรงเรียน'        },
      { id: 'topics',      label: '📝 หัวข้อประเมิน'   },
      { id: 'indicators',  label: '🔬 ตัวบ่งชี้'        },
      { id: 'activities',  label: '🎯 กิจกรรม'          },
      { id: 'terms',       label: '📅 ภาคเรียน'         },
      { id: 'holidays',    label: '🏖️ วันหยุด'          },
      { id: 'standards',   label: '🗺️ มาตรฐานการศึกษาปฐมวัย' },
    ],
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="animate-fade">
      <div className="page-header mb-4">
        <h2>🛡️ ระบบจัดการ (Admin)</h2>
      </div>

      {/* ── Tab Navigation — 3 rows ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '.35rem',
        marginBottom: '1.5rem',
        background: '#f9fafb', borderRadius: '16px',
        padding: '.75rem 1rem', border: '1px solid #e5e7eb',
      }}>
        {TAB_GROUPS.map(group => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexWrap: 'wrap' }}>
            {/* Group label */}
            <span style={{
              fontSize: '.65rem', fontWeight: 800, color: group.color,
              textTransform: 'uppercase', letterSpacing: '.06em',
              minWidth: '68px', textAlign: 'right', paddingRight: '.5rem',
              borderRight: `2px solid ${group.color}40`, flexShrink: 0,
              lineHeight: 1,
            }}>
              {group.label}
            </span>
            {/* Tabs */}
            {group.tabs.map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '.32rem .75rem',
                    borderRadius: '8px',
                    border: isActive ? `1.5px solid ${group.color}` : '1.5px solid transparent',
                    background: isActive ? group.color : 'white',
                    color: isActive ? 'white' : '#4b5563',
                    fontFamily: 'inherit',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '.8rem',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    boxShadow: isActive ? `0 2px 8px ${group.color}35` : '0 1px 2px rgba(0,0,0,.05)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${group.color}12`; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <Suspense fallback={<div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af' }}>กำลังโหลด…</div>}>
      {activeTab === 'overview'      && <OverviewTab />}
      {activeTab === 'announcements' && <AnnouncementsTab />}
      {activeTab === 'attendance'  && <AttendanceTab />}
      {activeTab === 'pickup'      && <PickupTab />}
      {activeTab === 'healthcheck'  && <HealthCheckTab />}
      {activeTab === 'illnesscheck' && <IllnessCheckTab />}
      {activeTab === 'toothbrush'   && <ToothBrushTab />}
      {activeTab === 'lunch'        && <LunchTab />}
      {activeTab === 'milk'         && <MilkTab />}
      {activeTab === 'nutrition'    && <NutritionTab />}
      {activeTab === 'studentreport' && <StudentReportTab />}
      {activeTab === 'students'     && <StudentsTab />}
      {activeTab === 'classassign'  && <ClassAssignTab />}
      {activeTab === 'teachers'   && <TeachersTab />}
      {activeTab === 'classes'     && <ClassesTab />}
      {activeTab === 'media'       && <MediaTab viewMode="entry" />}
      {activeTab === 'corner'      && <CornerTab />}
      {activeTab === 'innercorner' && <InnerCornerTab />}
      {activeTab === 'devreport'   && <DevelopmentalReportTab />}
      {activeTab === 'evaluation'  && <EvaluationTab />}
      {activeTab === 'reports'     && <ReportsTab />}
      {activeTab === 'activitylog'  && <ActivityLogTab />}
      {activeTab === 'nationalstd'  && <NationalStandardsTab />}
      {activeTab === 'schools'     && <SchoolsTab />}
      {activeTab === 'topics'     && <TopicsTab />}
      {activeTab === 'indicators' && <IndicatorsTab />}
      {activeTab === 'activities' && <ActivitiesTab />}
      {activeTab === 'holidays'   && <HolidaysTab />}
      {activeTab === 'standards'  && <StandardsMapTab />}
      {activeTab === 'terms'      && <TermsTab />}
      {activeTab === 'aichat'     && <AIChatTab />}
      </Suspense>
    </div>
  );
}
