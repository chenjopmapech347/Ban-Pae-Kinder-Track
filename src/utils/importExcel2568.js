import * as XLSX from 'xlsx';

function slugId(header) {
  const m = String(header).match(/^([\d.]+(?:ก|ข)?)/);
  return m ? m[1] : String(header).slice(0, 20).replace(/\s+/g, '_');
}

function topicLabel(header) {
  const s = String(header);
  const m = s.match(/^[\d.]+(?:ก|ข)?\s*(.+)/);
  return m ? m[1].trim() : s;
}

function num(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/** อ่านไฟล์ สรุปผลการประเมินปฐมวัย_2568 */
export function parseStudentAssessmentWorkbook(workbook) {
  const sheetName =
    workbook.SheetNames.find((n) => n === 'สรุปรายนักเรียน') ||
    workbook.SheetNames.find((n) => n === 'รายบุคคล');

  if (!sheetName) {
    return { ok: false, message: 'ไม่พบชีต "สรุปรายนักเรียน" หรือ "รายบุคคล"' };
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
  let headerRowIdx = rows.findIndex((r) => r.some((c) => String(c).includes('ชื่อ-สกุล')));
  if (headerRowIdx < 0) headerRowIdx = 0;

  const headers = rows[headerRowIdx];
  const nameCol = headers.findIndex((h) => String(h).includes('ชื่อ-สกุล'));
  if (nameCol < 0) {
    return { ok: false, message: 'ไม่พบคอลัมน์ชื่อ-สกุล' };
  }

  const indicatorCols = [];
  headers.forEach((h, i) => {
    const s = String(h);
    if (/^3\.\d/.test(s) && !s.includes('เฉลี่ย')) {
      indicatorCols.push({ index: i, header: s, id: slugId(s), label: topicLabel(s) });
    }
  });

  if (!indicatorCols.length) {
    return { ok: false, message: 'ไม่พบคอลัมน์ตัวบ่งชี้ (3.x.x)' };
  }

  const byName = new Map();

  rows.slice(headerRowIdx + 1).forEach((row) => {
    const name = String(row[nameCol] ?? row[2] ?? '').trim();
    if (!name || name === 'ชื่อ-สกุล') return;

    const summary = {};
    indicatorCols.forEach(({ index, id }) => {
      const v = num(row[index]);
      if (v !== null && v >= 1 && v <= 3) summary[id] = v;
    });

    if (!Object.keys(summary).length) return;

    let level = 'K3';
    const k34 = summary['3.2.1ก'];
    const k45 = summary['3.2.1ข'];
    if (k34 != null && k45 == null) level = 'K1';
    else if (k45 != null && k34 == null) level = 'K2';

    const scores = Object.values(summary).filter((v) => v >= 1 && v <= 3);
    const overallAvg = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : null;

    byName.set(name, {
      name,
      level,
      assessments: { summary, overallAvg },
    });
  });

  const students = [...byName.values()];
  const topics = indicatorCols.map(({ id, label, header }) => ({
    id,
    label,
    emoji: id.startsWith('3.1') ? '🏃' : id.startsWith('3.4') ? '❤️' : id.startsWith('3.7') ? '🤝' : '💡',
    fullLabel: header,
  }));

  return {
    ok: true,
    students,
    topics,
    meta: { sheet: sheetName, count: students.length },
  };
}

/** อ่านไฟล์ สรุปผลมาตรฐานปฐมวัย_2568 */
export function parseQaStandardWorkbook(workbook) {
  const schoolSheet = workbook.Sheets['สรุปรายโรงเรียน'];
  const ind12Sheet = workbook.Sheets['ตัวบ่งชี้มาตรฐาน1และ2'];
  const ind3Sheet = workbook.Sheets['ผ่านไม่ผ่านมาตรฐาน3ข'];

  if (!schoolSheet && !ind12Sheet) {
    return { ok: false, message: 'ไม่พบชีตสรุปมาตรฐานที่รองรับ' };
  }

  let schoolSummary = null;
  if (schoolSheet) {
    const rows = XLSX.utils.sheet_to_json(schoolSheet, { header: 1, defval: '' });
    const headerIdx = rows.findIndex((r) => r[0] === 'โรงเรียน');
    if (headerIdx >= 0 && rows[headerIdx + 1]) {
      const h = rows[headerIdx];
      const r = rows[headerIdx + 1];
      schoolSummary = {};
      h.forEach((col, i) => {
        if (col) schoolSummary[col] = r[i];
      });
    }
  }

  const indicators12 = [];
  if (ind12Sheet) {
    const rows = XLSX.utils.sheet_to_json(ind12Sheet, { header: 1, defval: '' });
    const seen = new Set();
    rows.slice(1).forEach((r) => {
      const key = `${r[1]}|${r[2]}`;
      if (!r[2] || seen.has(key)) return;
      seen.add(key);
      indicators12.push({
        school: r[0],
        standard: String(r[1]),
        indicator: String(r[2]),
        score: num(r[3]),
        maxScore: num(r[4]),
        percent: num(r[5]),
      });
    });
  }

  const indicators3 = [];
  if (ind3Sheet) {
    const rows = XLSX.utils.sheet_to_json(ind3Sheet, { header: 1, defval: '' });
    const seen = new Set();
    rows.slice(1).forEach((r) => {
      const key = String(r[2]);
      if (!key || seen.has(key)) return;
      seen.add(key);
      indicators3.push({
        school: r[0],
        group: String(r[1]),
        indicator: key,
        level: num(r[3]),
        pass: num(r[4]),
        total: num(r[5]),
        percent: num(r[6]),
      });
    });
  }

  const dashboard = [];
  const dashSheet = workbook.Sheets.Dashboard;
  if (dashSheet) {
    const rows = XLSX.utils.sheet_to_json(dashSheet, { header: 1, defval: '' });
    rows.forEach((r) => {
      if (r[0] && String(r[0]).includes('มาตรฐาน')) {
        dashboard.push({
          label: r[0],
          avg: num(r[1]),
          min: num(r[2]),
          max: num(r[3]),
        });
      }
    });
  }

  return {
    ok: true,
    qaData: {
      importedAt: new Date().toISOString(),
      schoolSummary,
      indicators12,
      indicators3,
      dashboard,
    },
  };
}

export async function readWorkbookFromFile(file) {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}

export function mergeImportedStudents(existing, imported, { replace = false } = {}) {
  if (replace) {
    return imported.map((s, i) => ({
      ...s,
      id: Date.now() + i,
      attendance: s.attendance ?? { present: 0, absent: 0, total: 0 },
      parentPin: s.parentPin ?? String(1000 + Math.floor(Math.random() * 9000)),
    }));
  }

  const map = new Map(existing.map((s) => [normalizeName(s.name), s]));

  imported.forEach((imp) => {
    const key = normalizeName(imp.name);
    const prev = map.get(key);
    if (prev) {
      map.set(key, {
        ...prev,
        level: imp.level || prev.level,
        assessments: imp.assessments,
      });
    } else {
      map.set(key, {
        ...imp,
        id: Date.now() + Math.random(),
        attendance: { present: 0, absent: 0, total: 0 },
        parentPin: String(1000 + Math.floor(Math.random() * 9000)),
      });
    }
  });

  return [...map.values()];
}

function normalizeName(name) {
  return String(name).replace(/\s+/g, ' ').trim().toLowerCase();
}
