/**
 * aiHelper.js — ช่วยเรียก Claude API สำหรับ KinderTrack
 * ใช้ claude-haiku (เร็ว + ประหยัด) สำหรับข้อเสนอแนะ
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const MODEL      = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญด้านพัฒนาการเด็กปฐมวัย ระดับอนุบาล 1-3 ในประเทศไทย
ตอบเป็นภาษาไทยเสมอ ใช้ภาษาที่เป็นมิตร เข้าใจง่าย กระชับ ไม่เกิน 4-5 ประโยค
ไม่ต้องมีหัวข้อหรือ bullet point ให้เขียนเป็น paragraph ต่อเนื่อง`;

/** ฟังก์ชันกลาง — ส่ง request ไป Claude API */
async function _fetch(apiKey, body) {
  if (!apiKey) throw new Error('ยังไม่ได้ตั้งค่า AI API Key');
  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: MODEL, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API Error ${res.status}`);
  }
  const data = await res.json();
  return data.content[0]?.text ?? '';
}

/**
 * เรียก Claude API — single-turn (prompt เดียว)
 * @param {string} apiKey
 * @param {string} userPrompt
 * @param {string} [systemPrompt] — ถ้าไม่ส่งจะใช้ SYSTEM_PROMPT ค่าเริ่มต้น
 */
export async function callClaude(apiKey, userPrompt, systemPrompt) {
  return _fetch(apiKey, {
    max_tokens: 500,
    system: systemPrompt ?? SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });
}

/**
 * เรียก Claude API — multi-turn (สำหรับ chatbot)
 * @param {string} apiKey
 * @param {Array}  messages  — [{ role: 'user'|'assistant', content: string }, ...]
 * @param {string} systemPrompt
 */
export async function callClaudeChat(apiKey, messages, systemPrompt) {
  return _fetch(apiKey, {
    max_tokens: 800,
    system: systemPrompt,
    messages,
  });
}

/**
 * Prompt สำหรับข้อเสนอแนะหลังประเมินตัวบ่งชี้
 * @param {object} student - ข้อมูลนักเรียน
 * @param {object} domain  - { label, emoji }
 * @param {object} ind     - { label }
 * @param {object} scores  - { actId: 1|2|3, ... }
 * @param {Array}  activities - [{no, label}, ...]
 */
export function buildPostAssessmentPrompt(student, domain, ind, scores, activities) {
  const scoreLabel = { 3: 'ผ่าน', 2: 'กำลังพัฒนา', 1: 'ต้องส่งเสริม' };
  const lines = activities.map(a => {
    const s = scores[a.no];
    return `- ${a.label}: ${s ? scoreLabel[s] : 'ยังไม่ประเมิน'}`;
  }).join('\n');

  const avg = Object.values(scores).length
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)
    : null;

  return `นักเรียน: ${student.name} อายุ ${student.age ?? '?'} ปี ชั้น ${student.className ?? ''}
ด้านที่ประเมิน: ด้าน${domain.label} — ${ind.label}
คะแนนเฉลี่ย: ${avg ?? 'ยังไม่ครบ'}/3

รายละเอียดกิจกรรม:
${lines}

ให้ข้อเสนอแนะสำหรับครูในการส่งเสริมพัฒนาการด้านนี้ พร้อมแนะนำกิจกรรม 2-3 อย่างที่ทำได้จริงในห้องเรียนอนุบาล`;
}

/**
 * Prompt สรุปพัฒนาการรายบุคคลสำหรับผู้ปกครอง
 * @param {object} student      - ข้อมูลนักเรียน
 * @param {Array}  topicScores  - [{ label, score: 0-3|null }, ...]
 */
export function buildParentSummaryPrompt(student, topicScores) {
  const levelLabel = { 3: 'ดีมาก', 2: 'ดี', 1: 'ต้องพัฒนา', 0: 'ยังไม่มีข้อมูล' };
  const lines = topicScores.map(({ label, score }) =>
    `- ด้าน${label}: ${score !== null ? levelLabel[score] ?? 'ยังไม่มีข้อมูล' : 'ยังไม่ประเมิน'}`
  ).join('\n');

  return `นักเรียน: ${student.name} อายุ ${student.age ?? '?'} ปี ชั้น ${student.className ?? ''}
ผลการประเมินพัฒนาการ:
${lines}

เขียนสรุปพัฒนาการสำหรับผู้ปกครองอ่าน เชิงบวก ให้กำลังใจ บอกจุดเด่นและสิ่งที่ควรส่งเสริมที่บ้าน`;
}

/**
 * Prompt แนะนำกิจกรรมรายด้านสำหรับครู (pre-assessment hint)
 * @param {object} student     - ข้อมูลนักเรียน
 * @param {Array}  topicScores - [{ label, score }, ...]
 */
export function buildActivitySuggestionPrompt(student, topicScores) {
  const weak = topicScores.filter(t => t.score !== null && t.score < 2);
  const focus = weak.length
    ? weak.map(t => `ด้าน${t.label}`).join(', ')
    : topicScores.map(t => `ด้าน${t.label}`).join(', ');

  return `นักเรียน: ${student.name} อายุ ${student.age ?? '?'} ปี ชั้น ${student.className ?? ''}
ด้านที่ต้องการส่งเสริม: ${focus}

แนะนำกิจกรรมที่เหมาะสม 3-4 กิจกรรมที่ครูสามารถทำได้ในชั้นเรียนหรือแนะนำให้ผู้ปกครองทำที่บ้าน`;
}

/**
 * Prompt สรุปพัฒนาการรายห้องสำหรับ ReportsTab
 * @param {string} className    - ชื่อห้อง
 * @param {number} studentCount - จำนวนนักเรียน
 * @param {Array}  topicStats   - [{ label, avg, s1, s2, s3 }, ...]
 */
export function buildWeeklySummaryPrompt(className, studentCount, topicStats) {
  const lines = topicStats.map(t => {
    const avg = t.avg !== null ? Number(t.avg).toFixed(2) : null;
    return `- ด้าน${t.label}: ${avg ? `คะแนนเฉลี่ย ${avg}/3` : 'ยังไม่มีข้อมูล'} (ดีมาก ${t.s3} / พอใช้ ${t.s2} / ต้องพัฒนา ${t.s1} คน)`;
  }).join('\n');

  return `ห้องเรียน: ${className} จำนวนนักเรียน ${studentCount} คน

ผลการประเมินพัฒนาการรายด้าน:
${lines}

เขียนสรุปภาพรวมพัฒนาการของห้องเรียนนี้ในรูปแบบรายงานสำหรับครูประจำชั้น บอกจุดเด่น ด้านที่ต้องพัฒนา และข้อเสนอแนะเชิงปฏิบัติ 2-3 ข้อที่ครูสามารถนำไปใช้ได้จริงในชั้นเรียนอนุบาล`;
}

/**
 * Prompt สำหรับเขียนความคิดเห็นครู อ.01
 * @param {object} student    - ข้อมูลนักเรียน
 * @param {Array}  topicScores - [{ label, score: number|null }, ...]
 * @param {number} term       - ภาคเรียน 1 หรือ 2
 */
export function buildTeacherCommentPrompt(student, topicScores, term) {
  const levelLabel = (s) => s >= 2.5 ? 'ดีมาก' : s >= 1.5 ? 'ดี' : s !== null ? 'ต้องพัฒนา' : 'ยังไม่ประเมิน';
  const lines = topicScores.map(({ label, score }) =>
    `- ด้าน${label}: ${score !== null ? levelLabel(score) : 'ยังไม่ประเมิน'}`
  ).join('\n');

  return `นักเรียน: ${student.name} ชั้น ${student.className ?? ''} ภาคเรียนที่ ${term}
ผลการประเมินพัฒนาการ:
${lines}

เขียนความคิดเห็นของครูประจำชั้น สำหรับสมุดรายงานประจำตัว (อ.01) ภาคเรียนที่ ${term}
ใช้ภาษาทางการที่เข้าใจง่าย เชิงบวก บอกพัฒนาการที่โดดเด่น และสิ่งที่ควรส่งเสริมต่อ
ความยาวประมาณ 3-5 ประโยค`;
}

/**
 * สร้าง system context สำหรับ AI chatbot
 * @param {string} schoolName
 * @param {string} academicYear
 * @param {Array}  students
 * @param {Array}  classes
 */
export function buildChatSystemPrompt(schoolName, academicYear, students, classes) {
  const total = students?.filter(s => !s.name?.startsWith('(ว่าง)')).length ?? 0;
  const classCount = classes?.length ?? 0;
  return `คุณเป็นผู้ช่วยครูที่โรงเรียน${schoolName ?? 'อนุบาล'} ปีการศึกษา ${academicYear ?? ''}
มีนักเรียนทั้งหมด ${total} คน ${classCount} ห้องเรียน ระดับชั้นอนุบาล 1-3
ความเชี่ยวชาญ: การจัดการชั้นเรียนปฐมวัย พัฒนาการเด็ก กิจกรรมส่งเสริมทักษะ
ตอบเป็นภาษาไทย กระชับ เป็นกันเอง ให้ข้อมูลที่เป็นประโยชน์เชิงปฏิบัติ`;
}
