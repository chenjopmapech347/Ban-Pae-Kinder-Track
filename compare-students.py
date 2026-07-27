"""
เปรียบเทียบข้อมูลนักเรียน: Excel vs Firebase
รันด้วย:  python3 compare-students.py
"""

import urllib.request, json, sys

# ─── ข้อมูลจากไฟล์ Excel (27 พ.ค. 2569) ──────────────────
EXCEL = {
    'อ.1/1': 23,
    'อ.1/2': 22,
    'อ.2/1': 19,
    'อ.2/2': 19,
    'อ.3/1': 15,
    'อ.3/2': 18,
    'อ.3/3': 20,
}

# ─── Firebase Config ──────────────────────────────────────
PROJECT = 'kinder-track-57770'
API_KEY = 'AIzaSyB4zokDQo4AcUuOhw-mmheD_mxDZ1gzVP4'

# ─── Firestore value decoder ──────────────────────────────
def decode(v):
    if 'stringValue'  in v: return v['stringValue']
    if 'integerValue' in v: return int(v['integerValue'])
    if 'doubleValue'  in v: return float(v['doubleValue'])
    if 'booleanValue' in v: return v['booleanValue']
    if 'nullValue'    in v: return None
    if 'arrayValue'   in v:
        return [decode(i) for i in v['arrayValue'].get('values', [])]
    if 'mapValue'     in v:
        return {k: decode(val) for k, val in v['mapValue'].get('fields', {}).items()}
    return None

# ─── ดึงข้อมูลจาก Firebase ───────────────────────────────
print('กำลังดึงข้อมูลจาก Firebase...')
url = (f'https://firestore.googleapis.com/v1/projects/{PROJECT}'
       f'/databases/(default)/documents/schools/default/snapshots/latest'
       f'?mask.fieldPaths=students&key={API_KEY}')

try:
    with urllib.request.urlopen(url, timeout=15) as r:
        doc = json.loads(r.read())
except Exception as e:
    print(f'\n❌ ดึงข้อมูลไม่ได้: {e}')
    sys.exit(1)

students = decode(doc['fields']['students'])

# ─── นับตาม className ─────────────────────────────────────
fb = {}
for s in students:
    cls  = s.get('className', '')
    name = s.get('name', '')
    if not cls or name.startswith('(ว่าง)'): continue
    fb[cls] = fb.get(cls, 0) + 1

# ─── เปรียบเทียบ ─────────────────────────────────────────
all_cls = sorted(set(list(EXCEL.keys()) + list(fb.keys())))

print()
print('=' * 58)
print(f"  {'ห้อง':<8}  {'Excel':>6}  {'ระบบ':>6}  {'ผลต่าง':>7}  สถานะ")
print('=' * 58)

excel_total = fb_total = 0
match = mismatch = missing = 0

for cls in all_cls:
    xl = EXCEL.get(cls)
    sy = fb.get(cls)
    diff = (sy or 0) - (xl or 0)

    if xl is None:
        status = '⚠  ไม่มีใน Excel'; missing += 1
    elif sy is None:
        status = '⚠  ไม่มีใน Firebase'; missing += 1
    elif diff == 0:
        status = '✓  ตรงกัน'; match += 1
    else:
        status = f'✗  ต่างกัน {diff:+d} คน'; mismatch += 1

    xl_s   = str(xl) if xl is not None else '—'
    sy_s   = str(sy) if sy is not None else '—'
    diff_s = (f'{diff:+d}' if (xl and sy and diff != 0) else '—')

    print(f"  {cls:<8}  {xl_s:>6}  {sy_s:>6}  {diff_s:>7}  {status}")
    if xl: excel_total += xl
    if sy: fb_total    += sy

print('=' * 58)
diff_total = fb_total - excel_total
diff_s = f'{diff_total:+d}' if diff_total != 0 else '—'
status = '✓  ตรงกัน' if diff_total == 0 else f'✗  ต่างกัน {diff_total:+d} คน'
print(f"  {'รวม':<8}  {excel_total:>6}  {fb_total:>6}  {diff_s:>7}  {status}")
print('=' * 58)
print()
print(f"  ตรงกัน {match} ห้อง  |  ไม่ตรง {mismatch} ห้อง  |  หาย {missing} ห้อง")
print(f"  นักเรียนใน Firebase รวม: {sum(fb.values())} คน  ({len(fb)} ห้อง)")
print()
