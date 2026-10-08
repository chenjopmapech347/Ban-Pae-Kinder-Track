// Import: Illness + Nutrition July 2569 — อ.3/1 (CORRECTED FORMAT v3)
// ใช้โครงสร้าง students[id].days[day] ที่ถูกต้อง
// อ่าน academicYear จาก localStorage จริง

// อ่าน academicYear จากระบบ (ไม่ hardcode)
const AY = JSON.parse(localStorage.getItem('kt_academicYear') || '"2569"');
console.log('📌 academicYear จากระบบ:', AY);

function mergeDeep(target, source) {
  const out = { ...target };
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k]) &&
        target[k] && typeof target[k] === 'object') {
      out[k] = mergeDeep(target[k], source[k]);
    } else { out[k] = source[k]; }
  }
  return out;
}

// ── 1. kt_illnessCheckRecords ────────────────────────────────────────────
const ILL_KEY = `อ.3/1__${AY}__2569-07`;
const illnessNew = {
  [ILL_KEY]: {
    "id": ILL_KEY,
    "className": "อ.3/1",
    "academicYear": AY,
    "year": 2569,
    "month": 7,
    "students": {
      "1289": {
        "weight": 18.5,
        "height": 110.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1291": {
        "weight": 15.7,
        "height": 109.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
            "v": "X",
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
          "21": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "22": {
            "v": "X",
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1309": {
        "weight": 18.0,
        "height": 110.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1312": {
        "weight": 32.8,
        "height": 120.0,
        "days": {
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
          "10": {
            "v": "X",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "C",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
            "v": "C",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "13": {
            "v": "C",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "14": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1315": {
        "weight": 24.7,
        "height": 115.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1332": {
        "weight": 25.7,
        "height": 121.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1334": {
        "weight": 20.8,
        "height": 109.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1335": {
        "weight": 18.8,
        "height": 111.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1303": {
        "weight": 42.4,
        "height": 118.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
            "v": "C",
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1302": {
        "weight": 15.0,
        "height": 101.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1299": {
        "weight": 14.7,
        "height": 105.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1254": {
        "weight": 30.6,
        "height": 119.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1321": {
        "weight": 19.0,
        "height": 111.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1342": {
        "weight": 21.0,
        "height": 121.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      },
      "1344": {
        "weight": 24.7,
        "height": 115.0,
        "days": {
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
          "10": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "11": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          },
          "12": {
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
          },
          "25": {
            "v": "√",
            "sep": 0,
            "home": false,
            "fam": false,
            "note": ""
          }
        }
      }
    }
  }
};

const illExist = JSON.parse(localStorage.getItem('kt_illnessCheckRecords') || '{}');
const illMerged = mergeDeep(illExist, illnessNew);
localStorage.setItem('kt_illnessCheckRecords', JSON.stringify(illMerged));
const julyRec = illMerged[ILL_KEY] || {};
const julyCount = Object.values(julyRec.students || {}).reduce((n,s) => n + Object.keys(s.days || {}).length, 0);
console.log('✅ Illness อ.3/1 ก.ค.:', julyCount, 'marks (expected 195) key=', ILL_KEY);

// ── 2. kt_nutritionRecords ───────────────────────────────────────────────
const NUT_KEY = `อ.3/1__${AY}__2026-07-01`;
const nutritionNew = {
  [NUT_KEY]: {
    "id": NUT_KEY,
    "className": "อ.3/1",
    "academicYear": AY,
    "assessmentDate": "2026-07-01",
    "students": {
      "1289": {
        "ageYear": "๕",
        "ageMonth": "",
        "weight": 18.5,
        "height": 110.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1291": {
        "ageYear": "6",
        "ageMonth": "",
        "weight": 15.7,
        "height": 109.0,
        "weightForAge": "น้ำหนักค่อนข้างน้อย",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ค่อนข้างผอม"
      },
      "1309": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 18.0,
        "height": 110.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1312": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 32.8,
        "height": 120.0,
        "weightForAge": "น้ำหนักมากเกินเกณฑ์",
        "heightForAge": "ค่อนข้างสูง",
        "weightForHeight": "อ้วน"
      },
      "1315": {
        "ageYear": "6",
        "ageMonth": "",
        "weight": 24.7,
        "height": 115.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "ท้วม"
      },
      "1332": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 25.7,
        "height": 121.0,
        "weightForAge": "น้ำหนักค่อนข้างมาก",
        "heightForAge": "สูง",
        "weightForHeight": "สมส่วน"
      },
      "1334": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 20.8,
        "height": 109.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1335": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 18.8,
        "height": 111.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "สมส่วน"
      },
      "1303": {
        "ageYear": "6",
        "ageMonth": "",
        "weight": 42.4,
        "height": 118.0,
        "weightForAge": "น้ำหนักมากเกินเกณฑ์",
        "heightForAge": "ส่วนสูงตามเกณฑ์",
        "weightForHeight": "อ้วน"
      },
      "1302": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 15.0,
        "height": 101.0,
        "weightForAge": "น้ำหนักตามเกณฑ์",
        "heightForAge": "ค่อนข้างเตี้ย",
        "weightForHeight": "สมส่วน"
      },
      "1299": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 14.7,
        "height": 105.0,
        "weightForAge": "นำ ้ หนกั ตำมเกณฑ ์",
        "heightForAge": "ส่วนสงู ตำมเกณฑ ์",
        "weightForHeight": "ผอม"
      },
      "1254": {
        "ageYear": "6",
        "ageMonth": "",
        "weight": 30.6,
        "height": 119.0,
        "weightForAge": "นำ ้ หนกั มำกเกินเกณฑ ์",
        "heightForAge": "ค่อนขำ้ งสงู",
        "weightForHeight": "อว้ น"
      },
      "1321": {
        "ageYear": "5",
        "ageMonth": "",
        "weight": 19.0,
        "height": 111.0,
        "weightForAge": "นำ ้ หนกั ตำมเกณฑ ์",
        "heightForAge": "ส่วนสงู ตำมเกณฑ ์",
        "weightForHeight": "สมส่วน"
      },
      "1342": {
        "ageYear": "6",
        "ageMonth": "",
        "weight": 21.0,
        "height": 121.0,
        "weightForAge": "นำ ้ หนกั ตำมเกณฑ ์",
        "heightForAge": "สงู",
        "weightForHeight": "สมส่วน"
      },
      "1344": {
        "ageYear": "6",
        "ageMonth": "",
        "weight": 24.7,
        "height": 115.0,
        "weightForAge": "นำ ้ หนกั ค่อนขำ้ งมำก",
        "heightForAge": "ส่วนสงู ตำมเกณฑ ์",
        "weightForHeight": "ทว้ ม"
      }
    }
  }
};

const nutExist = JSON.parse(localStorage.getItem('kt_nutritionRecords') || '{}');
const nutMerged = mergeDeep(nutExist, nutritionNew);
localStorage.setItem('kt_nutritionRecords', JSON.stringify(nutMerged));
const nutCount = Object.keys(nutMerged[NUT_KEY]?.students || {}).length;
console.log('✅ Nutrition อ.3/1 ก.ค.:', nutCount, 'students (expected 15) key=', NUT_KEY);

console.log('🔵 Done — รอ 4-5 วิ ให้ AppContext sync');
console.log('🔄 Reloading page in 1s...');
setTimeout(() => location.reload(), 1000);
