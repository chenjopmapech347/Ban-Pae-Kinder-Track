/**
 * aiHelper.js — ช่วยเรียก Claude API สำหรับ KinderTrack
 * ใช้ claude-haiku (เร็ว + ประหยัด) สำหรับข้อเสนอแนะ
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const MODEL      = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญด้านพัฒนาการเด็กปฐมวัย ระดับอนุบาล 1-3 ในประเทศไทย
ตอบเป็นภาษาไทยเสมอ ใช้ภาษาที่เป็นมิตร เข้าใจง่าย กระชับ ไม่เกิน 4-5 ประโยค
ไม่ต้องมีหัวข้อหรือ bullet point ให้เขียนเป็น paragraph ต่อเนื่อง`;

/**
 * เรียก Claude API และรับข้อความตอบกลับ
 */
export async function callClaude(apiKey, userPrompt) {
  if (!apiKey) throw new Error('ยังไม่ได้ตั้งค่า AI API Key');

  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API Error ${res.status}`);
  }

  const data = await res.json();
  return data.content[0]?.text ?? '';
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
