import { useState } from 'react';

export default function EvaluationForm({ student, onSave, onCancel, assessmentTopics }) {
  const [formData, setFormData] = useState(student.assessments?.summary || {});

  return (
    <div className="animate-fade">
      <div className="flex justify-between items-center mb-6 flex-stack">
        <h2 className="text-2xl">📝 ประเมินพัฒนาการ: {student.name}</h2>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={onCancel}>❌ ยกเลิก</button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(formData)}>✅ บันทึก</button>
        </div>
      </div>

      <div className="glass p-8">
        <div className="flex flex-col gap-6">
          {assessmentTopics.map((item) => (
            <div key={item.id} className="glass-card">
              <h3 className="mb-4">{item.emoji} ด้าน{item.label}</h3>
              <div className="grid grid-4 gap-4">
                {[1, 2, 3].map((score) => (
                  <label key={score} className="flex-1">
                    <input
                      type="radio"
                      name={item.id}
                      value={score}
                      checked={formData[item.id] === score}
                      onChange={() => setFormData({ ...formData, [item.id]: score })}
                      style={{ display: 'none' }}
                    />
                    <div
                      className={`btn w-full text-center ${formData[item.id] === score ? 'btn-primary' : ''}`}
                      style={{ border: '2px solid #eee', fontSize: '0.9rem' }}
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
