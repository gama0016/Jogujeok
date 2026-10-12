/*
 * 하자 사례 — 정상 단면(good)과 잘못 시공한 단면(bad)을 나란히 보여준다.
 * good: data/sections.js 의 재료 id (그 재료의 표준 단면을 그대로 사용) 또는 단면 정의 객체
 * bad: 단면 정의 + marks(빨간 하자 표시: crack·sag·arrow·drops·x·path·tilt, t = 설명)
 */
window.LM_DEFECTS = [
  {
    id: 'paver-settlement', title: '보도블록 침하·요철', mats: ['concrete-block-paver', 'subbase', 'sand'],
    symptom: '블록 포장 일부가 움푹 꺼지거나 울퉁불퉁해지고, 비 온 뒤 물웅덩이가 생긴다.',
    causes: ['보조기층 두께 부족·다짐 불량', '모래 안정층을 너무 두껍게 깔아 하중에 밀림', '가장자리 경계석이 없어 블록이 옆으로 벌어짐', '지하 매설관 되메우기 다짐 불량'],
    prevent: ['보조기층을 층당 200mm 이하로 나눠 다지고 평판재하시험으로 확인', '모래층은 30~40mm로 일정하게', '가장자리는 경계석으로 구속'],
    repair: ['침하 부위 블록을 들어내고 보조기층부터 다시 다짐', '모래 고른 뒤 블록 재시공·줄눈 모래 보충'],
    good: 'concrete-block-paver',
    bad: { kind: 'layers', title: '보조기층 부족 + 모래층 과다', layers: [
      { n: '보도블록', t: '60', h: 60, p: 'block', joints: 44 },
      { n: '모래', t: '80 (과다)', h: 80, p: 'sand' },
      { n: '보조기층', t: '50 (부족)', h: 50, p: 'crushed' }],
      marks: [
        { type: 'sag', x1: 120, x2: 330, y: 50, depth: 9, t: '블록이 내려앉아 물웅덩이', lx: 225, ly: 58 },
        { type: 'x', x: 400, y: 95, t: '모래층이 두꺼워 하중에 밀림' },
        { type: 'x', x: 400, y: 124, t: '보조기층 얇고 다짐 부족' }] }
  },
  {
    id: 'slab-crack', title: '판석 깨짐·들뜸', mats: ['granite', 'flagstone', 'remicon'],
    symptom: '판석이 금이 가거나 깨지고, 밟으면 덜컹거리며 들뜬다.',
    causes: ['차량이 다니는 곳을 얇은 판석 + 모래 기층(건식)으로 시공', '붙임 모르타르를 점(點)으로만 발라 빈 공간 발생', '기층 콘크리트에 신축줄눈이 없어 균열이 그대로 전달'],
    prevent: ['차량 통행부는 두께 50mm 이상 + 콘크리트 기층', '모르타르는 판석 밑면 전체에 고르게(전면 붙임)', '기층 콘크리트 신축줄눈 위치에 맞춰 판석 줄눈 배치'],
    repair: ['깨진 판석 제거 → 모르타르 긁어내고 새 판석 전면 붙임', '들뜬 판석은 들어내고 재시공'],
    good: 'granite',
    bad: { kind: 'layers', title: '차량 통행부를 얇은 판석 + 모래로 시공', layers: [
      { n: '판석', t: '30', h: 30, p: 'stone', joints: 70, jp: 'sand' },
      { n: '모래', t: '40', h: 40, p: 'sand' },
      { n: '흙 (보조기층 없음)', h: 100, p: 'soil' }],
      marks: [
        { type: 'arrow', x1: 230, y1: 6, x2: 230, y2: 44, t: '차량 하중', lx: 245, ly: 18 },
        { type: 'crack', x: 170, y: 50, len: 13 },
        { type: 'crack', x: 290, y: 50, len: 13, t: '판석 균열', lx: 290, ly: 56 },
        { type: 'x', x: 400, y: 80, t: '콘크리트 기층 없음' }] }
  },
  {
    id: 'efflorescence', title: '석재·벽돌 백화(흰 얼룩)', mats: ['granite', 'brick-clay', 'mortar', 'water-repellent'],
    symptom: '석재·벽돌 표면이나 줄눈에 흰 가루·결정이 번진다.',
    causes: ['빗물이 줄눈·석재로 스며들어 시멘트 속 석회 성분을 녹여 밖으로 끌고 나옴', '모르타르 물비빔이 너무 묽음', '바닥 기울기가 부족해 물이 오래 머묾'],
    prevent: ['배수 기울기(1~2%) 확보', '줄눈을 꽉 채우고 경화 후 발수제 도포', '물시멘트비가 낮은 모르타르 사용'],
    repair: ['물·솔로 1차 제거 → 전용 백화 제거제(약산성) 사용 후 충분히 헹굼', '완전 건조 후 침투성 발수제 도포'],
    good: 'granite',
    bad: { kind: 'layers', title: '빗물이 줄눈으로 스며들어 백화 발생', layers: [
      { n: '화강석 판석', t: '30', h: 40, p: 'stone', joints: 70, jp: 'mortar' },
      { n: '붙임 모르타르', t: '30', h: 30, p: 'mortar' },
      { n: '기층 콘크리트', t: '120', h: 120, p: 'conc' }],
      marks: [
        { type: 'arrow', x1: 100, y1: 14, x2: 100, y2: 66, color: '#2b7bd0', t: '빗물이 줄눈으로 스며듦', lx: 100, ly: 30 },
        { type: 'drops', x: 200, y: 52, n: 6, color: '#ffffff' },
        { type: 'x', x: 330, y: 56, t: '석회 성분이 표면에 굳어 흰 얼룩' }] }
  },
  {
    id: 'wall-bulge', title: '옹벽 배부름·붕괴', mats: ['segmental-block', 'kenchi', 'perforated-pipe', 'crushed-stone'],
    symptom: '옹벽 가운데가 앞으로 불룩해지고 블록이 벌어지거나, 심하면 무너진다.',
    causes: ['뒤채움을 흙으로만 하고 배수층(자갈)·유공관·물빼기 구멍을 생략', '보강토 옹벽의 지오그리드 길이·간격 부족', '뒤채움 다짐 불량'],
    prevent: ['배면 배수층 + 유공관 + 물빼기 구멍을 반드시 시공', '지오그리드는 구조 계산대로', '층마다 다짐하며 쌓기'],
    repair: ['배부름이 진행 중이면 출입 통제 후 구조 검토', '부분 해체 → 배수층·보강재 보완 후 재시공'],
    good: 'segmental-block',
    bad: { kind: 'wall', face: 'block', noDrain: true, noGrid: true, title: '배수층·보강재 없이 흙으로만 뒤채움',
      marks: [
        { type: 'path', d: 'M114 270 Q 86 180 140 80', dash: true, t: '벽체 배부름', lx: 100, ly: 175 },
        { type: 'arrow', x1: 330, y1: 190, x2: 205, y2: 190, t: '물이 빠지지 못해 수압·토압 증가', lx: 330, ly: 190 },
        { type: 'drops', x: 250, y: 140, n: 5 },
        { type: 'x', x: 200, y: 255, t: '유공관·물빼기 구멍 없음' }] }
  },
  {
    id: 'deck-rot', title: '데크 뒤틀림·부후', mats: ['treated-lumber', 'oil-stain', 'stainless'],
    symptom: '데크재가 휘거나 갈라지고, 기둥 밑동이 썩어 데크가 흔들린다.',
    causes: ['기둥을 흙에 바로 묻음', '데크재 사이 간격 없이 붙여 깔아 물이 고이고 팽창 여유가 없음', '절단면 방부 처리·오일스테인 도장 생략'],
    prevent: ['콘크리트 독립기초 위에 철물로 기둥을 띄움', '판 간격 3~5mm 확보', '절단면 방부제 재도포, 1~2년마다 오일스테인'],
    repair: ['썩은 기둥·판 교체', '들뜬 판은 스테인리스 피스로 재고정'],
    good: 'treated-lumber',
    bad: { kind: 'deck', buried: true, noGap: true, title: '기둥을 흙에 묻고 판 간격 없이 시공',
      marks: [
        { type: 'x', x: 90, y: 245, t: '기둥 밑동 부후 (흙·물에 계속 닿음)' },
        { type: 'x', x: 350, y: 245 },
        { type: 'x', x: 200, y: 68, t: '판 간격 없음 → 물 고임·팽창 뒤틀림' }] }
  },
  {
    id: 'curb-tilt', title: '경계석 기울어짐·밀림', mats: ['curbstone', 'remicon'],
    symptom: '경계석이 바깥으로 기울거나 줄이 삐뚤어지고, 옆 포장이 벌어진다.',
    causes: ['뒷채움(뒷굽) 콘크리트를 생략', '기초 콘크리트 없이 모래·흙 위에 앉힘', '차량 바퀴 충격'],
    prevent: ['기초 콘크리트 + 뒷채움 콘크리트 시공', '실띄우기로 선형·높이 관리'],
    repair: ['기운 구간 경계석을 들어내고 기초·뒷채움 보완 후 재설치'],
    good: 'curbstone',
    bad: { kind: 'curb', noHaunch: true, curbLabel: '화강석 경계석', reveal: 120, turf: true, title: '뒷채움 콘크리트를 생략',
      marks: [
        { type: 'path', d: 'M230 190 L 246 27 L 328 36 L 312 190', dash: true, t: '흙에 밀려 바깥으로 기울어짐', lx: 320, ly: 36 },
        { type: 'x', x: 328, y: 168, t: '뒷채움 콘크리트 없음' }] }
  },
  {
    id: 'drain-clog', title: '유공관 막힘 (암거 배수 불량)', mats: ['perforated-pipe', 'nonwoven', 'crushed-stone'],
    symptom: '시공 직후에는 물이 잘 빠지다가 1~2년 뒤 잔디밭에 다시 물이 고인다.',
    causes: ['부직포 없이 쇄석을 흙에 바로 묻어 흙이 스며듦', '관 기울기 부족·역구배', '출구(집수정) 연결 누락'],
    prevent: ['쇄석층을 부직포로 감싸기', '관 기울기 1% 이상 확인', '반드시 집수정·우수관에 연결'],
    repair: ['출구에서 고압 세척', '막힌 구간은 굴착 후 쇄석·부직포 교체'],
    good: 'perforated-pipe',
    bad: { kind: 'trench', noGeo: true, title: '부직포 없이 쇄석을 묻음',
      marks: [
        { type: 'drops', x: 160, y: 140, n: 8, color: '#8b6a43', t: '흙이 쇄석 틈으로 스며듦', lx: 200, ly: 150 },
        { type: 'x', x: 225, y: 270, t: '관 구멍이 흙으로 막힘' }] }
  },
  {
    id: 'pond-leak', title: '연못 누수', mats: ['pond-liner', 'nonwoven', 'overflow-drain'],
    symptom: '물을 채워도 수위가 계속 내려간다.',
    causes: ['바닥 돌·뿌리를 제거하지 않고 모래·보호 부직포 없이 시트를 깔아 찢어짐', '가장자리 시트 끝이 수위보다 낮음', '배관 관통부 처리 불량'],
    prevent: ['모래 50mm + 상·하부 보호 부직포', '시트 끝을 수위보다 높게 올려 트렌치에 고정', '관통부는 전용 부속·실링'],
    repair: ['물을 빼고 누수 위치를 찾아 같은 재질 패치로 접착 보수'],
    good: 'pond-liner',
    bad: { kind: 'pond', noProtect: true, title: '모래·보호 부직포 없이 시트만 깖',
      marks: [
        { type: 'x', x: 200, y: 245, t: '날카로운 돌에 시트가 찢어짐' },
        { type: 'drops', x: 190, y: 258, n: 4, t: '물이 땅속으로 샘', lx: 300, ly: 262 }] }
  },
  {
    id: 'rust-stain', title: '코르텐 녹물 오염', mats: ['corten', 'granite'],
    symptom: '코르텐 화단·벽체 주변의 밝은 석재·콘크리트에 주황색 녹물 얼룩이 번진다.',
    causes: ['녹층이 안정되기 전(수개월) 빗물에 녹이 씻겨 내려감', '녹물이 흐를 길(자갈 띠)을 계획하지 않음'],
    prevent: ['코르텐 아래·앞에 자갈 띠를 둬 녹물을 받기', '밝은 석재와 바로 붙이지 않기', '공장에서 녹을 미리 안정화한 제품 사용'],
    repair: ['녹 제거제(옥살산 계열)로 세척 — 석재 종류별 시험 후 사용'],
    good: 'corten',
    bad: { kind: 'layers', title: '코르텐 바로 옆에 밝은 석재 포장', layers: [
      { n: '밝은 화강석 포장', t: '30', h: 50, p: 'stone' },
      { n: '코르텐 판 (흙 속 150)', h: 150, p: 'metal' },
      { n: '보조기층·흙', h: 100, p: 'crushed' }],
      marks: [
        { type: 'arrow', x1: 40, y1: 8, x2: 80, y2: 46, color: '#b5501c', t: '빗물에 녹이 씻겨 흘러내림', lx: 60, ly: 20 },
        { type: 'drops', x: 110, y: 52, n: 8, color: '#b5501c', t: '석재 표면 녹물 얼룩', lx: 200, ly: 62 }] }
  },
  {
    id: 'inground-flood', title: '바닥 매입등 침수·고장', mats: ['inground-light', 'cable-conduit'],
    symptom: '비가 온 뒤 매입등이 꺼지거나 렌즈 안에 물이 찬다.',
    causes: ['매입 박스 아래 배수층(자갈)을 생략', '등기구 윗면을 포장면보다 낮게 설치해 물이 고임', '결선부 방수 처리 불량'],
    prevent: ['매입 박스 하부 자갈 배수층', '윗면을 포장면과 같거나 살짝 높게', 'IP67 이상 제품 + 방수 커넥터'],
    repair: ['등기구 분해·건조, 패킹 교체', '박스 높이 재조정·배수층 보완'],
    good: 'inground-light',
    bad: { kind: 'layers', title: '배수층 없이 포장보다 낮게 설치', layers: [
      { n: '화강석 판석', t: '30', h: 30, p: 'stone', joints: 70, jp: 'mortar' },
      { n: '붙임 모르타르', t: '30', h: 30, p: 'mortar' },
      { n: '기층 콘크리트 (배수층 없음)', t: '120', h: 120, p: 'conc' }],
      insert: { n: '매입등', w: 56, through: 3, lift: -8 },
      marks: [
        { type: 'drops', x: 150, y: 50, n: 4, t: '포장보다 낮아 빗물이 고임', lx: 175, ly: 52 },
        { type: 'x', x: 170, y: 125, t: '아래로 물이 빠질 길이 없음' }] }
  },
  {
    id: 'rubber-peel', title: '탄성포장 들뜸·박리', mats: ['rubber-surface', 'remicon'],
    symptom: '탄성포장 표층이 부풀어 오르거나 가장자리부터 떨어져 나간다.',
    causes: ['기층 콘크리트가 덜 마른 상태(습기)에서 시공', '프라이머 생략', '비·저온(5℃ 이하)에서 시공'],
    prevent: ['기층 충분히 양생·건조 후 시공', '프라이머 도포', '기상 조건 확인'],
    repair: ['들뜬 부분을 잘라내고 프라이머 후 부분 재포설'],
    good: 'rubber-surface',
    bad: { kind: 'layers', title: '젖은 기층 위에 프라이머 없이 시공', layers: [
      { n: '상부 EPDM 칩', t: '10~15', h: 15, p: 'rubber' },
      { n: '하부 SBR 칩', t: '40~90', h: 60, p: 'sbr' },
      { n: '기층 콘크리트 (덜 마름)', t: '100', h: 100, p: 'conc' }],
      marks: [
        { type: 'path', d: 'M120 50 Q 170 22 220 50', t: '표층 들뜸·부풂', lx: 170, ly: 36 },
        { type: 'drops', x: 300, y: 100, n: 5, t: '기층 속 습기가 올라옴', lx: 320, ly: 108 }] }
  }
];
