/**
 * flatIndicators.js
 * แปลง INDICATORS_DATA_68 (nested, หลักสูตร 2568) → flat arrays สำหรับ CRUD
 *
 * ปรับเป็น ปี 68 — INDICATORS_DATA เดิม (ดย./ปวัย.2560/สมศ.) ถูกทดแทนแล้ว
 */
import { INDICATORS_DATA_68 } from './indicatorsData_68';

function buildFlat() {
  const indicators = [];
  const activities = [];

  INDICATORS_DATA_68.forEach(domain => {
    domain.standards.forEach(std => {
      std.indicators.forEach(ind => {
        const indKey = `${domain.id}__${std.id}__${ind.id}`;
        indicators.push({
          id:            indKey,
          domainId:      domain.id,
          domainLabel:   domain.label,
          domainEmoji:   domain.emoji,
          domainColor:   domain.color,
          standardId:    std.id,
          standardTitle: std.title,
          indicatorCode: ind.id,
          label:         ind.label,
        });

        ind.items.forEach(item => {
          item.activities.forEach(act => {
            activities.push({
              id:          `${indKey}__${item.id}__${act.no}`,
              indicatorId: indKey,
              domainId:    domain.id,
              itemId:      item.id,
              itemLabel:   item.label,
              no:          act.no,
              label:       act.label,
            });
          });
        });
      });
    });
  });

  return { indicators, activities };
}

const _flat = buildFlat();
export const INITIAL_INDICATORS = _flat.indicators;
export const INITIAL_ACTIVITIES = _flat.activities;

/** helper: รายการ standard ในแต่ละ domain (ใช้ ปี 68) */
export function getStandardsByDomain(domainId) {
  const dom = INDICATORS_DATA_68.find(d => d.id === domainId);
  return dom ? dom.standards.map(s => ({ id: s.id, title: s.title })) : [];
}
