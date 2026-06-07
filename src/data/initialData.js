// ─────────────────────────────────────────────────────────
//  KinderTrack — Seed Data
//  150 นักเรียน (K1×47, K2×40, K3×53) รวมสล็อตว่าง 14 ที่ | 10 ครู | 1 Admin | ผู้ปกครอง 136 คน (PIN)
//  ปีการศึกษา 2569 โรงเรียนเทศบาลบ้านเพ ๑
// ─────────────────────────────────────────────────────────

// ── ข้อมูลนักเรียน 136 คน ──────────────────────────────────
export const INITIAL_STUDENTS = [
  // ── อนุบาล 1 (K1) — 45 คน ──
  { id:1420, name:'เด็กชายกฤติเดช แก้วคำ', level:'K1', className:'อ.1/1', studentCode:'69001', age:4, weight:0, height:0, nationalId:'1-2199-01866-03-7', parentPin:'1001' },
  { id:1421, name:'เด็กชายพัชรพงษ์ ลิ้มกลาง', level:'K1', className:'อ.1/1', studentCode:'69002', age:4, weight:0, height:0, nationalId:'1-2199-01898-68-1', parentPin:'1002' },
  { id:1422, name:'เด็กชายจักรพรรดิ เสร็จกิจ', level:'K1', className:'อ.1/1', studentCode:'69003', age:4, weight:0, height:0, nationalId:'1-2199-01893-18-2', parentPin:'1003' },
  { id:1423, name:'เด็กชายพีรวิชญ์ หวนโคกสูง', level:'K1', className:'อ.1/1', studentCode:'69004', age:4, weight:0, height:0, nationalId:'1-2199-01920-00-7', parentPin:'1004' },
  { id:1424, name:'เด็กชายยุทธพงษ์ ภมรพล', level:'K1', className:'อ.1/1', studentCode:'69005', age:4, weight:0, height:0, nationalId:'1-2199-01920-79-1', parentPin:'1005' },
  { id:1425, name:'เด็กชายกรภวัต เปลี้องกลาง', level:'K1', className:'อ.1/1', studentCode:'69006', age:4, weight:0, height:0, nationalId:'1-2199-01924-74-6', parentPin:'1006' },
  { id:1426, name:'เด็กชายญานภัทร ธรรมรักษา', level:'K1', className:'อ.1/1', studentCode:'69007', age:4, weight:0, height:0, nationalId:'1-2199-01923-46-4', parentPin:'1007' },
  { id:1427, name:'เด็กชายอชิรสิทธิ์ สุขใจ', level:'K1', className:'อ.1/1', studentCode:'69008', age:4, weight:0, height:0, nationalId:'1-2199-01921-03-8', parentPin:'1008' },
  { id:1428, name:'เด็กชายพชร ตระกูลหิรัญ', level:'K1', className:'อ.1/1', studentCode:'69009', age:4, weight:0, height:0, nationalId:'1-2199-01909-36-4', parentPin:'1009' },
  { id:1429, name:'เด็กชายณัชพล เมฆพัฒน์', level:'K1', className:'อ.1/1', studentCode:'69010', age:4, weight:0, height:0, nationalId:'1-2199-01925-57-2', parentPin:'1010' },
  { id:1430, name:'เด็กชายสรัญยู นพคุณ', level:'K1', className:'อ.1/1', studentCode:'69011', age:4, weight:0, height:0, nationalId:'1-2199-01914-60-1', parentPin:'1011' },
  { id:1431, name:'เด็กหญิงนิธิดา แซน', level:'K1', className:'อ.1/1', studentCode:'69012', age:4, weight:0, height:0, nationalId:'00-2199-136310-9', parentPin:'1012' },
  { id:1432, name:'เด็กหญิงพลอยนภัส พานวล', level:'K1', className:'อ.1/1', studentCode:'69013', age:4, weight:0, height:0, nationalId:'1-2299-01639-26-9', parentPin:'1013' },
  { id:1433, name:'เด็กหญิงรัตนาพร รักษมาตา', level:'K1', className:'อ.1/1', studentCode:'69014', age:4, weight:0, height:0, nationalId:'1-2198-00676-69-1', parentPin:'1014' },
  { id:1434, name:'เด็กหญิงเฟย์รยา พันสุข', level:'K1', className:'อ.1/1', studentCode:'69015', age:4, weight:0, height:0, nationalId:'1-2101-01240-94-1', parentPin:'1015' },
  { id:1435, name:'เด็กหญิงธนิกาญจน์ แสงทอง', level:'K1', className:'อ.1/1', studentCode:'69016', age:4, weight:0, height:0, nationalId:'1-2199-01895-54-1', parentPin:'1016' },
  { id:1436, name:'เด็กหญิงปลายฟ้า ชาลี', level:'K1', className:'อ.1/1', studentCode:'69017', age:4, weight:0, height:0, nationalId:'1-2199-01927-98-2', parentPin:'1017' },
  { id:1437, name:'เด็กหญิงกมลชนก นาหมีด', level:'K1', className:'อ.1/1', studentCode:'69018', age:4, weight:0, height:0, nationalId:'1-2199-01904-37-1', parentPin:'1018' },
  { id:1457, name:'เด็กหญิงธัญชนก พ่วงพิศ', level:'K1', className:'อ.1/1', studentCode:'69019', age:4, weight:0, height:0, nationalId:'1-2199-01911-83-1', parentPin:'1019' },
  { id:1458, name:'เด็กชายธีระภัส โทมี', level:'K1', className:'อ.1/1', studentCode:'69020', age:4, weight:0, height:0, nationalId:'1-2199-01870-84-1', parentPin:'1020' },
  { id:1462, name:'เด็กชายธนา เกตุแก้ว', level:'K1', className:'อ.1/1', studentCode:'69021', age:4, weight:0, height:0, nationalId:'1-21032-00576-73-9', parentPin:'1021' },
  { id:1463, name:'เด็กหญิงกีต้าร์ เง็ด', level:'K1', className:'อ.1/1', studentCode:'69022', age:4, weight:0, height:0, nationalId:'00-2199-137883-1', parentPin:'1022' },
  { id:1467, name:'เด็กหญิงกมลพิชญ์ กังวาล', level:'K1', className:'อ.1/1', studentCode:'69023', age:4, weight:0, height:0, nationalId:'1-2199-01904-37-1', parentPin:'1023' },
  { id:1438, name:'เด็กชายณัฐกร สวัสดี', level:'K1', className:'อ.1/2', studentCode:'69024', age:4, weight:0, height:0, nationalId:'1-2199-01894-32-4', parentPin:'1024' },
  { id:1439, name:'เด็กชายพรพัฒน์ สุวรรณวงศ์', level:'K1', className:'อ.1/2', studentCode:'69025', age:4, weight:0, height:0, nationalId:'1-2198-00676-37-2', parentPin:'1025' },
  { id:1440, name:'เด็กชายพงสกร สันใจ', level:'K1', className:'อ.1/2', studentCode:'69026', age:4, weight:0, height:0, nationalId:'1-2199-01889-84-3', parentPin:'1026' },
  { id:1441, name:'เด็กชายปวเรศ ฟักทอง', level:'K1', className:'อ.1/2', studentCode:'69027', age:4, weight:0, height:0, nationalId:'1-2199-01899-69-5', parentPin:'1027' },
  { id:1442, name:'เด็กชายณัชธร คชรินทร์', level:'K1', className:'อ.1/2', studentCode:'69028', age:4, weight:0, height:0, nationalId:'1-2199-01913-75-2', parentPin:'1028' },
  { id:1443, name:'เด็กชายกรรกีรติ ถนอมรอด', level:'K1', className:'อ.1/2', studentCode:'69029', age:4, weight:0, height:0, nationalId:'1-1999-01904-22-3', parentPin:'1029' },
  { id:1444, name:'เด็กชายพชรพล ประกอบแก้ว', level:'K1', className:'อ.1/2', studentCode:'69030', age:4, weight:0, height:0, nationalId:'1-2199-01913-26-4', parentPin:'1030' },
  { id:1445, name:'เด็กชายชินกร กุลรัตน์', level:'K1', className:'อ.1/2', studentCode:'69031', age:4, weight:0, height:0, nationalId:'1-2199-01892-53-4', parentPin:'1031' },
  { id:1446, name:'เด็กชายกันต์กวิน วสิกรัตน์', level:'K1', className:'อ.1/2', studentCode:'69032', age:4, weight:0, height:0, nationalId:'1-2199-01901-39-8', parentPin:'1032' },
  { id:1447, name:'เด็กหญิงนภัสวรรณ บุญแจ่ม', level:'K1', className:'อ.1/2', studentCode:'69033', age:4, weight:0, height:0, nationalId:'1-2199-01913-81-7', parentPin:'1033' },
  { id:1448, name:'เด็กหญิงบุญญาพร มหาสัทธา', level:'K1', className:'อ.1/2', studentCode:'69034', age:4, weight:0, height:0, nationalId:'1-2199-01911-52-1', parentPin:'1034' },
  { id:1449, name:'เด็กหญิงกานต์ธีรา บุญฤทธ์', level:'K1', className:'อ.1/2', studentCode:'69035', age:4, weight:0, height:0, nationalId:'1-2199-01890-27-2', parentPin:'1035' },
  { id:1450, name:'เด็กหญิงจิณัฐตา จันทรพิพัฒน์', level:'K1', className:'อ.1/2', studentCode:'69036', age:4, weight:0, height:0, nationalId:'2-2199-00034-59-1', parentPin:'1036' },
  { id:1451, name:'เด็กหญิงปุณยนุช ศรีบุญเรือง', level:'K1', className:'อ.1/2', studentCode:'69037', age:4, weight:0, height:0, nationalId:'1-2199-01893-92-1', parentPin:'1037' },
  { id:1452, name:'เด็กหญิงอิศรา มหิพันธุ์', level:'K1', className:'อ.1/2', studentCode:'69038', age:4, weight:0, height:0, nationalId:'1-4590-00062-44-1', parentPin:'1038' },
  { id:1453, name:'เด็กหญิงศิริพร นวลจันทร์', level:'K1', className:'อ.1/2', studentCode:'69039', age:4, weight:0, height:0, nationalId:'1-2199-01905-67-9', parentPin:'1039' },
  { id:1459, name:'เด็กหญิงลภัสดา นิเคราะจิต', level:'K1', className:'อ.1/2', studentCode:'69040', age:4, weight:0, height:0, nationalId:'1-3990-00154-93-1', parentPin:'1040' },
  { id:1460, name:'เด็กหญิงมะหน่วยอูโซ', level:'K1', className:'อ.1/2', studentCode:'69041', age:4, weight:0, height:0, nationalId:'', parentPin:'1041' },
  { id:1461, name:'เด็กชายชนนน ตรงชื่น', level:'K1', className:'อ.1/2', studentCode:'69042', age:4, weight:0, height:0, nationalId:'2-2199-00034-66-4', parentPin:'1042' },
  { id:1468, name:'เด็กหญิงกัญญารัตน์ มัจฉาเกื้อ', level:'K1', className:'อ.1/2', studentCode:'69043', age:4, weight:0, height:0, nationalId:'1-3799-00778-39-7', parentPin:'1043' },
  { id:1469, name:'เด็กชายณัฐากร สีสำลี', level:'K1', className:'อ.1/2', studentCode:'69044', age:4, weight:0, height:0, nationalId:'1-2199-01930-44-4', parentPin:'1044' },
  { id:1470, name:'เด็กหญิงปานภัสส์ พุ่มทรัพย์', level:'K1', className:'อ.1/2', studentCode:'69045', age:4, weight:0, height:0, nationalId:'1-1996-00686-97-9', parentPin:'1045' },
  // ── อนุบาล 2 (K2) — 38 คน ──
  { id:1375, name:'เด็กชายนาวิน', level:'K2', className:'อ.2/1', studentCode:'69046', age:5, weight:0, height:0, nationalId:'00-2199-133958-5', parentPin:'1046' },
  { id:1376, name:'เด็กชายจิตติพัฒน์ ศรีธาราม', level:'K2', className:'อ.2/1', studentCode:'69047', age:5, weight:0, height:0, nationalId:'1-2199-01855-48-5', parentPin:'1047' },
  { id:1381, name:'เด็กหญิงอริสรา บุญโส', level:'K2', className:'อ.2/1', studentCode:'69048', age:5, weight:0, height:0, nationalId:'1-2199-01860-26-8', parentPin:'1048' },
  { id:1386, name:'เด็กหญิงปริญธิดา เปลื้องกลาง', level:'K2', className:'อ.2/1', studentCode:'69049', age:5, weight:0, height:0, nationalId:'1-2199-01857-69-1', parentPin:'1049' },
  { id:1388, name:'เด็กชายลีเฮง ยอม', level:'K2', className:'อ.2/1', studentCode:'69050', age:5, weight:0, height:0, nationalId:'00-2199-135238-7', parentPin:'1050' },
  { id:1407, name:'เด็กชายพชดร ธรรมหลวง', level:'K2', className:'อ.2/1', studentCode:'69051', age:5, weight:0, height:0, nationalId:'1-2199-01887-67-1', parentPin:'1051' },
  { id:1419, name:'เด็กชายภูตะวัน พุ่มทรัพย์', level:'K2', className:'อ.2/1', studentCode:'69052', age:5, weight:0, height:0, nationalId:'1-1996-00667-79-6', parentPin:'1052' },
  { id:1390, name:'เด็กชายชัชรินทร์ ทองกลาง', level:'K2', className:'อ.2/1', studentCode:'69053', age:5, weight:0, height:0, nationalId:'1-2199-01883-97-7', parentPin:'1053' },
  { id:1391, name:'เด็กชายคงศักดิ์ รูปดี', level:'K2', className:'อ.2/1', studentCode:'69054', age:5, weight:0, height:0, nationalId:'1-2199-07875-50-8', parentPin:'1054' },
  { id:1398, name:'เด็กหญิงแพะตรา พอน', level:'K2', className:'อ.2/1', studentCode:'69055', age:5, weight:0, height:0, nationalId:'00-2199-135525-4', parentPin:'1055' },
  { id:1399, name:'เด็กหญิงกัญญพัชร อุดร', level:'K2', className:'อ.2/1', studentCode:'69056', age:5, weight:0, height:0, nationalId:'1-2199-01844-53-0', parentPin:'1056' },
  { id:1402, name:'เด็กหญิงชญาภา ประเทศ', level:'K2', className:'อ.2/1', studentCode:'69057', age:5, weight:0, height:0, nationalId:'1-2199-01885-98-8', parentPin:'1057' },
  { id:1404, name:'เด็กหญิงอริสา กลิ่นประทุม', level:'K2', className:'อ.2/1', studentCode:'69058', age:5, weight:0, height:0, nationalId:'1-2199-01850-98-0', parentPin:'1058' },
  { id:1366, name:'เด็กชายอาณันย์ ไพศาลภูมิ', level:'K2', className:'อ.2/1', studentCode:'69059', age:5, weight:0, height:0, nationalId:'1-2199-01806-33-6', parentPin:'1059' },
  { id:1454, name:'เด็กชายศุภวิชญ์ บุญแสง', level:'K2', className:'อ.2/1', studentCode:'69060', age:5, weight:0, height:0, nationalId:'1-2199-01873-04-1', parentPin:'1060' },
  { id:1455, name:'เด็กหญิงณัฐริกา บุญจือ', level:'K2', className:'อ.2/1', studentCode:'69061', age:5, weight:0, height:0, nationalId:'1-2199-01867-15-7', parentPin:'1061' },
  { id:1463, name:'เด็กหญิงพัณณ์พิกา พงศ์ภวัตรณกร', level:'K2', className:'อ.2/1', studentCode:'69062', age:5, weight:0, height:0, nationalId:'1-1045-00194-96-4', parentPin:'1062' },
  { id:1465, name:'เด็กหญิงกุลภัสสร เจริญพานิช', level:'K2', className:'อ.2/1', studentCode:'69063', age:5, weight:0, height:0, nationalId:'1-2199-01858-12-3', parentPin:'1063' },
  { id:1466, name:'เด็กชายนาเดีย', level:'K2', className:'อ.2/1', studentCode:'69064', age:5, weight:0, height:0, nationalId:'', parentPin:'1064' },
  { id:1374, name:'เด็กชายยุรนันท์ นวลจันทร์', level:'K2', className:'อ.2/2', studentCode:'69065', age:5, weight:0, height:0, nationalId:'1-3396-00463-11-1', parentPin:'1065' },
  { id:1377, name:'เด็กชายภูริภัทร คำนึงคิด', level:'K2', className:'อ.2/2', studentCode:'69066', age:5, weight:0, height:0, nationalId:'1-2199-01859-86-3', parentPin:'1066' },
  { id:1378, name:'เด็กหญิงชุติมา สุดถนอม', level:'K2', className:'อ.2/2', studentCode:'69067', age:5, weight:0, height:0, nationalId:'1-2199-01844-18-1', parentPin:'1067' },
  { id:1379, name:'เด็กหญิงเกวลิน สมหวัง', level:'K2', className:'อ.2/2', studentCode:'69068', age:5, weight:0, height:0, nationalId:'1-2199-01876-94-6', parentPin:'1068' },
  { id:1380, name:'เด็กหญิงวรรณวิสา สายศรี', level:'K2', className:'อ.2/2', studentCode:'69069', age:5, weight:0, height:0, nationalId:'1-2199-01874-12-9', parentPin:'1069' },
  { id:1382, name:'เด็กหญิงปภาภรณ์ ไกรมาศ', level:'K2', className:'อ.2/2', studentCode:'69070', age:5, weight:0, height:0, nationalId:'1-3396-00479-10-6', parentPin:'1070' },
  { id:1383, name:'เด็กหญิงชาลิสา วงษ์อยู่', level:'K2', className:'อ.2/2', studentCode:'69071', age:5, weight:0, height:0, nationalId:'1-2199-01868-46-3', parentPin:'1071' },
  { id:1415, name:'เด็กหญิงปรารถนา คม', level:'K2', className:'อ.2/2', studentCode:'69072', age:5, weight:0, height:0, nationalId:'00-2199-135359-6', parentPin:'1072' },
  { id:1389, name:'เด็กชายพัฒนพล เนาว์', level:'K2', className:'อ.2/2', studentCode:'69073', age:5, weight:0, height:0, nationalId:'00-2199-135312-0', parentPin:'1073' },
  { id:1392, name:'เด็กชายแดน ตุย', level:'K2', className:'อ.2/2', studentCode:'69074', age:5, weight:0, height:0, nationalId:'00-2090-110909-6', parentPin:'1074' },
  { id:1395, name:'เด็กชายอิทธิพัทธ์ โชติภักดี', level:'K2', className:'อ.2/2', studentCode:'69075', age:5, weight:0, height:0, nationalId:'1-2199-01888-51-1', parentPin:'1075' },
  { id:1400, name:'เด็กหญิงลลิณ พารา', level:'K2', className:'อ.2/2', studentCode:'69076', age:5, weight:0, height:0, nationalId:'1-1010-00767-47-4', parentPin:'1076' },
  { id:1401, name:'เด็กหญิงเพชรลดา แก้วแสนไชย', level:'K2', className:'อ.2/2', studentCode:'69077', age:5, weight:0, height:0, nationalId:'1-3999-00728-08-0', parentPin:'1077' },
  { id:1403, name:'เด็กชายธีรพล สมานมิตร', level:'K2', className:'อ.2/2', studentCode:'69078', age:5, weight:0, height:0, nationalId:'1-2199-01857-90-9', parentPin:'1078' },
  { id:1406, name:'เด็กชายภาคิน สุวรรณาหะ', level:'K2', className:'อ.2/2', studentCode:'69079', age:5, weight:0, height:0, nationalId:'1-2199-01889-42-8', parentPin:'1079' },
  { id:1413, name:'เด็กหญิงชุติกาญจน์ แพทอง', level:'K2', className:'อ.2/2', studentCode:'69080', age:5, weight:0, height:0, nationalId:'1-2199-01884-74-4', parentPin:'1080' },
  { id:1414, name:'เด็กชายกิตติศักดิ์ วิลาสถิตย์', level:'K2', className:'อ.2/2', studentCode:'69081', age:5, weight:0, height:0, nationalId:'1-2199-01845-26-9', parentPin:'1081' },
  { id:1418, name:'เด็กชายณัฐพงศ์ ขนรกุล', level:'K2', className:'อ.2/2', studentCode:'69082', age:5, weight:0, height:0, nationalId:'1-2302-00124-11-7', parentPin:'1082' },
  { id:1417, name:'เด็กชายศิริโรจน์ สาระทิพย์', level:'K2', className:'อ.2/2', studentCode:'69083', age:5, weight:0, height:0, nationalId:'1-2399-00691-72-1', parentPin:'1083' },
  // ── อนุบาล 3 (K3) — 53 คน ──
  { id:1254, name:'เด็กหญิงปาลิน เจริญพร', level:'K3', className:'อ.3/1', studentCode:'69084', age:6, weight:0, height:0, nationalId:'1-2199-01794-11-7', parentPin:'1084' },
  { id:1289, name:'เด็กชายปัญจกฤษฎิ์ วรรัตน์', level:'K3', className:'อ.3/1', studentCode:'69085', age:6, weight:0, height:0, nationalId:'1-2199-01822-05-6', parentPin:'1085' },
  { id:1291, name:'เด็กชายศิวัช แกล้วกล้า', level:'K3', className:'อ.3/1', studentCode:'69086', age:6, weight:0, height:0, nationalId:'1-2199-01818-25-3', parentPin:'1086' },
  { id:1299, name:'เด็กหญิงมาลาริน อยู่ทอง', level:'K3', className:'อ.3/1', studentCode:'69087', age:6, weight:0, height:0, nationalId:'1-2199-01834-25-9', parentPin:'1087' },
  { id:1302, name:'เด็กหญิงณัฐกานต์รวี มีกลม', level:'K3', className:'อ.3/1', studentCode:'69088', age:6, weight:0, height:0, nationalId:'1-2199-01848-51-9', parentPin:'1088' },
  { id:1303, name:'เด็กหญิงชนิณนภา พานแย้ม', level:'K3', className:'อ.3/1', studentCode:'69089', age:6, weight:0, height:0, nationalId:'1-2096-02163-62-0', parentPin:'1089' },
  { id:1309, name:'เด็กชายณัฐพล โพธิงาม', level:'K3', className:'อ.3/1', studentCode:'69090', age:6, weight:0, height:0, nationalId:'1-2199-01841-19-1', parentPin:'1090' },
  { id:1312, name:'เด็กชายวีรภัทร', level:'K3', className:'อ.3/1', studentCode:'69091', age:6, weight:0, height:0, nationalId:'00-2199-134429-5', parentPin:'1091' },
  { id:1315, name:'เด็กชายเมธัส สีแหล้', level:'K3', className:'อ.3/1', studentCode:'69092', age:6, weight:0, height:0, nationalId:'1-2199-01816-82-0', parentPin:'1092' },
  { id:1321, name:'เด็กหญิงวรกานต์ ทองอารยะ', level:'K3', className:'อ.3/1', studentCode:'69093', age:6, weight:0, height:0, nationalId:'1-2199-01838-06-8', parentPin:'1093' },
  { id:1332, name:'เด็กชายชยุตม์ บุญโสม', level:'K3', className:'อ.3/1', studentCode:'69094', age:6, weight:0, height:0, nationalId:'1-2199-01826-79-5', parentPin:'1094' },
  { id:1334, name:'เด็กชายฐิติภัทร โมราวงค์', level:'K3', className:'อ.3/1', studentCode:'69095', age:6, weight:0, height:0, nationalId:'1-2199-01831-68-3', parentPin:'1095' },
  { id:1335, name:'เด็กชายธนากร ช่างทอง', level:'K3', className:'อ.3/1', studentCode:'69096', age:6, weight:0, height:0, nationalId:'1-2199-01826-14-1', parentPin:'1096' },
  { id:1342, name:'เด็กหญิงกนกพร แก้วเหลา', level:'K3', className:'อ.3/1', studentCode:'69097', age:6, weight:0, height:0, nationalId:'1-2199-01821-47-5', parentPin:'1097' },
  { id:1344, name:'เด็กหญิงวีซ่า อาน', level:'K3', className:'อ.3/1', studentCode:'69098', age:6, weight:0, height:0, nationalId:'00-2199-133550-4', parentPin:'1098' },
  { id:1295, name:'เด็กชายเมธา คุณเพิ่ม', level:'K3', className:'อ.3/2', studentCode:'69099', age:6, weight:0, height:0, nationalId:'1-2199-01827-45-7', parentPin:'1099' },
  { id:1297, name:'เด็กหญิงพลอยไพลิน ดิษย์รัตน์', level:'K3', className:'อ.3/2', studentCode:'69100', age:6, weight:0, height:0, nationalId:'1-2199-01845-27-7', parentPin:'1100' },
  { id:1301, name:'เด็กหญิงกัญญพัชร อินทร์ถาวร', level:'K3', className:'อ.3/2', studentCode:'69101', age:6, weight:0, height:0, nationalId:'1-2199-01833-28-7', parentPin:'1101' },
  { id:1311, name:'เด็กชายวิไทย เชีย', level:'K3', className:'อ.3/2', studentCode:'69102', age:6, weight:0, height:0, nationalId:'00-2199-134019-2', parentPin:'1102' },
  { id:1314, name:'เด็กชายกรวิชญ์ ไทยเรือง', level:'K3', className:'อ.3/2', studentCode:'69103', age:6, weight:0, height:0, nationalId:'1-2199-01818-69-5', parentPin:'1103' },
  { id:1317, name:'เด็กชายธันท์นภัส ภิญโญธนกุศล', level:'K3', className:'อ.3/2', studentCode:'69104', age:6, weight:0, height:0, nationalId:'1-2199-01812-03-4', parentPin:'1104' },
  { id:1320, name:'เด็กหญิงณัฏฐนันท์ แดงดอน', level:'K3', className:'อ.3/2', studentCode:'69105', age:6, weight:0, height:0, nationalId:'1-2199-01844-87-4', parentPin:'1105' },
  { id:1333, name:'เด็กชายธนากร สุวรรณสนธ์', level:'K3', className:'อ.3/2', studentCode:'69106', age:6, weight:0, height:0, nationalId:'1-1298-00249-97-1', parentPin:'1106' },
  { id:1357, name:'เด็กชายศุภวิชญ์ โพคา', level:'K3', className:'อ.3/2', studentCode:'69107', age:6, weight:0, height:0, nationalId:'1-2199-01832-68-0', parentPin:'1107' },
  { id:1359, name:'เด็กชายสุกไกร เฮียน', level:'K3', className:'อ.3/2', studentCode:'69108', age:6, weight:0, height:0, nationalId:'00-2199-133737-0', parentPin:'1108' },
  { id:1364, name:'เด็กหญิงสุธามาศ สิงห์เข่ง', level:'K3', className:'อ.3/2', studentCode:'69109', age:6, weight:0, height:0, nationalId:'1-2199-01842-99-5', parentPin:'1109' },
  { id:1367, name:'เด็กชายภูริ เขตรสกล', level:'K3', className:'อ.3/2', studentCode:'69110', age:6, weight:0, height:0, nationalId:'1-2199-01814-33-9', parentPin:'1110' },
  { id:1372, name:'เด็กหญิงปัณณพร คุณเอนก', level:'K3', className:'อ.3/2', studentCode:'69111', age:6, weight:0, height:0, nationalId:'1-2199-01815-38-6', parentPin:'1111' },
  { id:1373, name:'เด็กชายนนท์นภัทร กังวาล', level:'K3', className:'อ.3/2', studentCode:'69112', age:6, weight:0, height:0, nationalId:'1-2199-01833-15-5', parentPin:'1112' },
  { id:1411, name:'เด็กหญิงฟ้าใส สติมั่น', level:'K3', className:'อ.3/2', studentCode:'69113', age:6, weight:0, height:0, nationalId:'1-1299-02678-14-6', parentPin:'1113' },
  { id:1457, name:'เด็กหญิงพลอยชมพู บัวแก้ว', level:'K3', className:'อ.3/2', studentCode:'69114', age:6, weight:0, height:0, nationalId:'1-2299-01790-28-6', parentPin:'1114' },
  { id:1456, name:'เด็กชายสรวิศ ทรัพย์ดี', level:'K3', className:'อ.3/2', studentCode:'69115', age:6, weight:0, height:0, nationalId:'1-2199-01808-97-6', parentPin:'1115' },
  { id:1360, name:'เด็กชายพชรพล เจนจัดการ', level:'K3', className:'อ.3/2', studentCode:'69116', age:6, weight:0, height:0, nationalId:'1-2198-00642-59-1', parentPin:'1116' },
  { id:1288, name:'เด็กชายวรรณชนะ สายศรี', level:'K3', className:'อ.3/3', studentCode:'69117', age:6, weight:0, height:0, nationalId:'1-6294-00128-11-1', parentPin:'1117' },
  { id:1292, name:'เด็กชายภาคิน บุญฤทธ์', level:'K3', className:'อ.3/3', studentCode:'69118', age:6, weight:0, height:0, nationalId:'1-2199-01840-39-9', parentPin:'1118' },
  { id:1304, name:'เด็กหญิงปาลิดา ปานอีเม้ง', level:'K3', className:'อ.3/3', studentCode:'69119', age:6, weight:0, height:0, nationalId:'1-2096-02153-91-8', parentPin:'1119' },
  { id:1307, name:'เด็กหญิงนุช โป', level:'K3', className:'อ.3/3', studentCode:'69120', age:6, weight:0, height:0, nationalId:'00-2199-133410-9', parentPin:'1120' },
  { id:1310, name:'เด็กชายชนันธร สังขฤกษ์', level:'K3', className:'อ.3/3', studentCode:'69121', age:6, weight:0, height:0, nationalId:'1-2006-01638-41-3', parentPin:'1121' },
  { id:1313, name:'เด็กชายกฤติกรณ์ งามญาติ', level:'K3', className:'อ.3/3', studentCode:'69122', age:6, weight:0, height:0, nationalId:'1-2198-00651-76-1', parentPin:'1122' },
  { id:1316, name:'เด็กชายวายุ อ่อนแสง', level:'K3', className:'อ.3/3', studentCode:'69123', age:6, weight:0, height:0, nationalId:'1-2199-01839-01-3', parentPin:'1123' },
  { id:1319, name:'เด็กหญิงวริศรา บุตรยัง', level:'K3', className:'อ.3/3', studentCode:'69124', age:6, weight:0, height:0, nationalId:'1-2199-01844-60-2', parentPin:'1124' },
  { id:1322, name:'เด็กหญิงสุพัตรา อิ่มสมบูรณ์', level:'K3', className:'อ.3/3', studentCode:'69125', age:6, weight:0, height:0, nationalId:'1-2199-01819-87-0', parentPin:'1125' },
  { id:1330, name:'เด็กหญิงญาณิดา ธรรมรักษา', level:'K3', className:'อ.3/3', studentCode:'69126', age:6, weight:0, height:0, nationalId:'1-2009-01996-93-5', parentPin:'1126' },
  { id:1336, name:'เด็กชายนนทิพัฒน์ ฤทธิ์นอก', level:'K3', className:'อ.3/3', studentCode:'69127', age:6, weight:0, height:0, nationalId:'1-2199-01836-61-8', parentPin:'1127' },
  { id:1338, name:'เด็กชายกิตติกวิน สุวรรณาหะ', level:'K3', className:'อ.3/3', studentCode:'69128', age:6, weight:0, height:0, nationalId:'1-2187-00075-71-6', parentPin:'1128' },
  { id:1339, name:'เด็กชายพงศกรณ์ คนเที่ยง', level:'K3', className:'อ.3/3', studentCode:'69129', age:6, weight:0, height:0, nationalId:'1-4799-01365-47-8', parentPin:'1129' },
  { id:1343, name:'เด็กหญิงนิรดา เหลืองอ่อน', level:'K3', className:'อ.3/3', studentCode:'69130', age:6, weight:0, height:0, nationalId:'1-1407-00106-55-1', parentPin:'1130' },
  { id:1349, name:'เด็กหญิงปรียาภรณ์ บุญสม', level:'K3', className:'อ.3/3', studentCode:'69131', age:6, weight:0, height:0, nationalId:'1-2199-01814-69-0', parentPin:'1131' },
  { id:1351, name:'เด็กหญิงคินวินวา', level:'K3', className:'อ.3/3', studentCode:'69132', age:6, weight:0, height:0, nationalId:'G-672100-001234', parentPin:'1132' },
  { id:1361, name:'เด็กหญิงวาสนา โพธิ์วะรีย์', level:'K3', className:'อ.3/3', studentCode:'69133', age:6, weight:0, height:0, nationalId:'2-2199-00034-75-3', parentPin:'1133' },
  { id:1366, name:'เด็กชายกวิน นัสบุสย์', level:'K3', className:'อ.3/3', studentCode:'69134', age:6, weight:0, height:0, nationalId:'1-2199-01829-36-1', parentPin:'1134' },
  { id:1371, name:'เด็กหญิงณัฐฐนันท์ รัตนภัคดี', level:'K3', className:'อ.3/3', studentCode:'69135', age:6, weight:0, height:0, nationalId:'1-2199-01825-43-8', parentPin:'1135' },
  { id:1346, name:'เด็กหญิงญาดา คัทจันทร์', level:'K3', className:'อ.3/3', studentCode:'69136', age:6, weight:0, height:0, nationalId:'1-2799-00696-10-3', parentPin:'1136' },

  // ── สล็อตว่าง 14 ที่นั่ง (รอนักเรียนใหม่) ──
  // อ.1/1
  { id:1471, name:'(ว่าง) อ.1/1', level:'K1', className:'อ.1/1', studentCode:'69137', age:4, weight:0, height:0, nationalId:'', parentPin:'1137' },
  { id:1472, name:'(ว่าง) อ.1/1', level:'K1', className:'อ.1/1', studentCode:'69138', age:4, weight:0, height:0, nationalId:'', parentPin:'1138' },
  // อ.1/2
  { id:1473, name:'(ว่าง) อ.1/2', level:'K1', className:'อ.1/2', studentCode:'69139', age:4, weight:0, height:0, nationalId:'', parentPin:'1139' },
  { id:1474, name:'(ว่าง) อ.1/2', level:'K1', className:'อ.1/2', studentCode:'69140', age:4, weight:0, height:0, nationalId:'', parentPin:'1140' },
  // อ.2/1
  { id:1475, name:'(ว่าง) อ.2/1', level:'K2', className:'อ.2/1', studentCode:'69141', age:5, weight:0, height:0, nationalId:'', parentPin:'1141' },
  { id:1476, name:'(ว่าง) อ.2/1', level:'K2', className:'อ.2/1', studentCode:'69142', age:5, weight:0, height:0, nationalId:'', parentPin:'1142' },
  // อ.2/2
  { id:1477, name:'(ว่าง) อ.2/2', level:'K2', className:'อ.2/2', studentCode:'69143', age:5, weight:0, height:0, nationalId:'', parentPin:'1143' },
  { id:1478, name:'(ว่าง) อ.2/2', level:'K2', className:'อ.2/2', studentCode:'69144', age:5, weight:0, height:0, nationalId:'', parentPin:'1144' },
  // อ.3/1
  { id:1479, name:'(ว่าง) อ.3/1', level:'K3', className:'อ.3/1', studentCode:'69145', age:6, weight:0, height:0, nationalId:'', parentPin:'1145' },
  { id:1480, name:'(ว่าง) อ.3/1', level:'K3', className:'อ.3/1', studentCode:'69146', age:6, weight:0, height:0, nationalId:'', parentPin:'1146' },
  // อ.3/2
  { id:1481, name:'(ว่าง) อ.3/2', level:'K3', className:'อ.3/2', studentCode:'69147', age:6, weight:0, height:0, nationalId:'', parentPin:'1147' },
  { id:1482, name:'(ว่าง) อ.3/2', level:'K3', className:'อ.3/2', studentCode:'69148', age:6, weight:0, height:0, nationalId:'', parentPin:'1148' },
  // อ.3/3
  { id:1483, name:'(ว่าง) อ.3/3', level:'K3', className:'อ.3/3', studentCode:'69149', age:6, weight:0, height:0, nationalId:'', parentPin:'1149' },
  { id:1484, name:'(ว่าง) อ.3/3', level:'K3', className:'อ.3/3', studentCode:'69150', age:6, weight:0, height:0, nationalId:'', parentPin:'1150' },
].map(s => ({
  ...s,
  studentId:   s.id,
  parentPin:   String(s.id),   // PIN ผู้ปกครอง = รหัสประจำตัวนักเรียน
  status:      'ปกติ',
  assessments: {},
  attendance:  { present: 0, absent: 0, total: 0 },
}));

