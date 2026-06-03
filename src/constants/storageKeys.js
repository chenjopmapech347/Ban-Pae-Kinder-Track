export const STORAGE_KEYS = {
  students:         'kt_students',
  teachers:         'kt_teachers',
  classes:          'kt_classes',
  schools:          'kt_schools',
  assessmentTopics: 'kt_assessmentTopics',
  announcements:    'kt_announcements',
  academicYears:    'kt_academicYears',
  schoolName:       'kt_schoolName',
  academicYear:     'kt_academicYear',
  dailyRecords:     'kt_dailyRecords',
  authConfig:       'kt_authConfig',
  holidays:         'kt_holidays',
  qaData:           'kt_qaData',
  indicators:       'kt_indicators',
  activities:       'kt_activities',
};

export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
