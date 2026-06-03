import fs from 'fs';

const path = new URL('../src/App.jsx', import.meta.url);
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const start = lines.findIndex((l) => l.startsWith('const AdminDashboard'));
const end = lines.findIndex((l, i) => i > start && l.startsWith('const StudentModal'));
const body = lines.slice(start, end).join('\n');

const header = `import { useState } from 'react';
import { useApp } from '../context/AppContext';
import StudentModal from '../components/StudentModal';

export default function AdminDashboard() {
  const {
    students, setStudents,
    teachers, setTeachers,
    classes, setClasses,
    schools, setSchools,
    assessmentTopics, setAssessmentTopics,
    announcements, setAnnouncements,
    setIsSettingsOpen,
    handleImport,
    setSelectedStudent,
    setEvaluatingStudent,
  } = useApp();
`;

const inner = body.replace(/^const AdminDashboard = \([^)]*\) => \{/, '');
const out = new URL('../src/pages/AdminDashboard.jsx', import.meta.url);
fs.writeFileSync(out, header + inner + '}\n');
console.log('wrote', end - start, 'lines');