// ── ข้อมูลครู 7 คน (1 ครูต่อ 1 ห้อง) ────────────────────────
export const INITIAL_TEACHERS = [
  { id: 1, name: 'คุณครูปภัสสร เกิดเต็ม',       level:'K1', className:'อ.1/1', status:'Active', email:'Papassorn411@gmail.com',      pin:'kru01', username:'papassorn411'      },
  { id: 2, name: 'คุณครูลักษณา ฤกษ์มี',          level:'K1', className:'อ.1/2', status:'Active', email:'laksanalerkme@gmail.com',      pin:'kru02', username:'laksanalerkme'     },
  { id: 3, name: 'คุณครูชลดา ภู่เฟี้ยม',         level:'K2', className:'อ.2/1', status:'Active', email:'faichonlada181243@gmail.com',  pin:'kru03', username:'faichonlada181243' },
  { id: 4, name: 'คุณครูวรพรรณ เจนการกิจ',        level:'K2', className:'อ.2/2', status:'Active', email:'angrypaan@gmail.com',          pin:'kru04', username:'angrypaan'         },
  { id: 5, name: 'คุณครูปนัดดา สาลา',            level:'K3', className:'อ.3/1', status:'Active', email:'Panaddasala@gmail.com',        pin:'kru05', username:'panaddasala'       },
  { id: 6, name: 'คุณครูไอรินลดา วราหิรัญกุล',   level:'K3', className:'อ.3/2', status:'Active', email:'loeywiie@gmail.com',           pin:'kru06', username:'loeywiie'          },
  { id: 7, name: 'คุณครูศิวาพร แก้วหนูนวล',      level:'K3', className:'อ.3/3', status:'Active', email:'Siwapon231022@gmail.com',      pin:'kru07', username:'siwapon231022'     },
];

