/*
 * 재료별 시공 단면도 정의
 * kind: layers | curb | wall | deck | trench | pipe | pole | boulder | pond | channel | box | stake | sprinkler | formwork | footing | linearled
 * layers 의 각 층: { n: 이름, t: 두께 표기, h: 두께(mm, 그림 높이 계산), p: 해치 패턴, joints: 줄눈 간격(px), line: 'membrane'|'geotex'|'mesh' }
 * 패턴: conc mortar gravel crushed sand soil stone block brick wood asphalt rubber sbr water metal mulch artsoil plastic turf cobble
 * 치수는 대표적인 예시이며, 실제 설계는 표준시방서·설계도를 따른다.
 */
(function () {
  var SUB = { n: '보조기층 (쇄석 0~40)', t: '150~200', h: 180, p: 'crushed' };
  var CONC_BASE = { n: '기층 콘크리트', t: '100~150', h: 120, p: 'conc' };
  var MESH = { n: '와이어메시', line: 'mesh' };

  function L(title, layers, extra) {
    var o = { kind: 'layers', title: title, layers: layers };
    for (var k in extra || {}) o[k] = extra[k];
    return o;
  }

  window.LM_SECTIONS = {
    // ----- 석재 -----
    'granite': L('화강석 판석 포장 (습식, 보행용)', [
      { n: '화강석 판석 (버너)', t: '30~40', h: 40, p: 'stone', joints: 70, jp: 'mortar' },
      { n: '바탕 모르타르 1:3', t: '30', h: 30, p: 'mortar' },
      CONC_BASE, MESH, SUB]),
    'basalt': L('현무암 판석 포장 (습식)', [
      { n: '현무암 판석', t: '30', h: 30, p: 'stone', joints: 60, jp: 'mortar' },
      { n: '붙임 모르타르', t: '30', h: 30, p: 'mortar' }, CONC_BASE, SUB]),
    'stone-landscape': { kind: 'boulder', title: '조경석 앉히기' },
    'boulder': { kind: 'wall', face: 'boulder', title: '호박돌 찰쌓기 (높이 1m 내외)', faceLabel: '호박돌 + 모르타르 줄눈' },
    'kenchi': { kind: 'wall', face: 'kenchi', title: '견치석 찰쌓기 옹벽' },
    'rubble': L('기초 잡석다짐', [
      { n: '버림 콘크리트', t: '50', h: 50, p: 'conc' },
      { n: '잡석 (100~200) + 사춤 자갈', t: '200', h: 200, p: 'cobble' }]),
    'flagstone': L('자연판석 포장 (건식, 정원 산책로)', [
      { n: '자연판석', t: '30~50', h: 45, p: 'stone', joints: 90, jp: 'soil' },
      { n: '모래·마사토 고르기', t: '30~50', h: 40, p: 'sand' },
      { n: '쇄석 기층', t: '100', h: 100, p: 'crushed' }], { slope: '줄눈: 마사토·잔디·모르타르 중 선택' }),
    'curbstone': { kind: 'curb', title: '화강석 경계석 (보도-식재지)', curbLabel: '화강석 경계석 150×300', reveal: 120, turf: true },
    'stepping-stone': L('디딤돌 놓기', [
      { n: '디딤돌 (지면보다 50 내외 높게)', t: '60~150', h: 90, p: 'stone' },
      { n: '모래·마사토', t: '50', h: 50, p: 'sand' },
      { n: '표토', h: 80, p: 'soil' }], { groundLabel: '원지반' }),
    'saguseok': L('사고석 포장 (차량 진입부)', [
      { n: '사고석 100×100×100', t: '100', h: 100, p: 'stone', joints: 46, jp: 'mortar' },
      { n: '깔모르타르', t: '30', h: 30, p: 'mortar' }, { n: '기층 콘크리트', t: '150', h: 150, p: 'conc' }, SUB]),

    // ----- 목재 -----
    'treated-lumber': { kind: 'deck', title: '방부목 데크 단면' },
    'structural-lumber': { kind: 'deck', title: '구조목으로 짠 데크 하부 구조', post: '기둥 4×4 (89×89)', beam: '멍에 2×8 겹침', joist: '장선 2×6 (38×140) @400' },
    'square-timber': { kind: 'formwork', title: '각재를 쓰는 대표 사례 — 벽체 거푸집' },
    'board-lumber': { kind: 'deck', title: '원바이(1×6) 마감 데크', boardLabel: '원바이 판재 19×140 (간격 5mm)', joist: '장선 2×4 @400' },
    'hardwood-deck': { kind: 'deck', title: '하드우드 데크', boardLabel: '이페 19×90 (선행 드릴)', screw: '스테인리스 피스 또는 히든 클립' },
    'wpc': { kind: 'deck', title: '합성목재 데크', boardLabel: 'WPC 데크재 25×140', joist: '알루미늄·WPC 장선 @300~400', screw: '전용 클립 고정', board: 'metal' },
    'thermo-wood': { kind: 'deck', title: '탄화목 데크', boardLabel: '탄화목 데크재 26×140' },
    'sleeper': L('침목 디딤 포장', [
      { n: '침목 (지면보다 약간 높게)', t: '120~150', h: 130, p: 'wood', joints: 130, jp: 'gravel' },
      { n: '쇄석·모래 고르기', t: '50', h: 50, p: 'crushed' },
      { n: '쇄석 기층', t: '100', h: 100, p: 'crushed' }]),
    'tree-stake': { kind: 'stake', title: '삼각지주 설치 (원주목)' },
    'plywood': { kind: 'formwork', title: '코팅합판 거푸집' },

    // ----- 콘크리트·조적 -----
    'remicon': { kind: 'footing', title: '시설물 기초 (철근콘크리트)' },
    'cement': L('시멘트가 쓰이는 곳 — 판석 습식 포장', [
      { n: '판석', t: '30', h: 30, p: 'stone', joints: 70, jp: 'mortar' },
      { n: '모르타르 (시멘트:모래 1:3)', t: '30', h: 30, p: 'mortar' },
      { n: '콘크리트 (시멘트+모래+자갈)', t: '100', h: 100, p: 'conc' }, SUB]),
    'mortar': L('붙임 모르타르 위치', [
      { n: '석재·타일', t: '30', h: 30, p: 'stone', joints: 70, jp: 'mortar' },
      { n: '붙임 모르타르 (된비빔)', t: '20~40', h: 35, p: 'mortar' },
      { n: '바탕 콘크리트', t: '100', h: 100, p: 'conc' }, SUB]),
    'rebar': { kind: 'footing', title: '철근 배근 (기초 단면)' },
    'wire-mesh': L('콘크리트 포장의 와이어메시 위치', [
      { n: '콘크리트 포장', t: '150', h: 150, p: 'conc' },
      { n: '와이어메시 (상면에서 두께 1/3)', line: 'mesh' },
      { n: 'PE 필름 (분리막)', line: 'membrane' }, SUB]),
    'formwork': { kind: 'formwork', title: '벽체 거푸집 구성' },
    'brick-clay': { kind: 'wall', face: 'masonry', brick: true, title: '점토벽돌 화단 벽', faceLabel: '점토벽돌 쌓기 (줄눈 10)' },
    'block-cement': { kind: 'wall', face: 'masonry', title: '콘크리트 블록 담장·화단 벽', faceLabel: '블록 + 세로 철근·속채움' },
    'segmental-block': { kind: 'wall', face: 'block', title: '보강토 블록 옹벽' },

    // ----- 포장재 -----
    'concrete-block-paver': L('보도블록 포장 (보행용)', [
      { n: '콘크리트 블록', t: '60', h: 60, p: 'block', joints: 44 },
      { n: '모래 안정층', t: '30~40', h: 35, p: 'sand' },
      { n: '보조기층 (쇄석, 보도 100 / 차도·주차장 150)', t: '', h: 120, p: 'crushed' }], { slope: '가장자리는 경계석으로 구속 · 줄눈 모래 채움' }),
    'permeable-block': L('투수블록 포장', [
      { n: '투수블록', t: '60~80', h: 70, p: 'block', joints: 44, jp: 'crushed' },
      { n: '투수성 안정층 (쇄석 5~13)', t: '40', h: 40, p: 'gravel' },
      { n: '부직포', line: 'geotex' },
      { n: '투수성 보조기층 (단입도 쇄석)', t: '200', h: 200, p: 'crushed' }], { groundLabel: '원지반 (빗물 침투)' }),
    'ascon': L('아스콘 포장 (단지 도로)', [
      { n: '표층 아스콘 (밀입도 13)', t: '50', h: 50, p: 'asphalt' },
      { n: '택코트', line: 'membrane' },
      { n: '기층 아스콘', t: '60', h: 60, p: 'asphalt' },
      { n: '보조기층', t: '200', h: 200, p: 'crushed' }]),
    'rubber-surface': L('탄성포장 (놀이터)', [
      { n: '상부 EPDM 칩', t: '10~15', h: 15, p: 'rubber' },
      { n: '하부 SBR 칩 (낙하높이별 두께)', t: '40~90', h: 60, p: 'sbr' },
      { n: '프라이머', line: 'membrane' },
      { n: '기층 콘크리트·아스콘', t: '100', h: 100, p: 'conc' }, SUB]),
    'masato-paving': L('마사토 흙포장 (고화제 혼합)', [
      { n: '마사토 + 고화제', t: '50~100', h: 80, p: 'sand' },
      { n: '보조기층', t: '100~150', h: 130, p: 'crushed' }], { slope: '배수 기울기 2% 내외' }),
    'permeable-concrete': L('투수콘크리트 포장', [
      { n: '투수콘크리트', t: '80~100', h: 100, p: 'gravel' },
      { n: '부직포', line: 'geotex' },
      { n: '투수성 보조기층', t: '150', h: 150, p: 'crushed' }], { groundLabel: '원지반 (빗물 침투)' }),
    'washout-concrete': L('노출골재 포장 (와시다시)', [
      { n: '노출골재 콘크리트 (표면 자갈 노출)', t: '100', h: 100, p: 'gravel' },
      MESH, { n: 'PE 필름', line: 'membrane' }, SUB], { slope: '신축줄눈 4~6m 간격' }),
    'terrazzo': L('인조석 갈기 (도끼다시) 마감', [
      { n: '인조석 바름 (종석+시멘트) 연마', t: '15~20', h: 20, p: 'stone' },
      { n: '바탕 모르타르', t: '30', h: 30, p: 'mortar' },
      { n: '구조체 콘크리트', t: '150', h: 150, p: 'conc' }]),
    'grass-block': L('잔디블록 포장 (주차장)', [
      { n: '잔디블록 + 배합토·잔디', t: '80', h: 80, p: 'turf', joints: 60, jp: 'block' },
      { n: '모래·흙 안정층', t: '30', h: 30, p: 'sand' },
      { n: '보조기층', t: '200', h: 200, p: 'crushed' }]),

    // ----- 금속재 -----
    'stainless': { kind: 'pole', type: 'post', title: '스테인리스 볼라드·난간 기둥 고정', body: '스테인리스 파이프 (STS304)', footing: '기초 콘크리트 (앵커 고정)', conduit: false },
    'steel-pipe': { kind: 'pole', type: 'post', title: '퍼걸러 강관 기둥 고정', body: '아연도금 각관 100×100 (도장)', footing: '독립기초 600×600×800', conduit: false },
    'shape-steel': L('평강 화단 경계 (단면)', [
      { n: '흙 (식재지)', h: 60, p: 'soil' },
      { n: '평강 6×100 (지면 위 20~30 노출)', t: '', h: 100, p: 'metal' },
      { n: '고정 핀 (철근 Φ13) 1m 간격', h: 80, p: 'soil' }]),
    'corten': L('코르텐 화단 경계', [
      { n: '자갈 마감 (녹물 받이)', t: '50', h: 50, p: 'gravel' },
      { n: '코르텐 판 6t (흙 속 150 이상)', t: '', h: 150, p: 'metal' },
      { n: '보조기층·흙', h: 100, p: 'crushed' }]),
    'aluminum': { kind: 'pole', type: 'post', title: '알루미늄 난간 기둥 고정', body: '알루미늄 압출 기둥', footing: '콘크리트 (케미컬 앵커)', conduit: false },
    'anchor-screw': { kind: 'pole', type: 'post', title: '앵커볼트로 기둥 고정하기', body: '기둥 (강관)', footing: '기초 콘크리트', conduit: false },
    'binding-wire': { kind: 'footing', title: '결속선이 쓰이는 곳 — 철근 교차부 결속', n: '철근 교차부를 결속선으로 묶음' },
    'mesh-fence': { kind: 'pole', type: 'post', title: '휀스 기둥 기초', body: '휀스 기둥 Φ60.5 + 메시 패널', footing: '독립기초 300×300×600 (동결심도)', conduit: false, surface: '흙·포장' },
    'gabion': { kind: 'wall', face: 'gabion', title: '개비온 옹벽 (계단식)' },
    'cast-iron': { kind: 'box', title: '집수정 주철 덮개' },

    // ----- 골재·토양 -----
    'sand': L('모래가 쓰이는 곳 — 블록 포장 안정층', [
      { n: '보도블록', t: '60', h: 60, p: 'block', joints: 44 },
      { n: '모래 안정층 (고르기 후 다짐)', t: '30~40', h: 40, p: 'sand' }, SUB]),
    'masato': L('마사토 포장', [
      { n: '마사토 (물다짐)', t: '50~100', h: 80, p: 'sand' },
      { n: '쇄석 기층', t: '100', h: 100, p: 'crushed' }]),
    'crushed-stone': { kind: 'trench', title: '쇄석 배수층 (암거)' },
    'gravel': L('장식 자갈 깔기', [
      { n: '장식 자갈 (콩자갈·백자갈)', t: '50~80', h: 70, p: 'gravel' },
      { n: '방초 시트 (부직포)', line: 'geotex' },
      { n: '정지한 흙', h: 80, p: 'soil' }]),
    'subbase': L('보조기층의 위치 (블록 포장)', [
      { n: '포장재', t: '60', h: 60, p: 'block', joints: 44 },
      { n: '모래', t: '30', h: 30, p: 'sand' },
      { n: '보조기층 (다짐 후 층당 150 이하)', t: '100 (보도)~150 (차도)', h: 150, p: 'crushed' }], { groundLabel: '노상 (원지반 다짐)' }),
    'artificial-soil': L('옥상조경 표준 단면', [
      { n: '멀칭 (바크)', t: '50', h: 40, p: 'mulch' },
      { n: '인공토양 (경량토)', t: '300~600', h: 300, p: 'artsoil' },
      { n: '부직포 (필터)', line: 'geotex' },
      { n: '배수판', t: '25~50', h: 30, p: 'plastic' },
      { n: '방근시트', line: 'membrane' },
      { n: '보호 몰탈·방수층', t: '', h: 30, p: 'mortar' },
      { n: '구조체 슬래브', t: '', h: 120, p: 'conc' }], { groundLabel: '건물 구조체', scale: 0.32 }),
    'bark': L('바크 멀칭', [
      { n: '바크 (줄기에 붙이지 않음)', t: '50~100', h: 80, p: 'mulch' },
      { n: '(선택) 부직포', line: 'geotex' },
      { n: '식재 토양', h: 150, p: 'soil' }]),
    'scoria': L('화산송이 멀칭', [
      { n: '화산송이', t: '30~50', h: 50, p: 'gravel' },
      { n: '식재 토양', h: 150, p: 'soil' }]),

    // ----- 배수·관로 -----
    'hume-pipe': { kind: 'pipe', title: '흄관 매설', pipes: [{ r: 52, n: '흄관 Φ450', fill: '#d9d9d4', thick: 3 }], cover: '토피 1,000 내외', tape: false, bed: '모래·콘크리트 기초' },
    'perforated-pipe': { kind: 'trench', title: '유공관 암거배수' },
    'pvc-pipe': { kind: 'pipe', title: 'PVC 배수관 매설', pipes: [{ r: 24, n: 'PVC VG2 Φ150' }], tape: false },
    'u-gutter': { kind: 'channel', title: 'U형 측구 (덮개 없음)', grating: false, body: 'U형 측구 (PC)' },
    'grating': { kind: 'channel', title: '트렌치 + 그레이팅', body: '트렌치 본체 (PC·폴리머)' },
    'catch-basin': { kind: 'box', title: '집수정 단면' },

    // ----- 합성수지·토목섬유 -----
    'nonwoven': { kind: 'trench', title: '부직포로 감싼 배수층' },
    'drainage-board': L('옥상조경 — 배수판 위치', [
      { n: '인공토양', t: '300', h: 200, p: 'artsoil' },
      { n: '부직포', line: 'geotex' },
      { n: '배수판 (요철에 물 저장)', t: '30', h: 30, p: 'plastic' },
      { n: '방근시트', line: 'membrane' },
      { n: '보호 몰탈·방수층', h: 30, p: 'mortar' },
      { n: '구조체 슬래브', h: 110, p: 'conc' }], { groundLabel: '건물 구조체', scale: 0.4 }),
    'root-barrier': L('옥상조경 — 방근시트 위치', [
      { n: '인공토양', h: 200, p: 'artsoil' },
      { n: '부직포', line: 'geotex' },
      { n: '배수판', h: 30, p: 'plastic' },
      { n: '방근시트 (이음 융착)', line: 'membrane' },
      { n: '방수층', h: 30, p: 'mortar' },
      { n: '구조체 슬래브', h: 110, p: 'conc' }], { groundLabel: '건물 구조체', scale: 0.4 }),
    'artificial-turf': L('인조잔디 포장', [
      { n: '인조잔디 + 충진재', t: '20~65', h: 50, p: 'turf' },
      { n: '쇄석 고르기층', t: '50', h: 50, p: 'gravel' },
      { n: '보조기층 (배수 기울기)', t: '150', h: 150, p: 'crushed' }]),
    'coir-mat': L('야자매트 산책로', [
      { n: '야자매트 (U핀 1m 간격)', t: '20~30', h: 25, p: 'mulch' },
      { n: '노면 정리한 흙·마사토', h: 120, p: 'soil' }]),

    // ----- 수경시설 -----
    'pond-liner': { kind: 'pond', title: '방수시트 연못 (생태연못)' },
    'waterproof-coating': { kind: 'pond', variant: 'basin', title: '콘크리트 분수 수조 (도막방수)' },
    'fountain-nozzle': { kind: 'pond', variant: 'basin', title: '분수 수조와 노즐' },
    'submersible-pump': { kind: 'pond', variant: 'basin', title: '수중펌프 설치 위치' },
    'sand-filter': { kind: 'pond', variant: 'basin', filter: true, title: '순환 계통 (수조 → 여과기)' },
    'overflow-drain': { kind: 'pond', variant: 'basin', title: '오버플로·바닥 배수' },

    // ----- 조명 -----
    'bollard-light': { kind: 'pole', type: 'bollard', title: '볼라드등 설치 단면' },
    'lawn-light': { kind: 'pole', type: 'bollard', title: '정원등 설치', body: '정원등 본체', footing: '소형 기초 (또는 스파이크)', surfaceP: 'turf', surface: '잔디·화단' },
    'uplight': L('수목 투사등 (매입형)', [
      { n: '잔디·표토', h: 60, p: 'turf' },
      { n: '배수 자갈층', t: '100', h: 100, p: 'gravel' },
      { n: '흙', h: 100, p: 'soil' }], { insert: { n: '투사등 (IP67, 각도 조절)', w: 56, through: 2, glow: true } }),
    'pole-light': { kind: 'pole', type: 'pole', title: '보안등·공원등 기초' },
    'inground-light': L('바닥 매입등', [
      { n: '화강석 판석', t: '30', h: 30, p: 'stone', joints: 70, jp: 'mortar' },
      { n: '붙임 모르타르', t: '30', h: 30, p: 'mortar' },
      { n: '기층 콘크리트', t: '120', h: 120, p: 'conc' },
      { n: '배수 자갈 (매입 박스 하부)', t: '100', h: 100, p: 'gravel' }], { insert: { n: '매입 박스 + 등기구 (윗면 = 포장면)', w: 56, through: 3, glow: true } }),
    'linear-led': { kind: 'linearled', title: '벤치 하부 LED 라인조명' },
    'cable-conduit': { kind: 'pipe', title: '조명 전선관 매설', surface: 'paving', pipes: [{ r: 14, n: 'ELP Φ40 (조명)', fill: '#ff9f43' }, { r: 14, n: 'ELP Φ40 (예비)', fill: '#ff9f43' }], cover: '보도 600 이상' },

    // ----- 관수 -----
    'sprinkler': { kind: 'sprinkler', title: '팝업 스프링클러 설치' },
    'drip-line': L('점적관수 호스 배치', [
      { n: '바크 멀칭 (호스 덮기)', t: '50', h: 50, p: 'mulch' },
      { n: '점적 호스 (U핀 고정)', line: 'mesh' },
      { n: '식재 토양', h: 160, p: 'soil' }]),
    'irrigation-pipe': { kind: 'pipe', title: '관수 PE관 매설', pipes: [{ r: 12, n: 'PE Φ32 (본관)', fill: '#2b2b2b' }, { r: 9, n: 'PE Φ20', fill: '#2b2b2b' }], cover: '토피 300~600', tapeLabel: '관수관 표시 테이프' },
    'irrigation-controller': { kind: 'sprinkler', variant: 'hydrant', title: '밸브박스 안 전자밸브', head: '전자밸브 (솔밸브)' },
    'hydrant': { kind: 'sprinkler', variant: 'hydrant', title: '퀵커플러·살수전 박스' },
    'rain-tank': { kind: 'box', variant: 'tank', title: '지하 빗물저류조 (모듈형)' },

    // ----- 시설물 -----
    'bench': { kind: 'bench', title: '등벤치 설치 단면' },
    'pergola': { kind: 'pergola', title: '목재 퍼걸러', post: '기둥 150×150 (방부목·집성재)', beam: '보 2×10 겹보' },
    'gazebo': { kind: 'pergola', variant: 'roof', title: '정자·쉼터 (개념)', post: '기둥 (원형 Φ200~300)', beam: '보·도리' },
    'play-structure': { kind: 'pole', type: 'post', title: '조합놀이대 기둥과 충격흡수 바닥', body: '놀이대 기둥 (스틸·알루미늄)', footing: '기초 (윗면은 바닥재 아래로 묻음)', conduit: false, surfaceP: 'rubber', surface: '충격흡수 바닥 (탄성포장)' },
    'car-bollard': { kind: 'pole', type: 'post', title: '차량 진입 방지 볼라드 고정', body: '볼라드 (높이 800~1,000)', footing: '기초 콘크리트 (매립·앵커)', conduit: false },
    'planter': L('플랜터 내부 단면', [
      { n: '멀칭', t: '30~50', h: 40, p: 'mulch' },
      { n: '식재 토양 (초화 300 / 관목 450~600)', t: '', h: 260, p: 'soil' },
      { n: '부직포', line: 'geotex' },
      { n: '배수층 (자갈·배수판)', t: '50~100', h: 70, p: 'gravel' }], { groundLabel: '플랜터 바닥 (배수구)', groundP: 'metal', scale: 0.38 }),

    // ----- 녹화자재 -----
    'green-roof-module': L('모듈형 옥상녹화 단면', [
      { n: '세덤류 식생', t: '', h: 30, p: 'turf' },
      { n: '경량토 (트레이 안)', t: '50~150', h: 100, p: 'artsoil' },
      { n: '트레이 모듈 (배수 요철)', t: '', h: 30, p: 'plastic' },
      { n: '보호매트', line: 'geotex' },
      { n: '방근시트', line: 'membrane' },
      { n: '방수층·구조체 슬래브', h: 120, p: 'conc' }], { groundLabel: '건물 구조체', groundP: 'conc' }),
    'vegetation-mat': L('식생매트 덮기 (토사 비탈면)', [
      { n: '식생매트 (종자·비료 부착)', t: '10~20', h: 20, p: 'mulch' },
      { n: '고정핀 (U핀·말뚝) 1m 간격', line: 'mesh' },
      { n: '비탈면 표토 (고르기)', h: 120, p: 'soil' }], { groundLabel: '비탈면 원지반', slope: '윗마루 끝은 땅에 묻어 고정' }),
    'soil-spray': L('녹생토 취부 (암반 비탈면)', [
      { n: '식생기반재 (녹생토) 취부', t: '30~100', h: 80, p: 'soil' },
      { n: '철망 (라스망) + 앵커핀', line: 'mesh' },
      { n: '암반 비탈면 (뜬돌 제거)', h: 120, p: 'stone' }], { groundLabel: '원지반 (암반)', groundP: 'stone' }),

    // ----- 토양개량재 -----
    'compost': L('식재 토양 개량 (퇴비 혼합)', [
      { n: '멀칭', t: '50', h: 50, p: 'mulch' },
      { n: '식재 토양 + 퇴비 혼합 (부피 10~20%)', t: '300~600', h: 220, p: 'soil' },
      { n: '심토 (기존 흙)', h: 100, p: 'soil' }], { scale: 0.4 }),
    'lime': L('산성 토양 개량 (석회 혼합)', [
      { n: '표토 + 고토석회 혼합 (pH 검정 후)', t: '200~300', h: 200, p: 'sand' },
      { n: '심토', h: 120, p: 'soil' }], { scale: 0.45 }),

    // ----- 도료·마감재 -----
    'oil-stain': { kind: 'deck', title: '오일스테인을 칠하는 곳 — 데크', boardLabel: '데크재 윗면·옆면·절단면 도장', screw: '피스 머리 주변까지 꼼꼼히' },
    'anticorrosion-paint': L('철재 도장 체계 (확대 단면)', [
      { n: '상도 (우레탄, 색·내후성)', t: '30~50μm', h: 40, p: 'rubber' },
      { n: '중도 (에폭시)', t: '50~100μm', h: 50, p: 'mortar' },
      { n: '하도 (방청 프라이머)', t: '40~75μm', h: 50, p: 'brick' }], { groundLabel: '강재 바탕 (녹·기름 제거)', groundP: 'metal', scale: 0.8 }),
    'powder-coating': L('분체도장 단면 (확대)', [
      { n: '분체 도막 (소부 180~200℃)', t: '60~100μm', h: 60, p: 'rubber' },
      { n: '전처리 피막 (인산염)', line: 'membrane' },
      { n: '아연도금층 (이중 방청 시)', t: '', h: 30, p: 'mortar' }], { groundLabel: '강재·알루미늄 바탕', groundP: 'metal', scale: 0.8 }),
    'water-repellent': L('발수제 침투 (확대 단면)', [
      { n: '발수제 침투층 (표면 수 mm)', t: '', h: 30, p: 'water' },
      { n: '석재·콘크리트', h: 140, p: 'stone' }], { groundLabel: '바탕', groundP: 'stone' })
  };
})();
