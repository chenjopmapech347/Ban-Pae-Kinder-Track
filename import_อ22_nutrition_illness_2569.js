// Import: Nutrition + May illness (new format) for อ.2/2 ปีการศึกษา 2569
// Run in browser console on KinderTrack app
// -----------------------------------------------------------------------

function mergeDeep(target, source) {
  const out = { ...target };
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k]) &&
        target[k] && typeof target[k] === 'object') {
      out[k] = mergeDeep(target[k], source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

// ── 1. kt_nutritionRecords (ใหม่ทั้งหมด — 3 เดือน, 18 คนต่อเดือน) ──────
const nutritionNew = {
  "อ.2/2__2569__2026-05-01": {
    "id": "อ.2/2__2569__2026-05-01",
    "className": "อ.2/2",
    "academicYear": "2569",
    "assessmentDate": "2026-05-01",
    "students": {
      "1374": {
        "ageYear": "5",
        "ageMonth": "2",
        "weight": 18.0,
        "height": 105.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1377": {
        "ageYear": "4",
        "ageMonth": "10",
        "weight": 18.0,
        "height": 102.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1378": {
        "ageYear": "5",
        "ageMonth": "3",
        "weight": 16.0,
        "height": 105.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1379": {
        "ageYear": "4",
        "ageMonth": "5",
        "weight": 18.0,
        "height": 98.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ท้วม"
      },
      "1380": {
        "ageYear": "4",
        "ageMonth": "6",
        "weight": 15.0,
        "height": 101.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1382": {
        "ageYear": "4",
        "ageMonth": "2",
        "weight": 21.0,
        "height": 105.0,
        "weightForAge": "น้ำหนักมากกว่าเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "เริ่มอ้วน"
      },
      "1383": {
        "ageYear": "4",
        "ageMonth": "7",
        "weight": 17.0,
        "height": 109.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1389": {
        "ageYear": "4",
        "ageMonth": "7",
        "weight": 18.0,
        "height": 105.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1392": {
        "ageYear": "4",
        "ageMonth": "11",
        "weight": 20.0,
        "height": 109.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1395": {
        "ageYear": "4",
        "ageMonth": "0",
        "weight": 12.0,
        "height": 94.0,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "ค่อนข้างเตี้ย",
        "weightForHeight": "ค่อนข้างผอม"
      },
      "1400": {
        "ageYear": "5",
        "ageMonth": "3",
        "weight": 19.0,
        "height": 110.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1401": {
        "ageYear": "4",
        "ageMonth": "6",
        "weight": 18.0,
        "height": 108.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1403": {
        "ageYear": "4",
        "ageMonth": "10",
        "weight": 13.0,
        "height": 100.0,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ผอม"
      },
      "1406": {
        "ageYear": "4",
        "ageMonth": "0",
        "weight": 14.0,
        "height": 98.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1413": {
        "ageYear": "4",
        "ageMonth": "2",
        "weight": 16.0,
        "height": 105.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1414": {
        "ageYear": "5",
        "ageMonth": "2",
        "weight": 15.0,
        "height": 101.0,
        "weightForAge": "น้ำหนักค่อนข้างน้อย",
        "heightForAge": "ค่อนข้างเตี้ย",
        "weightForHeight": "สมส่วน"
      },
      "1415": {
        "ageYear": "4",
        "ageMonth": "7",
        "weight": 18.0,
        "height": 102.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1417": {
        "ageYear": "5",
        "ageMonth": "3",
        "weight": 20.0,
        "height": 118.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "สูง",
        "weightForHeight": "สมส่วน"
      }
    }
  },
  "อ.2/2__2569__2026-06-01": {
    "id": "อ.2/2__2569__2026-06-01",
    "className": "อ.2/2",
    "academicYear": "2569",
    "assessmentDate": "2026-06-01",
    "students": {
      "1374": {
        "ageYear": "5",
        "ageMonth": "3",
        "weight": 18.0,
        "height": 105.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1377": {
        "ageYear": "4",
        "ageMonth": "11",
        "weight": 18.0,
        "height": 102.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1378": {
        "ageYear": "5",
        "ageMonth": "4",
        "weight": 16.0,
        "height": 105.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1379": {
        "ageYear": "4",
        "ageMonth": "6",
        "weight": 18.0,
        "height": 98.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ท้วม"
      },
      "1380": {
        "ageYear": "4",
        "ageMonth": "7",
        "weight": 15.0,
        "height": 101.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1382": {
        "ageYear": "4",
        "ageMonth": "3",
        "weight": 21.0,
        "height": 105.5,
        "weightForAge": "น้ำหนักมากกว่าเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "เริ่มอ้วน"
      },
      "1383": {
        "ageYear": "4",
        "ageMonth": "8",
        "weight": 17.0,
        "height": 109.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1389": {
        "ageYear": "4",
        "ageMonth": "8",
        "weight": 18.0,
        "height": 105.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1392": {
        "ageYear": "5",
        "ageMonth": "0",
        "weight": 20.0,
        "height": 109.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1395": {
        "ageYear": "4",
        "ageMonth": "1",
        "weight": 12.0,
        "height": 94.5,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "ค่อนข้างเตี้ย",
        "weightForHeight": "ผอม"
      },
      "1400": {
        "ageYear": "5",
        "ageMonth": "4",
        "weight": 19.0,
        "height": 110.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1401": {
        "ageYear": "4",
        "ageMonth": "6",
        "weight": 18.0,
        "height": 108.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1403": {
        "ageYear": "4",
        "ageMonth": "10",
        "weight": 13.0,
        "height": 100.5,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ผอม"
      },
      "1406": {
        "ageYear": "4",
        "ageMonth": "1",
        "weight": 14.0,
        "height": 98.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1413": {
        "ageYear": "4",
        "ageMonth": "3",
        "weight": 16.0,
        "height": 105.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1414": {
        "ageYear": "5",
        "ageMonth": "0",
        "weight": 0,
        "height": 0,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "เตี้ย",
        "weightForHeight": ""
      },
      "1415": {
        "ageYear": "4",
        "ageMonth": "8",
        "weight": 18.0,
        "height": 102.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1417": {
        "ageYear": "5",
        "ageMonth": "4",
        "weight": 20.0,
        "height": 118.5,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "สูง",
        "weightForHeight": "สมส่วน"
      }
    }
  },
  "อ.2/2__2569__2026-07-01": {
    "id": "อ.2/2__2569__2026-07-01",
    "className": "อ.2/2",
    "academicYear": "2569",
    "assessmentDate": "2026-07-01",
    "students": {
      "1374": {
        "ageYear": "5",
        "ageMonth": "4",
        "weight": 18.0,
        "height": 106.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1377": {
        "ageYear": "5",
        "ageMonth": "0",
        "weight": 18.0,
        "height": 103.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1378": {
        "ageYear": "5",
        "ageMonth": "5",
        "weight": 16.0,
        "height": 106.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1379": {
        "ageYear": "4",
        "ageMonth": "7",
        "weight": 18.0,
        "height": 99.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ท้วม"
      },
      "1380": {
        "ageYear": "4",
        "ageMonth": "8",
        "weight": 15.0,
        "height": 102.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1382": {
        "ageYear": "4",
        "ageMonth": "4",
        "weight": 21.0,
        "height": 106.0,
        "weightForAge": "น้ำหนักมากกว่าเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "เริ่มอ้วน"
      },
      "1383": {
        "ageYear": "4",
        "ageMonth": "9",
        "weight": 17.0,
        "height": 110.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1389": {
        "ageYear": "4",
        "ageMonth": "9",
        "weight": 18.0,
        "height": 106.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1392": {
        "ageYear": "5",
        "ageMonth": "1",
        "weight": 20.0,
        "height": 110.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1395": {
        "ageYear": "4",
        "ageMonth": "2",
        "weight": 12.0,
        "height": 95.0,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "ค่อนข้างเตี้ย",
        "weightForHeight": "ผอม"
      },
      "1400": {
        "ageYear": "5",
        "ageMonth": "5",
        "weight": 19.0,
        "height": 111.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1401": {
        "ageYear": "4",
        "ageMonth": "7",
        "weight": 18.0,
        "height": 109.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1403": {
        "ageYear": "4",
        "ageMonth": "11",
        "weight": 13.0,
        "height": 101.0,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ผอม"
      },
      "1406": {
        "ageYear": "4",
        "ageMonth": "2",
        "weight": 14.0,
        "height": 99.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1413": {
        "ageYear": "4",
        "ageMonth": "4",
        "weight": 16.0,
        "height": 106.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1414": {
        "ageYear": "5",
        "ageMonth": "0",
        "weight": 0,
        "height": 0,
        "weightForAge": "น้ำหนักน้อยกว่าเกณฑ์",
        "heightForAge": "เตี้ย",
        "weightForHeight": ""
      },
      "1415": {
        "ageYear": "4",
        "ageMonth": "9",
        "weight": 18.0,
        "height": 103.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1417": {
        "ageYear": "5",
        "ageMonth": "5",
        "weight": 20.0,
        "height": 119.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "สูง",
        "weightForHeight": "สมส่วน"
      }
    }
  }
};

const nutExist = JSON.parse(localStorage.getItem('kt_nutritionRecords') || '{}');
const nutMerged = mergeDeep(nutExist, nutritionNew);
localStorage.setItem('kt_nutritionRecords', JSON.stringify(nutMerged));
console.log('✅ kt_nutritionRecords:', Object.keys(nutMerged).length, 'keys');

// ── 2. kt_illnessCheckRecords (May พ.ค. 2569 — new format, additive merge) ──
const illnessNew = {
  "อ.2/2__2569__2569-05": {
    "1374": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1377": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1378": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1379": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1380": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1382": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1383": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1389": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1392": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1395": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1400": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1401": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1403": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1406": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1413": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1414": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1415": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1417": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1418": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "18": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "19": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "20": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "21": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "22": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "25": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "26": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "27": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "28": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "29": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    }
  }
};

const illExist = JSON.parse(localStorage.getItem('kt_illnessCheckRecords') || '{}');
const illMerged = mergeDeep(illExist, illnessNew);
localStorage.setItem('kt_illnessCheckRecords', JSON.stringify(illMerged));

// Verify May marks
const mayRec = illMerged['อ.2/2__2569__2569-05'] || {};
const mayCount = Object.values(mayRec).reduce((n,s) => n + Object.keys(s).length, 0);
console.log('✅ kt_illnessCheckRecords May:', mayCount, 'marks (expected ≥209)');

// ── Summary ────────────────────────────────────────────────────────────
console.log('');
console.log('🔵 Import done — รอ 4-5 วินาทีให้ AppContext sync ไป Firebase');
console.log('📊 Nutrition keys:', Object.keys(nutMerged));
console.log('📊 Illness months:', Object.keys(illMerged).filter(k => k.startsWith('อ.2/2')).length, 'months');