// ── โรงเรียน ──────────────────────────────────────────────
export const INITIAL_SCHOOLS = [
  {
    id: 1,
    name: 'โรงเรียนเทศบาลบ้านเพ ๑',
    address: 'ต.บ้านเพ อ.เมือง จ.ระยอง 21160',
    phone: '038-651234',
    principal: 'ผอ.สมชาย ใจดี',
  },
];

// ── ห้องเรียน 7 ห้อง (พร้อม teacherId) ──────────────────────
export const INITIAL_CLASSES = [
  { id: 1, name: 'อ.1/1', level: 'K1', count: 25, teacherId: 1, teacherName: 'คุณครูปภัสสร เกิดเต็ม'     },
  { id: 2, name: 'อ.1/2', level: 'K1', count: 24, teacherId: 2, teacherName: 'คุณครูลักษณา ฤกษ์มี'      },
  { id: 3, name: 'อ.2/1', level: 'K2', count: 21, teacherId: 3, teacherName: 'คุณครูชลดา ภู่เฟี้ยม'     },
  { id: 4, name: 'อ.2/2', level: 'K2', count: 21, teacherId: 4, teacherName: 'คุณครูวรพรรณ เจนการกิจ'   },
  { id: 5, name: 'อ.3/1', level: 'K3', count: 17, teacherId: 5, teacherName: 'คุณครูปนัดดา สาลา'        },
  { id: 6, name: 'อ.3/2', level: 'K3', count: 20, teacherId: 6, teacherName: 'คุณครูไอรินลดา วราหิรัญกุล' },
  { id: 7, name: 'อ.3/3', level: 'K3', count: 22, teacherId: 7, teacherName: 'คุณครูศิวาพร แก้วหนูนวล'  },
];

