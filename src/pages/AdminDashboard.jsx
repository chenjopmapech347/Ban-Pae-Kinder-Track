import { useState, lazy, Suspense } from 'react';
import DashboardSidebar from '../components/ui/DashboardSidebar';
import ErrorBoundary from '../components/ui/ErrorBoundary';

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
const DailyRoutineTab        = lazy(() => import('../components/admin/DailyRoutineTab'));
const SpecialEventTab        = lazy(() => import('../components/admin/SpecialEventTab'));
const StudentReportTab       = lazy(() => import('../components/admin/StudentReportTab'));
const AIChatTab              = lazy(() => import('../components/AIChatTab'));
const ClassAssignTab         = lazy(() => import('../components/admin/ClassAssignTab'));
const MeasurementDatesTab    = lazy(() => import('../components/admin/MeasurementDatesTab'));
const ActivityScheduleTab    = lazy(() => import('../components/admin/ActivityScheduleTab'));
const SystemLogTab           = lazy(() => import('../components/admin/SystemLogTab'));
const HelpTab                = lazy(() => import('../components/admin/HelpTab'));

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
      { id: 'attendance',   label: '✅ การมาเรียน'        },  // เช้า — เช็คชื่อ
      { id: 'healthcheck',  label: '🏥 ตรวจสุขภาพ'        },  // เช้า — ตรวจสุขภาพ
      { id: 'illnesscheck', label: '🤒 คัดกรองอาการป่วย'  },  // เช้า — คัดกรอง
      { id: 'milk',          label: '🥛 ดื่มนม'            },  // เช้า — นมเช้า
      { id: 'dailyroutine',  label: '🗓️ กิจกรรมประจำวัน'  },  // ระหว่างวัน
      { id: 'lunch',         label: '🍱 อาหารกลางวัน'     },  // กลางวัน
      { id: 'toothbrush',    label: '🪥 แปรงฟัน'           },  // หลังอาหาร
      { id: 'nutrition',     label: '⚖️ ภาวะโภชนาการ'     },  // ตามโอกาส
      { id: 'specialevent',  label: '🎉 กิจกรรมวันสำคัญ'  },  // ตามโอกาส
      { id: 'pickup',        label: '🚗 รับกลับบ้าน'      },  // บ่าย — รับกลับ
    ],
  },
  {
    label: 'รายงานและประเมินผล',
    color: '#4f46e5',
    tabs: [
      { id: 'evaluation',    label: '📊 ประเมินพัฒนาการ'        },  // 1. ลงมือประเมิน
      { id: 'activitylog',   label: '📜 ประวัติการประเมิน'      },  // 2. ดูประวัติ
      { id: 'reports',       label: '📈 รายงานสรุปการประเมิน'  },  // 3. รายงานสรุป
      { id: 'studentreport', label: '📒 สมุดรายงาน อ.01'       },  // 4. ผลลัพธ์สุดท้าย
      { id: 'nationalstd',   label: '🏛 มาตรฐานแห่งชาติ'       },  // 5. อ้างอิง
    ],
  },
  {
    label: 'บุคลากรและสื่อ',
    color: '#059669',
    tabs: [
      { id: 'students',    label: '👶 นักเรียน'               },  // ข้อมูลนักเรียน
      { id: 'classassign', label: '🚪 จัดนักเรียนเข้าห้อง'   },  // จัดห้อง
      { id: 'classes',     label: '🏫 ห้องเรียน'              },  // ห้องเรียน
      { id: 'teachers',    label: '👩‍🏫 ครู'                   },  // บุคลากร
      { id: 'innercorner', label: '🏡 มุมประสบการณ์ในห้อง'   },  // พื้นที่เรียนรู้
      { id: 'corner',      label: '🌿 แหล่งเรียนรู้นอกห้อง'  },  // พื้นที่เรียนรู้
      { id: 'media',       label: '📚 ทะเบียนผลิตสื่อ'        },  // สื่อ
      { id: 'mediaborrow', label: '🔄 ยืม-คืนสื่อ'            },  // ยืม-คืน
      { id: 'devreport',   label: '📑 รายงานพัฒนาการ'         },  // รายงาน
    ],
  },
  {
    label: 'ตั้งค่าระบบ',
    color: '#6b7280',
    tabs: [
      { id: 'schools',           label: '🏛️ โรงเรียน'                  },  // ตั้งค่าพื้นฐาน
      { id: 'terms',             label: '📅 ภาคเรียน'                   },  // กรอบเวลา
      { id: 'holidays',          label: '🏖️ วันหยุด'                    },  // ปฏิทิน
      { id: 'activities',        label: '🎯 กิจกรรม'                    },  // กิจกรรม
      { id: 'activityschedule',  label: '🗓️ กิจกรรมภายใน-นอกห้องเรียน' },  // ตารางกิจกรรม
      { id: 'topics',            label: '📝 หัวข้อประเมิน'             },  // กรอบการประเมิน
      { id: 'indicators',        label: '🔬 ตัวบ่งชี้'                  },  // ตัวบ่งชี้
      { id: 'standards',         label: '🗺️ มาตรฐานปฐมวัย'            },  // มาตรฐาน
      { id: 'measurementdates',  label: '📏 เดือนวัดน้ำหนัก/ส่วนสูง'  },  // วัดผล
      { id: 'systemlog',         label: '📋 บันทึกการใช้งานระบบ'        },  // ติดตาม
    ],
  },
  {
    label: 'ช่วยเหลือ',
    color: '#7c3aed',
    tabs: [
      { id: 'help', label: '📖 คู่มือการใช้งาน' },
    ],
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('kt_adminTab') || 'overview');

  return (
    <div className="animate-fade" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

      {/* ── Left sidebar ── */}
      <DashboardSidebar
        groups={TAB_GROUPS}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); localStorage.setItem('kt_adminTab', tab); }}
      />

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ErrorBoundary>
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
          {activeTab === 'dailyroutine'   && <DailyRoutineTab />}
          {activeTab === 'specialevent'   && <SpecialEventTab />}
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
          {activeTab === 'measurementdates'  && <MeasurementDatesTab />}
          {activeTab === 'activityschedule' && <ActivityScheduleTab />}
          {activeTab === 'systemlog'        && <SystemLogTab />}
          {activeTab === 'help'             && <HelpTab />}
        </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
