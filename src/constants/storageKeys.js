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
  schoolTerms:      'kt_schoolTerms',
  activityLogs:     'kt_activityLogs',
  pickupRecords:    'kt_pickupRecords',
  mediaRecords:     'kt_mediaRecords',
  cornerRecords:      'kt_cornerRecords',      // การใช้แหล่งเรียนรู้นอกห้องเรียนรายสัปดาห์
  innerCornerRecords: 'kt_innerCornerRecords', // การใช้มุมประสบการณ์ภายในห้องเรียนรายสัปดาห์
  healthCheckRecords:  'kt_healthCheckRecords',  // การตรวจสุขภาพประจำสัปดาห์
  illnessCheckRecords: 'kt_illnessCheckRecords', // คัดกรองอาการป่วยรายห้องเรียนรายเดือน
  toothBrushRecords:   'kt_toothBrushRecords',   // บันทึกการแปรงฟันรายเดือน
  lunchRecords:        'kt_lunchRecords',         // บันทึกการรับประทานอาหารกลางวันรายเดือน
  milkRecords:         'kt_milkRecords',          // บันทึกการดื่มนมรายเดือน
  nutritionRecords:    'kt_nutritionRecords',      // การประเมินภาวะโภชนาการ
  studentReportRecords: 'kt_studentReportRecords', // สมุดรายงานประจำตัวเด็กปฐมวัย (อ.01)
  schoolPhilosophy:     'kt_schoolPhilosophy',     // ปรัชญาการศึกษาปฐมวัย
  schoolVision:         'kt_schoolVision',          // วิสัยทัศน์
  localGovSlogan:       'kt_localGovSlogan',        // คำขวัญขององค์กรปกครองส่วนท้องถิ่น
  schoolSlogan:         'kt_schoolSlogan',           // คำขวัญของสถานศึกษาในสังกัด อปท.
  cornerDefs:           'kt_cornerDefs',             // นิยามมุมแหล่งเรียนรู้นอกห้องเรียน (แก้ไขได้)
  innerCornerDefs:      'kt_innerCornerDefs',        // นิยามมุมประสบการณ์ในห้องเรียน (แก้ไขได้)
};

export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
