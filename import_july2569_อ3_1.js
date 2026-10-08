// KinderTrack — นำเข้าข้อมูล กรกฎาคม 2569 (อ.3/1)
// รัน script นี้ใน browser console ขณะเปิดเว็บ KinderTrack
// ============================================================

(function() {
  // 1. nutritionRecords — การประเมินภาวะโภชนาการ วันที่ 31 กรกฎาคม 2569
  const NUTRITION_KEY = 'kt_nutritionRecords';
  const nutritionKey = "อ.3/1__2569__2026-07-31";
  const nutritionData = {
  "1289": {
    "ageYear": 5,
    "ageMonth": 11,
    "weight": 18.5,
    "height": 110,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "สมส่วน"
  },
  "1291": {
    "ageYear": 6,
    "ageMonth": 0,
    "weight": 15.7,
    "height": 109,
    "weightForAge": "น้ำหนักค่อนข้างน้อย",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "ค่อนข้างผอม"
  },
  "1309": {
    "ageYear": 5,
    "ageMonth": 7,
    "weight": 18,
    "height": 110,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "สมส่วน"
  },
  "1312": {
    "ageYear": 5,
    "ageMonth": 8,
    "weight": 32.8,
    "height": 120,
    "weightForAge": "น้ำหนักมากกว่าเกณฑ์",
    "heightForAge": "ค่อนข้างสูง",
    "weightForHeight": "อ้วน"
  },
  "1315": {
    "ageYear": 6,
    "ageMonth": 2,
    "weight": 24.7,
    "height": 115,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "ท้วม"
  },
  "1332": {
    "ageYear": 5,
    "ageMonth": 8,
    "weight": 25.7,
    "height": 121,
    "weightForAge": "น้ำหนักค่อนข้างมาก",
    "heightForAge": "สูง",
    "weightForHeight": "สมส่วน"
  },
  "1334": {
    "ageYear": 5,
    "ageMonth": 9,
    "weight": 20.8,
    "height": 109,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "สมส่วน"
  },
  "1335": {
    "ageYear": 5,
    "ageMonth": 8,
    "weight": 18.8,
    "height": 111,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "สมส่วน"
  },
  "1303": {
    "ageYear": 6,
    "ageMonth": 7,
    "weight": 42.4,
    "height": 118,
    "weightForAge": "น้ำหนักมากกว่าเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "อ้วน"
  },
  "1302": {
    "ageYear": 5,
    "ageMonth": 3,
    "weight": 15,
    "height": 101,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ค่อนข้างเตี้ย",
    "weightForHeight": "สมส่วน"
  },
  "1299": {
    "ageYear": 5,
    "ageMonth": 10,
    "weight": 14.7,
    "height": 105,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "ผอม"
  },
  "1254": {
    "ageYear": 6,
    "ageMonth": 8,
    "weight": 30.6,
    "height": 119,
    "weightForAge": "น้ำหนักมากกว่าเกณฑ์",
    "heightForAge": "ค่อนข้างสูง",
    "weightForHeight": "อ้วน"
  },
  "1321": {
    "ageYear": 5,
    "ageMonth": 7,
    "weight": 19,
    "height": 111,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "สมส่วน"
  },
  "1342": {
    "ageYear": 6,
    "ageMonth": 0,
    "weight": 21,
    "height": 121,
    "weightForAge": "น้ำหนักตามเกณฑ์",
    "heightForAge": "สูง",
    "weightForHeight": "สมส่วน"
  },
  "1344": {
    "ageYear": 6,
    "ageMonth": 1,
    "weight": 24.7,
    "height": 115,
    "weightForAge": "น้ำหนักค่อนข้างมาก",
    "heightForAge": "ส่วนสูงตามเกณฑ์",
    "weightForHeight": "ท้วม"
  }
};

  const existingNutrition = JSON.parse(localStorage.getItem(NUTRITION_KEY) || '{}');
  existingNutrition[nutritionKey] = nutritionData;
  localStorage.setItem(NUTRITION_KEY, JSON.stringify(existingNutrition));
  console.log('✅ nutritionRecords:', nutritionKey, '—', Object.keys(nutritionData).length, 'นักเรียน');

  // 2. illnessCheckRecords — แบบคัดกรองอาการป่วย กรกฎาคม 2569
  const ILLNESS_KEY = 'kt_illnessCheckRecords';
  const illnessKey = "อ.3/1__2569__2026-07";
  const illnessRecord = {
  "id": "อ.3/1__2569__2026-07",
  "className": "อ.3/1",
  "academicYear": 2569,
  "year": 2026,
  "month": 7,
  "students": {
    "1289": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1291": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "X",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "X",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1309": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1312": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "X",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1315": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1332": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1334": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1335": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1303": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1302": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1299": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1254": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1321": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
        "v": "C",
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
      "23": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1342": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
        "v": "C",
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
      "23": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "C",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    },
    "1344": {
      "1": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "2": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "3": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "6": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "7": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "8": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "9": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "10": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "13": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "14": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "15": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "16": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "17": {
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
      "23": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      },
      "24": {
        "v": "√",
        "sep": 0,
        "home": false,
        "fam": false,
        "note": ""
      }
    }
  }
};

  const existingIllness = JSON.parse(localStorage.getItem(ILLNESS_KEY) || '{}');
  existingIllness[illnessKey] = illnessRecord;
  localStorage.setItem(ILLNESS_KEY, JSON.stringify(existingIllness));
  console.log('✅ illnessCheckRecords:', illnessKey, '—', Object.keys(illnessRecord.students).length, 'นักเรียน');

  // สรุป
  console.log('');
  console.log('📋 สรุปข้อมูลที่นำเข้า:');
  console.log('  - โภชนาการ อ.3/1 วันที่ 31 ก.ค. 2569: 15 คน');
  console.log('  - คัดกรองป่วย อ.3/1 เดือน ก.ค. 2569: 15 คน, 18 วันเรียน');
  console.log('');
  console.log('⚠️  กรุณา reload หน้าเว็บ เพื่อให้ AppContext โหลดข้อมูลใหม่');
  console.log('     (ระบบจะ sync ขึ้น Firebase อัตโนมัติภายใน ~4 วินาที)');
})();
