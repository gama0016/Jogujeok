/*
 * 물량·공사비 계산기 정의
 * - 면적(㎡) 또는 길이(m)를 넣으면 공종별 재료 수량과 자재비를 계산한다.
 * - 단가(price)는 data/prices.js 에 모은 참고 단가(대부분 부가세 별도·자재비)에서 대표값을 골랐다.
 * - 인건비·장비비·운반비·부가세는 포함하지 않는다.
 * params: 사용자가 바꿀 수 있는 두께·간격 등 (mm 등)
 * items[].q(A, p): 수량 계산 함수 (A = 면적 또는 길이, p = params 값)
 */
(function () {
  // 단위중량(느슨한 상태, t/㎥) — 부피를 톤으로 바꿀 때 사용
  var SAND = 1.6, AGG = 1.8;
  // 다짐 후 두께를 얻으려면 느슨한 골재가 더 필요하다 (다짐 할증)
  var COMPACT = 1.25;

  window.LM_CALC = [
    {
      id: 'block-paving', name: '보도블록 포장', unit: '㎡', mat: 'concrete-block-paver',
      desc: '블록 60T + 모래 안정층 + 보조기층 (보행용)',
      params: [
        { key: 'tSand', label: '모래 안정층', unit: 'mm', value: 35 },
        { key: 'tSub', label: '보조기층', unit: 'mm', value: 150 }
      ],
      items: [
        { name: '콘크리트 보도블록 60T', mat: 'concrete-block-paver', unit: '㎡', loss: 0.03, price: 9700,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 할증 3%)'; } },
        { name: '모래 (안정층·줄눈)', mat: 'sand', unit: '톤', loss: 0.10, price: 90000,
          q: function (A, p) { return A * p.tSand / 1000 * SAND; }, how: function (p) { return '면적 × ' + p.tSand + 'mm × 단위중량 1.6t/㎥ + 할증 10%'; } },
        { name: '보조기층재 (혼합골재)', mat: 'subbase', unit: '톤', loss: 0, price: 10000,
          q: function (A, p) { return A * p.tSub / 1000 * COMPACT * AGG; }, how: function (p) { return '면적 × ' + p.tSub + 'mm × 다짐 할증 1.25 × 1.8t/㎥'; } }
      ]
    },
    {
      id: 'permeable-paving', name: '투수블록 포장', unit: '㎡', mat: 'permeable-block',
      desc: '투수블록 60T + 쇄석 안정층 + 부직포 + 투수성 보조기층',
      params: [
        { key: 'tBed', label: '쇄석 안정층', unit: 'mm', value: 40 },
        { key: 'tSub', label: '보조기층', unit: 'mm', value: 200 }
      ],
      items: [
        { name: '투수블록 60T', mat: 'permeable-block', unit: '㎡', loss: 0.03, price: 9900,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 할증 3%)'; } },
        { name: '쇄석 (안정층 5~13mm)', mat: 'crushed-stone', unit: '톤', loss: 0.05, price: 135000,
          q: function (A, p) { return A * p.tBed / 1000 * COMPACT * AGG; }, how: function (p) { return '면적 × ' + p.tBed + 'mm × 1.25 × 1.8t/㎥ (소량 톤백 단가)'; } },
        { name: '부직포 200g/㎡', mat: 'nonwoven', unit: '㎡', loss: 0.10, price: 500,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 겹침 10%)'; } },
        { name: '투수성 보조기층 (단입도 쇄석)', mat: 'subbase', unit: '톤', loss: 0, price: 10000,
          q: function (A, p) { return A * p.tSub / 1000 * COMPACT * AGG; }, how: function (p) { return '면적 × ' + p.tSub + 'mm × 1.25 × 1.8t/㎥'; } }
      ]
    },
    {
      id: 'granite-paving', name: '화강석 판석 포장 (습식)', unit: '㎡', mat: 'granite',
      desc: '판석 30T + 붙임 모르타르 + 기층 콘크리트·와이어메시 + 보조기층',
      params: [
        { key: 'tMortar', label: '붙임 모르타르', unit: 'mm', value: 30 },
        { key: 'tConc', label: '기층 콘크리트', unit: 'mm', value: 120 },
        { key: 'tSub', label: '보조기층', unit: 'mm', value: 150 }
      ],
      items: [
        { name: '화강석 판석 30T 버너', mat: 'granite', unit: '㎡', loss: 0.05, price: 36000,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 할증 5%)'; } },
        { name: '건조 모르타르 25kg', mat: 'mortar', unit: '포', loss: 0.10, price: 15000,
          q: function (A, p) { return A * p.tMortar / 1000 / 0.0125; }, how: function (p) { return '면적 × ' + p.tMortar + 'mm ÷ 포당 약 0.0125㎥ + 할증 10%'; } },
        { name: '레미콘 25-21-120', mat: 'remicon', unit: '㎥', loss: 0.03, price: 97000,
          q: function (A, p) { return A * p.tConc / 1000; }, how: function (p) { return '면적 × ' + p.tConc + 'mm + 할증 3%'; } },
        { name: '와이어메시 1.8×1.8m', mat: 'wire-mesh', unit: '장', loss: 0.15, price: 5200,
          q: function (A) { return A / 3.24; }, how: function () { return '면적 ÷ 3.24㎡ + 겹침 15%'; } },
        { name: '보조기층재', mat: 'subbase', unit: '톤', loss: 0, price: 10000,
          q: function (A, p) { return A * p.tSub / 1000 * COMPACT * AGG; }, how: function (p) { return '면적 × ' + p.tSub + 'mm × 1.25 × 1.8t/㎥'; } }
      ]
    },
    {
      id: 'curb', name: '화강석 경계석 설치', unit: 'm', mat: 'curbstone',
      desc: '경계석 150×150×1,000 + 기초·뒷채움 콘크리트 + 줄눈',
      params: [
        { key: 'wBase', label: '기초 폭', unit: 'mm', value: 300 },
        { key: 'tBase', label: '기초 두께', unit: 'mm', value: 100 }
      ],
      items: [
        { name: '화강석 경계석 150×150×1,000', mat: 'curbstone', unit: '개', loss: 0.03, price: 12000,
          q: function (L) { return L; }, how: function () { return '길이(m) ÷ 1m + 할증 3%'; } },
        { name: '레미콘 (기초·뒷채움)', mat: 'remicon', unit: '㎥', loss: 0.05, price: 97000,
          q: function (L, p) { return L * (p.wBase / 1000 * p.tBase / 1000 + 0.02); }, how: function (p) { return '길이 × (' + p.wBase + '×' + p.tBase + 'mm 기초 + 뒷채움 0.02㎥/m)'; } },
        { name: '건조 모르타르 25kg (줄눈)', mat: 'mortar', unit: '포', loss: 0.10, price: 15000,
          q: function (L) { return L * 0.1; }, how: function () { return '길이 × 0.1포/m (줄눈 10mm)'; } }
      ]
    },
    {
      id: 'deck', name: '방부목 데크 (상부 구조)', unit: '㎡', mat: 'treated-lumber',
      desc: '데크재 21×120 + 장선 2×6 + 도장 (기초·기둥·멍에 제외)',
      params: [
        { key: 'gap', label: '데크재 간격', unit: 'mm', value: 5 },
        { key: 'joist', label: '장선 간격', unit: 'mm', value: 400 },
        { key: 'coats', label: '오일스테인 횟수', unit: '회', value: 2 }
      ],
      items: [
        { name: '방부목 데크재 21×120×3,600', mat: 'treated-lumber', unit: '장', loss: 0.10, price: 7000,
          q: function (A, p) { return A * (1000 / (120 + p.gap)) / 3.6; }, how: function (p) { return '면적 × (1m ÷ ' + (120 + p.gap) + 'mm) ÷ 3.6m + 할증 10%'; } },
        { name: '장선 2×6 (38×140×3,600)', mat: 'structural-lumber', unit: '개', loss: 0.10, price: 16500,
          q: function (A, p) { return A * (1000 / p.joist) / 3.6; }, how: function (p) { return '면적 × (1m ÷ ' + p.joist + 'mm) ÷ 3.6m + 할증 10%'; } },
        { name: '스테인리스 데크 피스', mat: 'anchor-screw', unit: '개', loss: 0.05, price: null,
          q: function (A, p) { return A * (1000 / (120 + p.gap)) * (1000 / p.joist) * 2; }, how: function () { return '판 수 × 장선 수 × 2개' ; } },
        { name: '오일스테인', mat: 'oil-stain', unit: 'L', loss: 0.10, price: 20000,
          q: function (A, p) { return A * 0.15 * p.coats; }, how: function (p) { return '면적 × 0.15L/㎡ × ' + p.coats + '회 (5L 약 10만 원 기준)'; } }
      ]
    },
    {
      id: 'underdrain', name: '유공관 암거배수', unit: 'm', mat: 'perforated-pipe',
      desc: '유공관 Φ150 + 배수 쇄석 + 부직포 감싸기 + 모래 기초',
      params: [
        { key: 'w', label: '도랑 폭', unit: 'mm', value: 400 },
        { key: 'd', label: '쇄석 채움 높이', unit: 'mm', value: 500 }
      ],
      items: [
        { name: 'PE 유공관 Φ150 (6m)', mat: 'perforated-pipe', unit: '본', loss: 0.05, price: 36900,
          q: function (L) { return L / 6; }, how: function () { return '길이 ÷ 6m + 할증 5%'; } },
        { name: '배수 쇄석 13~25mm', mat: 'crushed-stone', unit: '톤', loss: 0.05, price: 135000,
          q: function (L, p) { return L * (p.w / 1000 * p.d / 1000 - 0.018) * AGG; }, how: function (p) { return '길이 × (' + p.w + '×' + p.d + 'mm − 관 단면) × 1.8t/㎥ (소량 톤백 단가)'; } },
        { name: '부직포 200g/㎡', mat: 'nonwoven', unit: '㎡', loss: 0.10, price: 500,
          q: function (L, p) { return L * ((p.w + p.d) * 2 / 1000 + 0.3); }, how: function (p) { return '길이 × (둘레 ' + ((p.w + p.d) * 2) + 'mm + 겹침 300mm)'; } },
        { name: '모래 (기초 50mm)', mat: 'sand', unit: '톤', loss: 0.10, price: 90000,
          q: function (L, p) { return L * p.w / 1000 * 0.05 * SAND; }, how: function (p) { return '길이 × ' + p.w + 'mm × 50mm × 1.6t/㎥'; } }
      ]
    },
    {
      id: 'roof-garden', name: '옥상조경 (정원형)', unit: '㎡', mat: 'artificial-soil',
      desc: '방근시트 + 배수판 + 부직포 + 인공토양 + 바크 멀칭 (방수층 제외)',
      params: [
        { key: 'tSoil', label: '인공토양 두께', unit: 'mm', value: 300 },
        { key: 'tMulch', label: '멀칭 두께', unit: 'mm', value: 50 }
      ],
      items: [
        { name: '방근시트', mat: 'root-barrier', unit: '㎡', loss: 0.15, price: 4400,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 겹침·치켜올림 15%)'; } },
        { name: '배수판 500×500×30', mat: 'drainage-board', unit: '㎡', loss: 0.05, price: 4000,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 할증 5%)'; } },
        { name: '부직포 (필터)', mat: 'nonwoven', unit: '㎡', loss: 0.10, price: 500,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 겹침 10%)'; } },
        { name: '인공토양 (경량토)', mat: 'artificial-soil', unit: '㎥', loss: 0.10, price: 85000,
          q: function (A, p) { return A * p.tSoil / 1000; }, how: function (p) { return '면적 × ' + p.tSoil + 'mm + 침하 할증 10%'; } },
        { name: '바크 멀칭 50L', mat: 'bark', unit: '포', loss: 0.05, price: 7500,
          q: function (A, p) { return A * p.tMulch / 1000 / 0.04; }, how: function (p) { return '면적 × ' + p.tMulch + 'mm ÷ 포당 실용량 약 40L'; } }
      ]
    },
    {
      id: 'gravel-cover', name: '장식 자갈 깔기', unit: '㎡', mat: 'gravel',
      desc: '방초 부직포 + 자갈 (20kg 포대)',
      params: [{ key: 't', label: '자갈 두께', unit: 'mm', value: 60 }],
      items: [
        { name: '장식 자갈 20kg', mat: 'gravel', unit: '포', loss: 0.05, price: 7500,
          q: function (A, p) { return A * p.t / 1000 * SAND * 1000 / 20; }, how: function (p) { return '면적 × ' + p.t + 'mm × 1.6t/㎥ ÷ 20kg'; } },
        { name: '방초용 부직포', mat: 'nonwoven', unit: '㎡', loss: 0.10, price: 500,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 겹침 10%)'; } }
      ]
    },
    {
      id: 'coir-path', name: '야자매트 산책로', unit: '㎡', mat: 'coir-mat',
      desc: '야자매트 35T + 고정핀',
      params: [{ key: 'pin', label: '고정핀 개수', unit: '개/㎡', value: 2 }],
      items: [
        { name: '야자매트 1m×10m 롤', mat: 'coir-mat', unit: '롤', loss: 0.05, price: 71500,
          q: function (A) { return A / 10; }, how: function () { return '면적 ÷ 10㎡ + 할증 5%'; } },
        { name: 'U핀 (고정핀)', mat: 'coir-mat', unit: '개', loss: 0.05, price: null,
          q: function (A, p) { return A * p.pin; }, how: function (p) { return '면적 × ' + p.pin + '개/㎡'; } }
      ]
    },
    {
      id: 'mulch', name: '바크 멀칭', unit: '㎡', mat: 'bark',
      desc: '화단·수목 주변 바크 멀칭',
      params: [{ key: 't', label: '멀칭 두께', unit: 'mm', value: 70 }],
      items: [
        { name: '바크 50L', mat: 'bark', unit: '포', loss: 0.05, price: 7500,
          q: function (A, p) { return A * p.t / 1000 / 0.04; }, how: function (p) { return '면적 × ' + p.t + 'mm ÷ 포당 실용량 약 40L'; } }
      ]
    },
    {
      id: 'grass-paver', name: '잔디블록 주차장', unit: '㎡', mat: 'grass-block',
      desc: '콘크리트 잔디블록 80T + 모래 + 보조기층 (잔디·배합토 제외)',
      params: [
        { key: 'tSand', label: '모래 안정층', unit: 'mm', value: 30 },
        { key: 'tSub', label: '보조기층', unit: 'mm', value: 200 }
      ],
      items: [
        { name: '콘크리트 잔디블록 80T', mat: 'grass-block', unit: '㎡', loss: 0.03, price: 12100,
          q: function (A) { return A; }, how: function () { return '면적 × (1 + 할증 3%)'; } },
        { name: '모래', mat: 'sand', unit: '톤', loss: 0.10, price: 90000,
          q: function (A, p) { return A * p.tSand / 1000 * SAND; }, how: function (p) { return '면적 × ' + p.tSand + 'mm × 1.6t/㎥'; } },
        { name: '보조기층재', mat: 'subbase', unit: '톤', loss: 0, price: 10000,
          q: function (A, p) { return A * p.tSub / 1000 * COMPACT * AGG; }, how: function (p) { return '면적 × ' + p.tSub + 'mm × 1.25 × 1.8t/㎥'; } }
      ]
    }
  ];
})();
