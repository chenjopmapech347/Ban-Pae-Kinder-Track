import { useState, lazy, Suspense } from 'react';
import DashboardSidebar from '../components/ui/DashboardSidebar';

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
const MediaBorrowTab         = lazy(() => import('../components/admin/MediaBorrowTab'));
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
const MeasurementDatesTab    = lazy(() => import('../components/admin/MeasurementDatesTab'));
const SystemLogTab           = lazy(() => import('../components/admin/SystemLogTab'));

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
      { id: 'attendance',   label: '✅ การมาเรียน'        },
      { id: 'pickup',       label: '🚗 รับกลับบ้าน'       },
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
      { id: 'studentreport', label: '📒 สมุดรายงาน อ.01'       },
      { id: 'evaluation',    label: '📊 ประเมินพัฒนาการ'        },
      { id: 'reports',       label: '📈 รายงานสรุปการประเมิน'  },
      { id: 'activitylog',   label: '📜 ประวัติการประเมิน'      },
      { id: 'nationalstd',   label: '🏛 มาตรฐานแห่งชาติ'       },
    ],
  },
  {
    label: 'บุคลากรและสื่อ',
    color: '#059669',
    tabs: [
      { id: 'students',    label: '👶 นักเรียน'               },
      { id: 'classassign', label: '🚪 จัดนักเรียนเข้าห้อง'   },
      { id: 'teachers',    label: '👩‍🏫 ครู'                   },
      { id: 'classes',     label: '🏫 ห้องเรียน'              },
      { id: 'media',       label: '📚 ทะเบียนผลิตสื่อ'        },
      { id: 'mediaborrow', label: '🔄 ยืม-คืนสื่อ'             },
      { id: 'corner',      label: '🌿 แหล่งเรียนรู้นอกห้อง'  },
      { id: 'innercorner', label: '🏡 มุมประสบการณ์ในห้อง'   },
      { id: 'devreport',   label: '📑 รายงานพัฒนาการ'         },
    ],
  },
  {
    label: 'ตั้งค่าระบบ',
    color: '#6b7280',
    tabs: [
      { id: 'schools',    label: '🏛️ โรงเรียน'           },
      { id: 'topics',     label: '📝 หัวข้อประเมิน'      },
      { id: 'indicators', label: '🔬 ตัวบ่งชี้'           },
      { id: 'activities', label: '🎯 กิจกรรม'             },
      { id: 'terms',      label: '📅 ภาคเรียน'            },
      { id: 'holidays',   label: '🏖️ วันหยุด'             },
      { id: 'standards',        label: '🗺️ มาตรฐานปฐมวัย'           },
      { id: 'measurementdates', label: '📏 วันวัดน้ำหนัก/ส่วนสูง' },
      { id: 'systemlog',        label: '📋 บันทึกการใช้งานระบบ'    },
    ],
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="animate-fade" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

      {/* ── Left sidebar ── */}
      <DashboardSidebar
        groups={TAB_GROUPS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '.9rem' }}>
            กำลังโหลด…
          </div>
        }>
          {activeTab === 'overview'       && <OverviewTab />}
          {activeTab === 'announcements'  && <AnnouncementsTab />}
          {activeTab === 'aichat'         && <AIChatTab />}
          {activeTab === 'attendance'     && <AttendanceTab />}
          {activeTab === 'pickup'         && <PickupTab />}
          {activeTab === 'healthcheck'    && <HealthCheckTab />}
          {activeTab === 'illnesscheck'   && <IllnessCheckTab />}
          {activeTab === 'toothbrush'     && <ToothBrushTab />}
          {activeTab === 'lunch'          && <LunchTab />}
          {activeTab === 'milk'           && <MilkTab />}
          {activeTab === 'nutrition'      && <NutritionTab />}
          {activeTab === 'studentreport'  && <StudentReportTab />}
          {activeTab === 'evaluation'     && <EvaluationTab />}
          {activeTab === 'reports'        && <ReportsTab />}
          {activeTab === 'activitylog'    && <ActivityLogTab />}
          {activeTab === 'nationalstd'    && <NationalStandardsTab />}
          {activeTab === 'students'       && <StudentsTab />}
          {activeTab === 'classassign'    && <ClassAssignTab />}
          {activeTab === 'teachers'       && <TeachersTab />}
          {activeTab === 'classes'        && <ClassesTab />}
          {activeTab === 'media'          && <MediaTab viewMode="entry" />}
          {activeTab === 'mediaborrow'    && <MediaBorrowTab />}
          {activeTab === 'corner'         && <CornerTab />}
          {activeTab === 'innercorner'    && <InnerCornerTab />}
          {activeTab === 'devreport'      && <DevelopmentalReportTab />}
          {activeTab === 'schools'        && <SchoolsTab />}
          {activeTab === 'topics'         && <TopicsTab />}
          {activeTab === 'indicators'     && <IndicatorsTab />}
          {activeTab === 'activities'     && <ActivitiesTab />}
          {activeTab === 'terms'          && <TermsTab />}
          {activeTab === 'holidays'       && <HolidaysTab />}
          {activeTab === 'standards'        && <StandardsMapTab />}
          {activeTab === 'measurementdates' && <MeasurementDatesTab />}
          {activeTab === 'systemlog'        && <SystemLogTab />}
        </Suspense>
      </div>
    </div>
  );
}
