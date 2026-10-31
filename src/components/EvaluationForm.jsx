import { useState } from 'react';
import { ui } from '../ui/ui';

export default function EvaluationForm({ student, onSave, onCancel, assessmentTopics }) {
  const [formData, setFormData] = useState(student.assessments?.summary || {});

  return (
    <div {...ui('animate-fade')}>
      <div {...ui('flex justify-between items-center mb-6 flex-stack')}>
        <h2 {...ui('text-2xl')}>📝 ประเมินพัฒนาการ: {student.name}</h2>
        <div {...ui('flex gap-2')}>
          <button type="button" {...ui('btn')} onClick={onCancel}>❌ ยกเลิก</button>
          <button type="button" {...ui('btn btn-primary')} onClick={() => onSave(formData)}>✅ บันทึก</button>
        </div>
      </div>

      <div {...ui('glass p-8')}>
        <div {...ui('flex flex-col gap-6')}>
          {assessmentTopics.map((item) => (
            <div key={item.id} {...ui('glass-card')}>
              <h3 {...ui('mb-4')}>{item.emoji} ด้าน{item.label}</h3>
              <div {...ui('grid grid-4 gap-4')}>
                {[1, 2, 3].map((score) => (
                  <label key={score} {...ui('flex-1')}>
                    <input
                      type="radio"
                      name={item.id}
                      value={score}
                      checked={formData[item.id] === score}
                      onChange={() => setFormData({ ...formData, [item.id]: score })}
                      style={{ display: 'none' }}
                    />
                    <div
                      {...ui(`btn w-full text-center ${formData[item.id] === score ? 'btn-primary' : ''}`, { border: '2px solid #eee', fontSize: '0.9rem' })}
                    >
                      {score === 3 ? '🌟 ดี' : score === 2 ? '👍 พอใช้' : '🌱 ควรส่งเสริม'}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
