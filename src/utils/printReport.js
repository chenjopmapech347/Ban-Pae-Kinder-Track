/**
 * printReport.js
 * ฟังก์ชัน printReport สำหรับสร้าง HTML print ของสมุดรายงาน
 * extracted จาก StudentReportTab.jsx เพื่อลดขนาดไฟล์
 */
import { isoToThai } from './helpers';
import {
  PHILOSOPHY_TEXT, VISION_TEXT, AIMS, GROWTH_ROWS,
  DEV_ASSESS_DOMAINS, INTRO_LETTER,
} from '../data/reportConstants';
import {
  levelLabel, levelColor,
  PHYS_KEYS, PHYS_LABELS,
  GROWTH_MONTHS_T1, GROWTH_MONTHS_T2, GROWTH_MONTHS_ALL,
  monthRefDate, ageAt,
} from './reportHelpers';

export function printReport({ student, physData, growthRecords, devAssessment, attendanceSummary, healthServices,
                       devDomains, teacherComments, parentComments, directorsComment,
                       highlights = {},
                       academicYear, schoolName, schoolPhilosophy, schoolVision, schoolLogo,
                       teacherName, directorName }) {
  // ── Compute overall yearly level from all term2 indicator scores ──────────
  const allT2 = devDomains.flatMap(d =>
    d.standards.flatMap(std =>
      std.indicators.map(ind => ind.indScores?.term2).filter(v => v !== null && v !== undefined)
    )
  );
  const overallLevel = allT2.length ? Math.round(allT2.reduce((a, b) => a + b, 0) / allT2.length) : null;
  const overallLevelLabel = overallLevel === 3 ? 'ดี' : overallLevel === 2 ? 'พอใช้' : overallLevel === 1 ? 'ควรส่งเสริม' : '—';
  const levelBg    = overallLevel === 3 ? '#16a34a' : overallLevel === 2 ? '#ca8a04' : '#dc2626';

  // ── Determine next class level ────────────────────────────────────────────
  const cn = student?.className ?? student?.level ?? '';
  const nextLevelLabel = /อ\.?[- ]?1/i.test(cn) ? 'อนุบาลปีที่ 2'
    : /อ\.?[- ]?2/i.test(cn) ? 'อนุบาลปีที่ 3'
    : 'ระดับถัดไป';

  // ── Gender ────────────────────────────────────────────────────────────────
  const genderPrefix = student?.gender === 'F' ? 'เด็กหญิง' : 'เด็กชาย';

  const _philosophy = schoolPhilosophy?.trim() || PHILOSOPHY_TEXT;
  const _vision     = schoolVision?.trim()     || VISION_TEXT;
  const levelTag = (n) => {
    const c = n === 3 ? '#059669' : n === 2 ? '#b45309' : n === 1 ? '#dc2626' : '#9ca3af';
    return `<span style="background:${c}20;color:${c};border-radius:4px;padding:1px 5px;font-size:.75rem;font-weight:700">${levelLabel(n)}</span>`;
  };

  // ── Bar chart data: avg score per domain per term ────────────────────────
  const domainChartData = devDomains.map(domain => {
    const allInds = domain.standards.flatMap(std => std.indicators);
    const t1 = allInds.map(i => i.indScores?.term1).filter(v => v !== null && v !== undefined);
    const t2 = allInds.map(i => i.indScores?.term2).filter(v => v !== null && v !== undefined);
    const avg1 = t1.length ? t1.reduce((a, b) => a + b, 0) / t1.length : 0;
    const avg2 = t2.length ? t2.reduce((a, b) => a + b, 0) / t2.length : 0;
    const avgY = t2.length ? avg2 : (t1.length ? avg1 : 0); // yearly = term2 score
    return { label: domain.label ?? domain.name ?? '', avg1, avg2, avgY };
  });
  // append overall average group
  const allT2Chart = domainChartData.map(d => d.avg2).filter(v => v > 0);
  const allT1Chart = domainChartData.map(d => d.avg1).filter(v => v > 0);
  const overallAvg1 = allT1Chart.length ? allT1Chart.reduce((a, b) => a + b, 0) / allT1Chart.length : 0;
  const overallAvg2 = allT2Chart.length ? allT2Chart.reduce((a, b) => a + b, 0) / allT2Chart.length : 0;
  domainChartData.push({ label: 'สรุปการประเมินเพื่อ\nความก้าวหน้า', avg1: overallAvg1, avg2: overallAvg2, avgY: overallAvg2, isOverall: true });

  const BAR_MAX = 3;
  const pct = (v) => Math.round((v / BAR_MAX) * 100);
  // bars only (no label) — labels go in a separate row below the baseline
  const chartGroupHtml = domainChartData.map((d) => `
    <div style="flex:1;display:flex;align-items:flex-end;justify-content:center;gap:3px;height:160px">
      <div style="width:22px;background:#3b82f6;height:${Math.max(pct(d.avg1),1)}%;position:relative;border-radius:2px 2px 0 0" title="ภาคเรียนที่ 1: ${d.avg1.toFixed(2)}">
        ${d.avg1 > 0 ? `<span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;color:#374151;white-space:nowrap">${d.avg1.toFixed(1)}</span>` : ''}
      </div>
      <div style="width:22px;background:#10b981;height:${Math.max(pct(d.avg2),1)}%;position:relative;border-radius:2px 2px 0 0" title="ภาคเรียนที่ 2: ${d.avg2.toFixed(2)}">
        ${d.avg2 > 0 ? `<span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;color:#374151;white-space:nowrap">${d.avg2.toFixed(1)}</span>` : ''}
      </div>
      <div style="width:22px;background:#f97316;height:${Math.max(pct(d.avgY),1)}%;position:relative;border-radius:2px 2px 0 0" title="สรุปปี: ${d.avgY.toFixed(2)}">
        ${d.avgY > 0 ? `<span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;color:#374151;white-space:nowrap">${d.avgY.toFixed(1)}</span>` : ''}
      </div>
    </div>
  `).join('');
  // labels below the chart baseline
  const chartLabelHtml = domainChartData.map((d, i) => `
    <div style="flex:1;font-size:.65rem;text-align:center;color:#374151;line-height:1.4;padding:4px 2px 0;${d.isOverall ? 'font-weight:700' : ''}">
      ${i + 1 <= 4 ? `${i + 1}. ` : ''}${d.label.replace('\n', '<br>')}
    </div>
  `).join('');

  const physRows = PHYS_KEYS.map((k, i) => {
    const p = physData[k] ?? {};
    return `<tr>
      <td style="padding:4px 8px;border:1px solid #d1d5db">${PHYS_LABELS[i]}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${isoToThai(p.date) || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${p.weight || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${levelTag(p.weightLevel)}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${p.height || '—'}</td>
      <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center">${levelTag(p.heightLevel)}</td>
    </tr>`;
  }).join('');

  // บันทึกการเจริญเติบโตรายเดือน — layout แนวนอน (เดือนเป็นคอลัมน์)
  function growthAgeLabel(monthNum) {
    if (!student?.birthDate) return '';
    const { ageYear, ageMonth } = ageAt(student.birthDate, monthRefDate(monthNum, academicYear));
    return `${ageYear}ปี ${ageMonth}ด.`;
  }
  const gr = growthRecords ?? {};
  const thStyle = 'padding:3px 6px;border:1px solid #888;text-align:center;background:#d0d0d0;font-size:8.5px';
  const tdStyle = 'padding:3px 4px;border:1px solid #888;text-align:center;font-size:8.5px';
  const t1Cols = GROWTH_MONTHS_T1.map(m => `<th style="${thStyle}">${m.label}</th>`).join('');
  const t2Cols = GROWTH_MONTHS_T2.map(m => `<th style="${thStyle}">${m.label}</th>`).join('');
  const growthHtml = `
    <table style="width:100%;border-collapse:collapse;margin-top:4px">
      <thead>
        <tr>
          <th rowspan="2" style="${thStyle};width:80px;text-align:left;padding-left:6px">รายการ</th>
          <th colspan="6" style="${thStyle}">ภาคเรียนที่ 1</th>
          <th colspan="5" style="${thStyle}">ภาคเรียนที่ 2</th>
        </tr>
        <tr>${t1Cols}${t2Cols}</tr>
      </thead>
      <tbody>
        <tr>
          <td style="${tdStyle};text-align:left;padding-left:6px">อายุ</td>
          ${GROWTH_MONTHS_T1.map(m => `<td style="${tdStyle};font-size:7.5px">${growthAgeLabel(m.num)}</td>`).join('')}
          ${GROWTH_MONTHS_T2.map(m => `<td style="${tdStyle};font-size:7.5px">${growthAgeLabel(m.num)}</td>`).join('')}
        </tr>
        <tr>
          <td style="${tdStyle};text-align:left;padding-left:6px">น้ำหนัก (กก.)</td>
          ${GROWTH_MONTHS_T1.map(m => `<td style="${tdStyle}">${(gr[m.key]?.weight) || ''}</td>`).join('')}
          ${GROWTH_MONTHS_T2.map(m => `<td style="${tdStyle}">${(gr[m.key]?.weight) || ''}</td>`).join('')}
        </tr>
        <tr>
          <td style="${tdStyle};text-align:left;padding-left:6px">ส่วนสูง (ซม.)</td>
          ${GROWTH_MONTHS_T1.map(m => `<td style="${tdStyle}">${(gr[m.key]?.height) || ''}</td>`).join('')}
          ${GROWTH_MONTHS_T2.map(m => `<td style="${tdStyle}">${(gr[m.key]?.height) || ''}</td>`).join('')}
        </tr>
      </tbody>
    </table>
    <div style="font-size:7.5px;color:#555;margin-top:4px">
      <strong>หมายเหตุ:</strong>
      ระดับ 3 หมายถึง ปกติ / เป็นไปตามเกณฑ์มาตรฐาน &nbsp;·&nbsp;
      ระดับ 2 หมายถึง ค่อนข้างปกติ / ค่อนข้างมาก หรือ ค่อนข้างน้อยกว่าเกณฑ์มาตรฐาน &nbsp;·&nbsp;
      ระดับ 1 หมายถึง ไม่ปกติ ควรส่งเสริม / มาก หรือน้อยกว่าเกณฑ์มาตรฐาน
    </div>`;

  // ── ความสามารถผู้เรียน 4 ด้าน — print HTML ──────────────────────────────────
  const da = devAssessment ?? {};
  const lvBadge = (n) => {
    const c = n === 3 ? '#059669' : n === 2 ? '#b45309' : n === 1 ? '#dc2626' : '#9ca3af';
    return n > 0
      ? `<span style="background:${c}20;color:${c};border-radius:4px;padding:1px 6px;font-size:.75rem;font-weight:700">${n}</span>`
      : '<span style="color:#9ca3af">—</span>';
  };
  const thDA = 'padding:5px 8px;border:1px solid #d1d5db;font-weight:700;font-size:.78rem;background:#f3f4f6;text-align:center';
  const tdDA = 'padding:5px 8px;border:1px solid #d1d5db;font-size:.78rem;vertical-align:top';
  const renderDevCompRows = (components, domain, startIdx = 0) =>
    components.map((comp, ci) => {
      const row = da[comp.key] ?? {};
      const rowBg = (startIdx + ci) % 2 === 0 ? 'white' : '#fafafa';
      return `<tr style="background:${rowBg}">
        <td style="${tdDA};white-space:nowrap;color:${domain.color};font-weight:800">${comp.code}</td>
        <td style="${tdDA};font-weight:700">${comp.label}</td>
        <td style="${tdDA};font-size:.72rem;color:#4b5563;white-space:pre-line">${comp.descriptor}</td>
        <td style="${tdDA};text-align:center">${lvBadge(row.t1level ?? 0)}</td>
        <td style="${tdDA};text-align:center">${lvBadge(row.t2level ?? 0)}</td>
        <td style="${tdDA};text-align:center;font-weight:800">${lvBadge(row.summary ?? 0)}</td>
      </tr>`;
    }).join('');

  const devAssessHtml = (() => {
    const allRows = DEV_ASSESS_DOMAINS.map(domain => {
      let domainRows;
      if (domain.subDomains) {
        let idxOffset = 0;
        const subRows = domain.subDomains.map(sub => {
          const subHeader = `<tr style="background:${domain.color}10">
            <td colspan="6" style="padding:4px 12px;border:1px solid #d1d5db;font-weight:700;font-size:.8rem;color:${domain.color}">
              ${sub.label}
            </td>
          </tr>`;
          const rows = renderDevCompRows(sub.components, domain, idxOffset);
          idxOffset += sub.components.length;
          return subHeader + rows;
        }).join('');
        const dsSummary = da[`__domainSummary_${domain.id}`];
        const dsSummaryRow = dsSummary
          ? `<tr><td colspan="6" style="${tdDA};background:${domain.color}08;padding:8px 12px">
              <strong style="color:${domain.color}">📝 สรุปพัฒนาการด้าน${domain.label}</strong><br/>
              <span style="white-space:pre-line;line-height:1.7">${dsSummary}</span>
             </td></tr>`
          : '';
        domainRows = subRows + dsSummaryRow;
      } else {
        const dsSummary = da[`__domainSummary_${domain.id}`];
        const dsSummaryRow = dsSummary
          ? `<tr><td colspan="6" style="${tdDA};background:${domain.color}08;padding:8px 12px">
              <strong style="color:${domain.color}">📝 สรุปพัฒนาการด้าน${domain.label}</strong><br/>
              <span style="white-space:pre-line;line-height:1.7">${dsSummary}</span>
             </td></tr>`
          : '';
        domainRows = renderDevCompRows(domain.components, domain) + dsSummaryRow;
      }
      // แต่ละ domain เป็น table ของตัวเอง พร้อม thead ที่ repeat ทั้งหัวคอลัมน์ + หัว domain
      return `<table style="width:100%;border-collapse:collapse;margin:0;margin-bottom:-1px">
        <thead style="display:table-header-group">
          <tr>
            <th style="${thDA};width:48px">รหัส</th>
            <th style="${thDA}">องค์ประกอบ</th>
            <th style="${thDA}">สภาพที่พึงประสงค์</th>
            <th style="${thDA};width:52px">ภาค 1</th>
            <th style="${thDA};width:52px">ภาค 2</th>
            <th style="${thDA};width:52px">สรุป</th>
          </tr>
          <tr style="background:${domain.color}20">
            <td colspan="6" style="padding:6px 10px;border:1px solid #d1d5db;font-weight:900;font-size:.85rem;color:${domain.color}">
              ${domain.emoji} พัฒนาการ${domain.label}
            </td>
          </tr>
        </thead>
        <tbody>${domainRows}</tbody>
      </table>`;
    }).join('');

    return `<div>
      <h2 style="font-size:.95rem;margin:14px 0 4px;background:#f3f4f6;padding:4px 8px;border-radius:4px">3. บันทึกผลการประเมินพัฒนาการ — ความสามารถผู้เรียนเมื่อจบชั้นปี</h2>
      <p style="font-size:.78rem;color:#555;margin-bottom:6px">อนุบาลปีที่ 2 (อายุ 4–5 ปี) · ระดับ 3 = ดี · ระดับ 2 = พอใช้ · ระดับ 1 = ปรับปรุง</p>
      ${allRows}
    </div>`;
  })();

  const attRows = [1, 2].map(t => {
    const a = attendanceSummary[`term${t}`] ?? {};
    const yearly = t === 2
      ? `<tr><td colspan="2" style="padding:3px 6px;border:1px solid #374151;font-weight:700;font-size:.8rem">ตลอดปี</td>
          <td style="padding:3px 6px;border:1px solid #374151;text-align:center;font-size:.8rem">${(attendanceSummary.term1?.totalDays ?? 0) + (attendanceSummary.term2?.totalDays ?? 0)}</td>
          <td style="padding:3px 6px;border:1px solid #374151;text-align:center;font-size:.8rem">${(attendanceSummary.term1?.presentDays ?? 0) + (attendanceSummary.term2?.presentDays ?? 0)}</td>
          <td style="padding:3px 6px;border:1px solid #374151;text-align:center;font-size:.8rem">${(attendanceSummary.term1?.absentDays ?? 0) + (attendanceSummary.term2?.absentDays ?? 0)}</td>
         </tr>` : '';
    return `<tr>
      <td colspan="2" style="padding:3px 6px;border:1px solid #374151;font-size:.8rem">ภาคเรียนที่ ${t}</td>
      <td style="padding:3px 6px;border:1px solid #374151;text-align:center;font-size:.8rem">${a.totalDays ?? '—'}</td>
      <td style="padding:3px 6px;border:1px solid #374151;text-align:center;font-size:.8rem">${a.presentDays ?? '—'}</td>
      <td style="padding:3px 6px;border:1px solid #374151;text-align:center;font-size:.8rem">${a.absentDays ?? '—'}</td>
    </tr>${yearly}`;
  }).join('');

  const hsRows = (healthServices ?? []).map(h =>
    `<tr>
      <td style="padding:3px 6px;border:1px solid #374151;font-size:.8rem">${isoToThai(h.date) || '—'}</td>
      <td style="padding:3px 6px;border:1px solid #374151;font-size:.8rem">${h.service || '—'}</td>
      <td style="padding:3px 6px;border:1px solid #374151;font-size:.8rem">${h.note || ''}</td>
    </tr>`
  ).join('') || `<tr><td colspan="3" style="padding:6px;text-align:center;color:#9ca3af;border:1px solid #374151;font-size:.8rem">ไม่มีข้อมูล</td></tr>`;

  const devHtml = (() => {
    const allRows = devDomains.map((domain, di) => {
      const stdRows = domain.standards.map(std => {
        const indRows = std.indicators.map(ind => {
          const actRows = ind.actIds.map(actId => {
            const t1 = ind.scores[actId]?.term1 ?? null;
            const t2 = ind.scores[actId]?.term2 ?? null;
            return `<tr>
              <td style="padding:3px 8px;border:1px solid #d1d5db;font-size:.78rem">${ind.actLabels[actId] || actId}</td>
              <td style="padding:3px 8px;border:1px solid #d1d5db;text-align:center">${t1 !== null ? levelTag(Math.round(t1)) : '—'}</td>
              <td style="padding:3px 8px;border:1px solid #d1d5db;text-align:center">${t2 !== null ? levelTag(Math.round(t2)) : '—'}</td>
            </tr>`;
          }).join('');
          const st1 = ind.indScores.term1, st2 = ind.indScores.term2;
          // ห่อแต่ละตัวบ่งชี้ด้วย tbody เพื่อป้องกัน header ลอยท้ายหน้า
          return `<tbody style="break-inside:avoid;page-break-inside:avoid">
            ${actRows}
            <tr style="background:#f9fafb">
              <td style="padding:4px 8px;border:1px solid #d1d5db;font-weight:700;font-size:.8rem">สรุปตัวบ่งชี้ ${ind.label}</td>
              <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center;font-weight:700">${st1 !== null ? st1.toFixed(1) : '—'}</td>
              <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center;font-weight:700">${st2 !== null ? st2.toFixed(1) : '—'}</td>
            </tr>
          </tbody>`;
        }).join('');
        return `<tbody style="break-inside:avoid;page-break-inside:avoid">
          <tr style="background:${domain.bg}">
            <td colspan="3" style="padding:5px 8px;border:1px solid #d1d5db;font-weight:800;font-size:.82rem;color:${domain.color}">${std.title}</td>
          </tr>
        </tbody>${indRows}`;
      }).join('');
      // อารมณ์(1) และสติปัญญา(3) เริ่มหน้าใหม่, ร่างกาย(0) และพลเมือง(2) ไหลต่อเนื่อง
      const pageBreak = (di === 1 || di === 3) ? 'page-break-before:always;break-before:page;' : '';
      return `<table style="width:100%;border-collapse:collapse;margin:0;margin-bottom:-1px;${pageBreak}
        <thead style="display:table-header-group">
          <tr>
            <th style="width:60%;background:#f3f4f6;padding:5px 8px;border:1px solid #d1d5db;font-weight:700;font-size:.8rem;text-align:left">พฤติกรรม / ตัวบ่งชี้</th>
            <th style="background:#f3f4f6;padding:5px 8px;border:1px solid #d1d5db;font-weight:700;font-size:.8rem;text-align:center">ภาคเรียน 1</th>
            <th style="background:#f3f4f6;padding:5px 8px;border:1px solid #d1d5db;font-weight:700;font-size:.8rem;text-align:center">ภาคเรียน 2</th>
          </tr>
          <tr style="background:${domain.color}20">
            <td colspan="3" style="padding:6px 8px;border:1px solid #d1d5db;font-weight:900;font-size:.88rem;color:${domain.color}">${domain.emoji} พัฒนาการด้าน${domain.label}</td>
          </tr>
        </thead>
        <tbody>${stdRows}</tbody>
      </table>`;
    }).join('');
    return `<div style="page-break-before:always;break-before:page">
      <h2 style="font-size:.95rem;margin:14px 0 4px;background:#f3f4f6;padding:4px 8px;border-radius:4px">4. ผลการประเมินตัวบ่งชี้</h2>
      ${allRows}
    </div>`;
  })();

  const photoHtml = student?.photo
    ? `<img src="${student.photo}" alt="รูปนักเรียน"
         style="width:160px;height:160px;border-radius:50%;object-fit:cover;
                border:4px solid #4f46e5;box-shadow:0 4px 16px rgba(79,70,229,.25)">`
    : `<div style="width:160px;height:160px;border-radius:50%;
                   background:linear-gradient(135deg,#e0e7ff,#c7d2fe);
                   border:4px solid #4f46e5;display:flex;align-items:center;
                   justify-content:center;font-size:5rem;line-height:1">
         ${(student?.name ?? '').includes('ชาย') ? '👦' : '👧'}
       </div>`;

  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>สมุดรายงานประจำตัว — ${student?.name ?? ''}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
      body { font-family:'Sarabun',sans-serif; font-size:13px; margin:1in; color:#111; }
      h1 { text-align:center; font-size:1.1rem; margin-bottom:4px; }
      h2 { font-size:.95rem; margin:14px 0 4px; background:#f3f4f6; padding:4px 8px; border-radius:4px; }
      table { width:100%; border-collapse:collapse; margin-bottom:12px; }
      th { background:#f3f4f6; padding:5px 8px; border:1px solid #d1d5db; font-weight:700; font-size:.8rem; }
      .page-break { page-break-after:always; break-after:page; margin-bottom:20px; }
      @page { size:A4 portrait; margin:1in; }
      @media print {
        body { margin:0; padding:0; } /* @page already sets 1in margin — no doubling */
        .page-break { page-break-after:always; break-after:page; }
      }
    </style>
  </head><body>

    <!-- ══ หน้าปก ══ -->
    <div class="page-break" style="
      min-height:calc(100vh - 2in);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center; padding:40px 20px; box-sizing:border-box;
      background:white;
      border:3px solid #4f46e5; border-radius:8px;
    ">
      <!-- ดวงตราสถานศึกษา / header bar -->
      <div style="
        background:linear-gradient(135deg,#4f46e5,#7c3aed);
        color:white; width:100%; padding:14px 20px; margin-bottom:36px;
        border-radius:6px; box-shadow:0 4px 16px rgba(79,70,229,.3);
      ">
        ${schoolLogo ? `<div style="margin-bottom:8px"><img src="${schoolLogo}" style="height:60px;object-fit:contain;filter:brightness(0) invert(1)"/></div>` : ''}
        <div style="font-size:1.1rem;font-weight:800;letter-spacing:.5px">
          ${schoolName.startsWith('โรงเรียน') ? schoolName : 'โรงเรียน' + schoolName}
        </div>
        <div style="font-size:.85rem;opacity:.85;margin-top:3px">
          สังกัดกองการศึกษา เทศบาลตำบลบ้านเพ อำเภอเมืองระยอง จังหวัดระยอง
        </div>
      </div>

      <!-- ชื่อสมุด -->
      <div style="margin-bottom:8px">
        <div style="font-size:1.5rem;font-weight:800;color:#1e1b4b;letter-spacing:.5px;line-height:1.4">
          สมุดรายงานประจำตัว
        </div>
        <div style="font-size:1.3rem;font-weight:800;color:#1e1b4b">
          เด็กปฐมวัย
        </div>
        <div style="font-size:.82rem;color:#6b7280;margin-top:6px">
          (ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2568)
        </div>
      </div>

      <!-- เส้นคั่น -->
      <div style="width:80px;height:3px;background:linear-gradient(90deg,#4f46e5,#7c3aed);
                  border-radius:2px;margin:18px auto"></div>

      <!-- รูปเด็ก -->
      <div style="margin:18px 0">
        ${photoHtml}
      </div>

      <!-- ชื่อนักเรียน -->
      <div style="
        background:white; border:2px solid #c7d2fe; border-radius:12px;
        padding:16px 40px; margin:16px 0; box-shadow:0 2px 8px rgba(79,70,229,.1);
        min-width:280px;
      ">
        <div style="font-size:.72rem;font-weight:700;color:#6b7280;letter-spacing:.5px;margin-bottom:6px">
          ชื่อ–สกุล
        </div>
        <div style="font-size:1.2rem;font-weight:800;color:#1e1b4b">
          ${student?.name ?? '—'}
        </div>
        <div style="height:1px;background:#e0e7ff;margin:10px 0"></div>
        <div style="display:flex;justify-content:center;gap:32px;font-size:.85rem">
          <div>
            <div style="font-size:.7rem;color:#9ca3af;font-weight:600">ชั้น/ห้อง</div>
            <div style="font-weight:700;color:#4f46e5">${student?.className ?? student?.level ?? '—'}</div>
          </div>
          <div>
            <div style="font-size:.7rem;color:#9ca3af;font-weight:600">ปีการศึกษา</div>
            <div style="font-weight:700;color:#4f46e5">${academicYear}</div>
          </div>
          ${student?.birthDate ? `<div>
            <div style="font-size:.7rem;color:#9ca3af;font-weight:600">วันเกิด</div>
            <div style="font-weight:700;color:#4f46e5">${isoToThai(student.birthDate)}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- ลายเซ็น -->
      <div style="margin-top:36px;display:flex;gap:64px;justify-content:center">
        <div style="text-align:center">
          <div style="height:48px"></div>
          <div style="border-top:1px solid #6b7280;width:160px;padding-top:5px;font-size:.78rem;color:#4b5563">
            ลงชื่อครูประจำชั้น
          </div>
        </div>
        <div style="text-align:center">
          <div style="height:48px"></div>
          <div style="border-top:1px solid #6b7280;width:160px;padding-top:5px;font-size:.78rem;color:#4b5563">
            ผู้อำนวยการ
          </div>
        </div>
      </div>

      <!-- footer -->
      <div style="margin-top:auto;padding-top:32px;font-size:.72rem;color:#9ca3af">
        KinderTrack · ระบบบันทึกพัฒนาการเด็กปฐมวัย
      </div>
    </div>

    <!-- ══ หน้า 1: คำชี้แจงถึงผู้ปกครอง ══ -->
    <div class="page-break">
      <h1 style="margin-bottom:16px">สมุดรายงานประจำตัวเด็กปฐมวัย</h1>
      <p style="text-align:center;margin-bottom:20px;font-size:.85rem;color:#555">
        ${schoolName.startsWith('โรงเรียน') ? schoolName : 'โรงเรียน' + schoolName} · ปีการศึกษา ${academicYear}
      </p>
      <p style="font-size:.9rem;font-weight:700;margin-bottom:12px">เรียน ท่านผู้ปกครอง</p>
      ${INTRO_LETTER.split('\n').filter(l => l.trim()).map(line =>
        `<p style="font-size:.85rem;line-height:2;text-align:justify;text-indent:1cm;margin:0 0 6px">${line.trim()}</p>`
      ).join('')}
      <div style="margin-top:48px;text-align:right">
        <div style="display:inline-block;text-align:center">
          <div style="height:60px"></div>
          <div style="border-top:1px solid #000;width:220px;padding-top:4px;font-size:.82rem">
            ผู้อำนวยการสถานศึกษา
          </div>
        </div>
      </div>
    </div>

    <!-- ══ หน้า 2: ปรัชญา/วิสัยทัศน์ + จุดมุ่งหมาย ══ -->
    <div class="page-break">
      <div style="border:2px solid #333;padding:8px 16px;text-align:center;font-size:1rem;font-weight:800;margin-bottom:20px;display:inline-block">
        ปรัชญาการศึกษาปฐมวัย
      </div>
      <p style="font-size:.87rem;line-height:2;text-align:justify;text-indent:1cm;margin-bottom:28px">${_philosophy}</p>
      <div style="border:2px solid #333;padding:8px 16px;text-align:center;font-size:1rem;font-weight:800;margin-bottom:20px;display:inline-block">
        วิสัยทัศน์
      </div>
      <p style="font-size:.87rem;line-height:2;text-align:justify;text-indent:1cm;margin-bottom:28px">${_vision}</p>
      <div style="border:2px solid #333;padding:8px 16px;text-align:center;font-size:1rem;font-weight:800;margin-bottom:20px;display:inline-block">
        จุดมุ่งหมายของหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2568
      </div>
      <p style="font-size:.85rem;line-height:1.9;text-align:justify;margin-bottom:20px;text-indent:1cm">
        หลักสูตรการศึกษาปฐมวัย พุทธศักราช 2568 มุ่งให้เด็กอายุตั้งแต่แรกเกิดจนถึง 6 ปีบริบูรณ์ ได้รับการพัฒนาทุกด้านอย่างสมดุลและต่อเนื่อง โดยมีจุดมุ่งหมายให้เด็กมีคุณลักษณะที่พึงประสงค์ ดังนี้
      </p>
      <ol style="font-size:.87rem;line-height:2.2;padding-left:1cm;margin:0">
        ${AIMS.map(a => `<li style="margin-bottom:4px;text-align:justify">${a}</li>`).join('')}
      </ol>
    </div>

    <!-- ══ หน้า 5: เกณฑ์มาตรฐานน้ำหนักและส่วนสูง ══ -->
    <div class="page-break" style="page-break-before:always;break-before:page;margin-top:0">
      <h2 style="text-align:center;font-size:.88rem;margin-top:0;margin-bottom:2px">
        ตารางแสดงการเจริญเติบโตของเพศชายและหญิง อายุ 3–6 ปี
      </h2>
      <p style="text-align:center;font-size:.67rem;color:#666;margin-bottom:3px">
        กองโภชนาการ กรมอนามัย กระทรวงสาธารณสุข พ.ศ. 2543 · ตั้งแต่ = –2SD · จนถึง = +2SD
      </p>
      <table style="font-size:.67rem;line-height:1.2">
        <thead>
          <tr style="background:#1e3a5f;color:white">
            <th rowspan="3" style="padding:3px 5px;border:1px solid #374151;text-align:center">ปี</th>
            <th rowspan="3" style="padding:3px 5px;border:1px solid #374151;text-align:center">เดือน</th>
            <th colspan="4" style="padding:3px 5px;border:1px solid #374151;text-align:center">น้ำหนักมาตรฐาน (กิโลกรัม)</th>
            <th colspan="4" style="padding:3px 5px;border:1px solid #374151;text-align:center">ส่วนสูงมาตรฐาน (เซนติเมตร)</th>
          </tr>
          <tr style="background:#1e3a5f;color:white">
            <th colspan="2" style="padding:2px 5px;border:1px solid #374151;text-align:center">ชาย</th>
            <th colspan="2" style="padding:2px 5px;border:1px solid #374151;text-align:center">หญิง</th>
            <th colspan="2" style="padding:2px 5px;border:1px solid #374151;text-align:center">ชาย</th>
            <th colspan="2" style="padding:2px 5px;border:1px solid #374151;text-align:center">หญิง</th>
          </tr>
          <tr style="background:#2d4a6e;color:#e5e7eb;font-size:.62rem">
            ${['ตั้งแต่','จนถึง','ตั้งแต่','จนถึง','ตั้งแต่','จนถึง','ตั้งแต่','จนถึง'].map(l => `<th style="padding:2px 4px;border:1px solid #374151;text-align:center">${l}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${GROWTH_ROWS.map((r, idx) => `
            <tr style="background:${r.month === 0 ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#f9fafb'}">
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center;font-weight:${r.month === 0 ? 700 : 400}">${r.month === 0 ? r.year : ''}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.month}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.bwl}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.bwh}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.gwl}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.gwh}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.bhl}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.bhh}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.ghl}</td>
              <td style="padding:2px 5px;border:1px solid #6b7280;text-align:center">${r.ghh}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- ══ หน้า 4+: ข้อมูลนักเรียน ══ -->
    <h1>สมุดรายงานประจำตัวเด็กปฐมวัย</h1>
    <div style="text-align:center;margin-bottom:12px;font-size:.85rem;color:#6b7280">
      ปีการศึกษา ${academicYear} · ${schoolName.startsWith('โรงเรียน') ? schoolName : 'โรงเรียน' + schoolName}
    </div>
    <table style="margin-bottom:12px">
      <tr>
        <td style="padding:3px 8px;width:25%"><strong>ชื่อ-สกุล:</strong></td>
        <td style="padding:3px 8px">${student?.name ?? '—'}</td>
        <td style="padding:3px 8px;width:20%"><strong>ชั้น:</strong></td>
        <td style="padding:3px 8px">${student?.className ?? student?.level ?? '—'}</td>
      </tr>
      <tr>
        <td style="padding:3px 8px"><strong>วันเกิด:</strong></td>
        <td style="padding:3px 8px">${isoToThai(student?.birthDate) || '—'}</td>
        <td style="padding:3px 8px"><strong>ผู้ปกครอง:</strong></td>
        <td style="padding:3px 8px">${student?.parentName ?? '—'}</td>
      </tr>
    </table>

    <h2>1. บันทึกพัฒนาการด้านร่างกาย (น้ำหนัก/ส่วนสูง)</h2>
    <table>
      <tr>
        <th>ครั้งที่</th><th>วันที่วัด</th>
        <th>น้ำหนัก (กก.)</th><th>ระดับ</th>
        <th>ส่วนสูง (ซม.)</th><th>ระดับ</th>
      </tr>
      ${physRows}
    </table>

    <h2 style="margin-top:14px">บันทึกการเจริญเติบโตของร่างกาย</h2>
    ${growthHtml}

    <!-- ══ เวลามาเรียน ══ -->
    <div class="page-break">
      <h2>2. เวลามาเรียน (คิดเป็นวัน)</h2>
      <table style="font-size:.8rem">
        <tr>
          <th colspan="2" style="padding:4px 6px;border:1px solid #374151;background:#f3f4f6;font-weight:700">ภาคเรียน</th>
          <th style="padding:4px 6px;border:1px solid #374151;background:#f3f4f6;font-weight:700">เวลาเรียนเต็ม</th>
          <th style="padding:4px 6px;border:1px solid #374151;background:#f3f4f6;font-weight:700">มาเรียน</th>
          <th style="padding:4px 6px;border:1px solid #374151;background:#f3f4f6;font-weight:700">ไม่มาเรียน</th>
        </tr>
        ${attRows}
      </table>
    </div>

    ${devAssessHtml}

    ${devHtml}

    <!-- ══ ข้อ 5 สรุป 4 มาตรฐาน (หลักสูตรปฐมวัย พ.ศ. 2568) ══ -->
    <div style="page-break-before:always;break-before:page">
    <h2>5. สรุปผลการประเมินพัฒนาการตามมาตรฐาน (หลักสูตรการศึกษาปฐมวัย พ.ศ. 2568)</h2>
    <table style="font-size:.73rem">
      <tr>
        <th style="width:36px;padding:3px 5px;border:1px solid #d1d5db;background:#f3f4f6">ลำดับ</th>
        <th style="padding:3px 5px;border:1px solid #d1d5db;background:#f3f4f6">มาตรฐานคุณลักษณะที่พึงประสงค์</th>
        <th colspan="3" style="text-align:center;padding:3px 5px;border:1px solid #d1d5db;background:#f3f4f6">ภาคเรียน 1</th>
        <th colspan="3" style="text-align:center;padding:3px 5px;border:1px solid #d1d5db;background:#f3f4f6">ภาคเรียน 2</th>
        <th style="padding:3px 5px;border:1px solid #d1d5db;background:#f3f4f6">สรุปตลอดปี</th>
      </tr>
      <tr>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6"></th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6"></th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6">3</th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6">2</th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6">1</th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6">3</th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6">2</th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6">1</th>
        <th style="padding:2px 5px;border:1px solid #d1d5db;background:#f3f4f6"></th>
      </tr>
      ${devDomains.map(domain => {
        const domainRows = domain.standards.map((std, si) => {
          const allIndScores1 = std.indicators.map(ind => ind.indScores.term1).filter(v => v !== null);
          const allIndScores2 = std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null);
          const t1 = allIndScores1.length ? Math.round(allIndScores1.reduce((a,b)=>a+b,0)/allIndScores1.length) : null;
          const t2 = allIndScores2.length ? Math.round(allIndScores2.reduce((a,b)=>a+b,0)/allIndScores2.length) : null;
          const yearly = t2;
          return `<tr>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center">${std.stdNo ?? (si+1)}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db">${std.title}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center">${t1 === 3 ? '✓' : ''}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center">${t1 === 2 ? '✓' : ''}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center">${t1 === 1 ? '✓' : ''}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center">${t2 === 3 ? '✓' : ''}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center">${t2 === 2 ? '✓' : ''}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center">${t2 === 1 ? '✓' : ''}</td>
            <td style="padding:3px 5px;border:1px solid #d1d5db;text-align:center;font-weight:700">${yearly !== null ? yearly : '—'}</td>
          </tr>`;
        }).join('');
        const allDomainT2 = domain.standards.flatMap(std =>
          std.indicators.map(ind => ind.indScores.term2).filter(v => v !== null)
        );
        const domainYearly = allDomainT2.length ? Math.round(allDomainT2.reduce((a,b)=>a+b,0)/allDomainT2.length) : null;
        return `<tr style="background:#f0f0f0">
          <td colspan="8" style="padding:4px 8px;border:1px solid #d1d5db;font-weight:800">${domain.emoji} ด้าน${domain.label}</td>
          <td style="padding:4px 8px;border:1px solid #d1d5db;text-align:center;font-weight:800">${domainYearly !== null ? domainYearly : '—'}</td>
        </tr>${domainRows}`;
      }).join('')}
    </table>
    <p style="font-size:.7rem;color:#666">หมายเหตุ: สรุปตลอดปีการศึกษา นำผลการประเมินภาคเรียนที่ 2 มารวมกัน แล้วหารด้วยจำนวนมาตรฐานในด้านพัฒนาการนั้น</p>
    </div>

    <!-- ══ หน้า: สมรรถนะผู้เรียน (bar chart) ══ -->
    <div class="page-break">
      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-block;border:2px solid #333;padding:6px 20px;font-size:1rem;font-weight:800">
          สมรรถนะผู้เรียน
        </div>
      </div>
      <div style="padding:20px 8px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
        <!-- bars + Y-axis row — shared border-bottom = single x-axis baseline -->
        <div style="display:flex;align-items:flex-end;border-bottom:2px solid #374151">
          <!-- Y-axis labels -->
          <div style="position:relative;height:160px;min-width:28px;flex-shrink:0;font-size:.7rem;color:#6b7280;text-align:right">
            <span style="position:absolute;top:0;right:4px;transform:translateY(-50%)">๓</span>
            <span style="position:absolute;top:33.3%;right:4px;transform:translateY(-50%)">๒</span>
            <span style="position:absolute;top:66.7%;right:4px;transform:translateY(-50%)">๑</span>
            <span style="position:absolute;bottom:0;right:4px;transform:translateY(50%)">๐</span>
          </div>
          ${chartGroupHtml}
        </div>
        <!-- label row — separate from bars so baseline stays aligned -->
        <div style="display:flex;padding-left:28px">
          ${chartLabelHtml}
        </div>
      </div>
      <!-- Legend -->
      <div style="display:flex;gap:20px;justify-content:center;margin-top:12px;font-size:.75rem">
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;background:#3b82f6;border-radius:2px"></div>ภาคเรียนที่ ๑</div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;background:#10b981;border-radius:2px"></div>ภาคเรียนที่ ๒</div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;background:#f97316;border-radius:2px"></div>สรุปปี ${academicYear}</div>
      </div>
    </div>

    <h2>6. ความคิดเห็นของครู</h2>
    <p style="font-weight:700">ภาคเรียนที่ 1:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${teacherComments?.term1 || '—'}</p>
    <p style="font-weight:700">ภาคเรียนที่ 2:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${teacherComments?.term2 || '—'}</p>

    <h2>7. ความคิดเห็นของผู้ปกครอง</h2>
    <p style="font-weight:700">ภาคเรียนที่ 1:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${parentComments?.term1 || '—'}</p>
    <p style="font-weight:700">ภาคเรียนที่ 2:</p>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${parentComments?.term2 || '—'}</p>

    <h2>8. ความคิดเห็นของผู้อำนวยการสถานศึกษา</h2>
    <p style="min-height:60px;border:1px solid #d1d5db;border-radius:4px;padding:8px;font-size:.85rem">${directorsComment || '—'}</p>

    ${overallLevel !== null ? `
    <div style="margin-top:28px;padding:14px 18px;border:1.5px solid #d1d5db;border-radius:8px;background:#f9fafb;font-size:.87rem;line-height:2;text-align:justify">
      สรุปผลการประเมินภาพรวมเมื่อจบชั้นปีการศึกษา ${academicYear} จากการประเมินพัฒนาการทั้ง ๔ ด้าน
      พบว่า ${genderPrefix} ${student?.name ?? ''} มีผลการประเมินอยู่ในเกณฑ์
      <strong style="display:inline-block;padding:1px 10px;border-radius:4px;background:${levelBg};color:#fff;margin:0 4px">
        ระดับ ${overallLevel} (${overallLevelLabel})
      </strong>
      มีความพร้อมในการเลื่อนชั้นขึ้นสู่ระดับชั้น <strong>${nextLevelLabel}</strong> ต่อไป
    </div>` : ''}

    <div style="margin-top:32px;display:flex;justify-content:space-around">
      <div style="min-width:200px">
        <div style="height:52px"></div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:.85rem;text-align:left">
          ลงชื่อ..................................ครูประจำชั้น
        </div>
        <div style="font-size:.82rem;color:#374151;margin-top:4px;text-align:left;padding-left:2.5rem">(..................................)</div>
      </div>
      <div style="min-width:200px">
        <div style="height:52px"></div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:.85rem;text-align:left">
          ลงชื่อ..................................ผู้บริหารสถานศึกษา
        </div>
        <div style="font-size:.82rem;color:#374151;margin-top:4px;text-align:left;padding-left:2.5rem">(..................................)</div>
      </div>
    </div>
  </body></html>`;
  // เขียน HTML ลง iframe โดยตรง — ไม่ใช้ blob URL (หลีกเลี่ยง CSP + popup blocker)
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;left:-9999px;top:-9999px;border:0';
  document.body.appendChild(iframe);
  const iDoc = iframe.contentDocument || iframe.contentWindow.document;
  iDoc.open('text/html', 'replace');
  iDoc.write(html);
  iDoc.close();
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('[print]', e);
    }
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 4000);
  }, 400);
}

