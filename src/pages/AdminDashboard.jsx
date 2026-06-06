import { useState } from 'react';
import QaStandardView  from '../components/QaStandardView';
import OverviewTab     from '../components/admin/OverviewTab';
import StudentsTab     from '../components/admin/StudentsTab';
import TeachersTab     from '../components/admin/TeachersTab';
import ClassesTab      from '../components/admin/ClassesTab';
import HolidaysTab     from '../components/admin/HolidaysTab';
import TopicsTab       from '../components/admin/TopicsTab';
import SchoolsTab      from '../components/admin/SchoolsTab';
import ReportsTab      from '../components/admin/ReportsTab';
import IndicatorsTab   from '../components/admin/IndicatorsTab';
import ActivitiesTab      from '../components/admin/ActivitiesTab';
import StandardsMapTab    from '../components/admin/StandardsMapTab';
import TermsTab           from '../components/admin/TermsTab';
import EvaluationTab     from '../components/admin/EvaluationTab';
import ActivityLogTab         from '../components/admin/ActivityLogTab';
import AttendanceTab         from '../components/admin/AttendanceTab';
import PickupTab             from '../components/admin/PickupTab';
import NationalStandardsTab  from '../components/admin/NationalStandardsTab';

const TAB_GROUPS = [
  {
    label: 'รายงาน',
    color: '#7c3aed',
    tabs: [
      { id: 'overview',    label: '🏠 ภาพรวม'           },
      { id: 'attendance',  label: '📅 การมาเรียน'        },
      { id: 'pickup',      label: '🏠 รับกลับบ้าน'       },
      { id: 'evaluation',  label: '📊 ประเมินผล'         },
      { id: 'reports',     label: '📋 รายงานสรุป'        },
      { id: 'activitylog',   label: '📜 ประวัติการประเมิน' },
      { id: 'nationalstd',   label: '🏛 มาตรฐานแห่งชาติ' },
    ],
  },
  {
    label: 'บุคลากร',
    color: '#0891b2',
    tabs: [
      { id: 'students',    label: '👶 นักเรียน'   },
      { id: 'teachers',    label: '👩‍🏫 ครู'        },
      { id: 'classes',     label: '🏫 ห้องเรียน'  },
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
      { id: 'standards',   label: '🗺️ มาตรฐานปฐมวัย'   },
      { id: 'qa',          label: '🛡️ QA'               },
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
      {activeTab === 'overview'   && <OverviewTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'pickup'     && <PickupTab />}
      {activeTab === 'students'   && <StudentsTab />}
      {activeTab === 'teachers'   && <TeachersTab />}
      {activeTab === 'classes'     && <ClassesTab />}
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
      {activeTab === 'qa'         && (
        <div className="glass p-6 animate-fade">
          <h3 className="mb-6">🛡️ สรุปมาตรฐานสถานพัฒนาเด็กปฐมวัย (ปี 2569)</h3>
          <QaStandardView />
        </div>
      )}
    </div>
  );
}