// ── วันหยุด ───────────────────────────────────────────────
export const INITIAL_HOLIDAYS = [
  { id: 1,  date: '01/01/2569', label: 'วันขึ้นปีใหม่',           type: 'Holiday' },
  { id: 2,  date: '13/04/2569', label: 'วันสงกรานต์ (วันที่ 1)', type: 'Holiday' },
  { id: 3,  date: '14/04/2569', label: 'วันสงกรานต์ (วันที่ 2)', type: 'Holiday' },
  { id: 4,  date: '15/04/2569', label: 'วันสงกรานต์ (วันที่ 3)', type: 'Holiday' },
  { id: 5,  date: '01/05/2569', label: 'วันแรงงานแห่งชาติ',      type: 'Holiday' },
  { id: 6,  date: '05/05/2569', label: 'วันฉัตรมงคล',            type: 'Holiday' },
  { id: 7,  date: '12/08/2569', label: 'วันแม่แห่งชาติ',         type: 'Holiday' },
  { id: 8,  date: '23/10/2569', label: 'วันปิยมหาราช',           type: 'Holiday' },
  { id: 9,  date: '05/12/2569', label: 'วันพ่อแห่งชาติ',         type: 'Holiday' },
  { id: 10, date: '10/12/2569', label: 'วันรัฐธรรมนูญ',          type: 'Holiday' },
  { id: 11, date: '31/12/2569', label: 'วันสิ้นปี',              type: 'Holiday' },
];

