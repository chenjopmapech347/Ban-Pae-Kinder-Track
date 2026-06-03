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
import ActivitiesTab   from '../components/admin/ActivitiesTab';

const TABS = [
  { id: 'overview',    label: '🏠 ภาพรวม' },
  { id: 'schools',     label: '🏫 โรงเรียน' },
  { id: 'topics',      label: '📝 หัวข้อประเมิน' },
  { id: 'indicators',  label: '📋 ตัวบ่งชี้' },
  { id: 'activities',  label: '🎯 กิจกรรม' },
  { id: 'qa',          label: '🛡️ QA' },
  { id: 'holidays',    label: '🏖️ วันหยุด' },
  { id: 'students',    label: '👶 นักเรียน' },
  { id: 'teachers',    label: '👩‍🏫 คุณครู' },
  { id: 'classes',     label: '🏫 ห้องเรียน' },
  { id: 'reports',     label: '📊 รายงาน' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="animate-fade">
      <div className="page-header mb-4">
        <h2>🛡️ ระบบจัดการ (Admin)</h2>
      </div>

      <div className="tab-bar mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            className={'tab-btn' + (activeTab === t.id ? ' active' : '')}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'  && <OverviewTab />}
      {activeTab === 'schools'   && <SchoolsTab />}
      {activeTab === 'topics'    && <TopicsTab />}
      {activeTab === 'qa'        && (
        <div className="glass p-6 animate-fade">
          <h3 className="mb-6">🛡️ สรุปมาตรฐานสถานพัฒนาเด็กปฐมวัย (ปี 2568)</h3>
          <QaStandardView />
        </div>
      )}
      {activeTab === 'indicators'  && <IndicatorsTab />}
      {activeTab === 'activities'  && <ActivitiesTab />}
      {activeTab === 'holidays'    && <HolidaysTab />}
      {activeTab === 'students'   && <StudentsTab />}
      {activeTab === 'teachers'   && <TeachersTab />}
      {activeTab === 'classes'    && <ClassesTab />}
      {activeTab === 'reports'    && <ReportsTab />}
    </div>
  );
}
