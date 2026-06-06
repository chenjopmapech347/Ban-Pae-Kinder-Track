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
import ActivityLogTab    from '../components/admin/ActivityLogTab';

const TAB_GROUPS = [
  {
    label: 'ข้อมูลหลัก',
    tabs: [
      { id: 'overview',    label: '🏠 ภาพรวม'     },
      { id: 'students',    label: '👶 นักเรียน'    },
      { id: 'teachers',    label: '👩‍🏫 ครู'        },
      { id: 'classes',     label: '🏫 ห้องเรียน'   },
      { id: 'evaluation',  label: '📊 ประเมินผล'   },
      { id: 'reports',     label: '📋 สรุปการประเมินผล' },
      { id: 'activitylog', label: '📜 ประวัติการประเมิน' },
    ],
  },
  {
    label: 'ตั้งค่าระบบ',
    tabs: [
      { id: 'schools',     label: '🏫 โรงเรียน'      },
      { id: 'topics',      label: '📝 หัวข้อประเมิน'  },
      { id: 'indicators',  label: '📋 ตัวบ่งชี้'      },
      { id: 'activities',  label: '🎯 กิจกรรม'        },
      { id: 'holidays',    label: '🏖️ วันหยุด'        },
      { id: 'qa',          label: '🛡️ QA'             },
      { id: 'standards',    label: '📋 มาตรฐานปฐมวัย'   },
      { id: 'terms',        label: '📅 ภาคเรียน'         },
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

      {/* ── Tab Navigation — 2 rows ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginBottom: '1.5rem' }}>
        {TAB_GROUPS.map(group => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '.68rem', fontWeight: 800, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '.05em',
              minWidth: '72px', textAlign: 'right', paddingRight: '.5rem',
              borderRight: '2px solid #e5e7eb', flexShrink: 0,
            }}>
              {group.label}
            </span>
            {group.tabs.map(t => (
              <button
                key={t.id}
                type="button"
                className={'tab-btn' + (activeTab === t.id ? ' active' : '')}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'overview'   && <OverviewTab />}
      {activeTab === 'students'   && <StudentsTab />}
      {activeTab === 'teachers'   && <TeachersTab />}
      {activeTab === 'classes'     && <ClassesTab />}
      {activeTab === 'evaluation'  && <EvaluationTab />}
      {activeTab === 'reports'     && <ReportsTab />}
      {activeTab === 'activitylog' && <ActivityLogTab />}
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