// ── หัวข้อประเมิน 4 ด้าน ──────────────────────────────────
export const DEFAULT_ASSESSMENT_TOPICS = [
  { id: 'physical',  label: 'ร่างกาย',      emoji: '🏃',
    crossRef: { dcy: 'ดย.3.1–3.3', curriculum: 'ปวัย.1–2',  onesqa: 'สมศ.1.1'     } },
  { id: 'emotional', label: 'อารมณ์-จิตใจ', emoji: '❤️',
    crossRef: { dcy: 'ดย.4.1–4.3', curriculum: 'ปวัย.3–4',  onesqa: 'สมศ.1.4'     } },
  { id: 'social',    label: 'สังคม',         emoji: '🤝',
    crossRef: { dcy: 'ดย.5.1–5.4', curriculum: 'ปวัย.5–8',  onesqa: 'สมศ.1.5'     } },
  { id: 'mental',    label: 'สติปัญญา',      emoji: '💡',
    crossRef: { dcy: 'ดย.6.1–6.3', curriculum: 'ปวัย.9–12', onesqa: 'สมศ.1.2–1.3' } },
];

// ── ประกาศ ────────────────────────────────────────────────
// target: 'all' = ทุกคน  |  className (เช่น 'K1') = เฉพาะห้องนั้น
export const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, date: '27/05/2569', title: 'ยินดีต้อนรับนักเรียนทั้ง 136 คน (ที่นั่งรวม 150 ที่) เข้าสู่ปีการศึกษา 2569 🎉', body: '', target: 'all' },
  { id: 2, date: '27/05/2569', title: 'ระบบ KinderTrack พร้อมใช้งานแล้ว — ครูสามารถเช็คชื่อและบันทึกพัฒนาการได้ทันที',    body: '', target: 'all' },
  { id: 3, date: '27/05/2569', title: 'แจ้งผู้ปกครอง: รหัส PIN สำหรับดูรายงานบุตรหลาน อยู่ที่เมนูนักเรียน (Admin)',        body: '', target: 'all' },
];

// ── ปีการศึกษา ────────────────────────────────────────────
export const DEFAULT_ACADEMIC_YEARS = ['2569', '2568', '2567'];

// ── Auth Config (PIN fallback) ────────────────────────────
export const DEFAULT_AUTH_CONFIG_OVERRIDE = {
  admin:   { pin: 'admin2569', name: 'ผู้ดูแลระบบ' },
  teacher: { pin: 'kru01',    name: 'คุณครูปภัสสร เกิดเต็ม', teacherId: 1 },
};
