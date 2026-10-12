/*
 * 재료 선정 가이드 — 상황(시나리오)별로 조건에 맞는 재료 후보를 추천한다.
 * options[].picks 의 재료 id 순서가 추천 순서다.
 */
window.LM_GUIDE = [
  {
    id: 'parking', title: '주차장·차량 진입로 포장', q: '차가 다니는 바닥을 만들어야 해요',
    consider: ['차량 하중 — 블록은 두께 80mm 이상, 기층 콘크리트 필요 여부', '빗물 처리 — 투수·녹지 면적 기준(지자체 조례)', '유지관리 — 부분 보수 가능 여부'],
    options: [
      { label: '경제성과 내구성이 우선', picks: ['ascon', 'concrete-block-paver'], why: '아스콘은 넓은 면적을 가장 빠르고 싸게 포장한다. 블록(80mm)은 부분 교체가 쉽다.' },
      { label: '녹지·빗물 침투를 늘리고 싶다', picks: ['grass-block', 'permeable-block', 'permeable-concrete'], why: '잔디블록은 녹지 면적으로, 투수블록·투수콘은 빗물 침투로 물순환을 돕는다. 대형 차량 동선은 피한다.' },
      { label: '진입 광장처럼 경관이 중요하다', picks: ['saguseok', 'granite', 'curbstone'], why: '사고석·두꺼운 화강석(50mm 이상 + 콘크리트 기층)은 차량 하중을 견디며 고급스럽다. 속도 저감 효과도 있다.' }
    ]
  },
  {
    id: 'walkway', title: '보행로·광장 포장', q: '사람이 걷는 길이나 광장 바닥을 정해야 해요',
    consider: ['미끄럼 — 물갈기 석재는 외부 바닥에 쓰지 않음', '휠체어·유모차 — 요철 적은 재료', '여름 표면 온도·빛 반사'],
    options: [
      { label: '고급스럽고 오래가는 광장', picks: ['granite', 'washout-concrete', 'basalt'], why: '화강석 판석(버너 마감)은 내구성과 품격이 가장 높다. 노출골재 포장은 이음 없는 자연 질감을 준다.' },
      { label: '예산이 제한된 일반 보도', picks: ['concrete-block-paver', 'permeable-block'], why: '보도블록은 싸고 보수가 쉽다. 같은 예산이라면 투수블록으로 빗물 침투도 챙길 수 있다.' },
      { label: '공원 산책로처럼 자연스럽게', picks: ['masato-paving', 'flagstone', 'coir-mat', 'stepping-stone'], why: '흙포장·자연판석·야자매트는 보행감이 부드럽고 주변 녹지와 어울린다.' }
    ]
  },
  {
    id: 'playground', title: '놀이터 바닥', q: '어린이놀이터 바닥재를 골라야 해요',
    consider: ['어린이놀이시설 안전기준 — 낙하 높이에 맞는 충격흡수 성능', '여름 표면 온도·유해물질', '정기 관리(모래 소독, 칩 보충)'],
    options: [
      { label: '관리가 쉽고 색 연출이 자유로운 바닥', picks: ['rubber-surface'], why: '탄성포장은 이음 없이 충격을 흡수하고 휠체어 접근도 쉽다. 두께는 낙하 높이에 맞춘다.' },
      { label: '자연 재료 중심의 놀이터', picks: ['sand', 'bark'], why: '모래·우드칩은 자연 놀이 요소가 되고 여름에 덜 뜨겁다. 소독·보충 관리가 필요하다.' },
      { label: '다목적 운동 겸 놀이 공간', picks: ['artificial-turf', 'rubber-surface'], why: '인조잔디는 사계절 녹색이고 충진재·하부 패드로 충격흡수를 보완할 수 있다.' }
    ]
  },
  {
    id: 'deck', title: '데크재', q: '데크·보행 교량 바닥재를 골라야 해요',
    consider: ['예산 대비 수명', '도장 등 유지관리 인력', '여름 표면 온도와 맨발 사용 여부'],
    options: [
      { label: '예산을 아끼고 싶다', picks: ['treated-lumber'], why: '방부목이 가장 싸다. 대신 1~2년마다 오일스테인을 칠해야 한다.' },
      { label: '관리 인력이 거의 없다', picks: ['wpc', 'thermo-wood'], why: '합성목재는 도장이 필요 없고 썩지 않는다. 열팽창 간격을 꼭 둔다.' },
      { label: '수변·공공시설처럼 오래가야 한다', picks: ['hardwood-deck'], why: '이페 등 하드우드는 방부제 없이도 20년 이상 간다. 산지 인증(FSC)을 확인한다.' }
    ],
    related: ['oil-stain']
  },
  {
    id: 'edging', title: '화단 경계', q: '포장과 화단 사이 경계를 정리해야 해요',
    consider: ['보행·차량 충격 여부', '디자인 성격(전통·모던·자연)', '곡선 시공 필요 여부'],
    options: [
      { label: '튼튼하고 표준적인 경계', picks: ['curbstone'], why: '화강석 경계석은 가장 흔하고 내구성이 높다. 곡선은 R석을 쓴다.' },
      { label: '얇고 모던한 선', picks: ['corten', 'shape-steel'], why: '코르텐·평강은 얇은 선으로 깔끔하게 정리되고 곡선도 쉽다. 코르텐은 녹물 처리를 계획한다.' },
      { label: '따뜻하거나 자연스러운 분위기', picks: ['brick-clay', 'stone-landscape', 'boulder'], why: '벽돌·자연석은 정원 분위기를 살린다.' }
    ]
  },
  {
    id: 'retaining', title: '단차·옹벽', q: '높이 차이가 있는 땅을 처리해야 해요',
    consider: ['높이 — 1m, 2~3m를 넘으면 구조 검토 필수', '배면 배수 — 대부분의 옹벽 사고 원인', '경관 성격'],
    options: [
      { label: '1m 내외 정원 단차', picks: ['stone-landscape', 'boulder', 'brick-clay'], why: '자연석·호박돌 쌓기, 벽돌 화단 벽으로 부드럽게 처리할 수 있다.' },
      { label: '단지·도로의 중간 높이 옹벽, 경제성 우선', picks: ['segmental-block'], why: '보강토 블록은 시공이 빠르고 경제적이다. 지오그리드·배수층을 설계대로 시공해야 한다.' },
      { label: '전통적이고 견고한 석축', picks: ['kenchi', 'rubble'], why: '견치석 찰쌓기는 높은 석축에 쓰는 전통 공법이다.' },
      { label: '물이 많거나 생태적인 경관', picks: ['gabion'], why: '개비온은 물이 잘 빠져 수압이 걸리지 않고 하천변에도 쓴다.' }
    ]
  },
  {
    id: 'drainage', title: '배수 문제 해결', q: '비가 오면 물이 고여요',
    consider: ['물이 고이는 곳 — 잔디밭(땅속) / 포장면(표면) / 비탈 아래', '최종 배출구 위치(우수관)', '유지관리(낙엽 청소)'],
    options: [
      { label: '잔디밭·식재지에 물이 고인다', picks: ['perforated-pipe', 'crushed-stone', 'nonwoven'], why: '유공관 암거배수로 땅속 물을 모아 집수정으로 보낸다.' },
      { label: '넓은 포장면에 물이 고인다', picks: ['grating', 'catch-basin'], why: '트렌치와 집수정으로 표면수를 모은다. 포장 기울기(1~2%)도 다시 확인한다.' },
      { label: '비탈면 아래로 물이 흘러내린다', picks: ['u-gutter', 'catch-basin'], why: '비탈 아래·산마루에 측구를 두어 물길을 잡는다.' },
      { label: '빗물을 모아 다시 쓰고 싶다', picks: ['rain-tank', 'permeable-block'], why: '저류조에 모아 관수에 쓰고, 투수 포장으로 유출량 자체를 줄인다.' }
    ]
  },
  {
    id: 'water', title: '연못·수경시설', q: '물이 있는 공간을 만들고 싶어요',
    consider: ['사람이 물에 닿는가 — 바닥분수는 수질 관리 의무', '방수 방식', '겨울철 관리(물 빼기·동파)'],
    options: [
      { label: '자연스러운 생태연못', picks: ['pond-liner', 'boulder', 'overflow-drain'], why: '방수시트 연못은 형태가 자유롭고 흙·돌로 덮어 자연스럽다.' },
      { label: '분수·벽천 같은 정형 수경', picks: ['waterproof-coating', 'submersible-pump', 'fountain-nozzle', 'overflow-drain'], why: '콘크리트 수조 + 도막방수가 기본이고, 펌프·노즐로 연출한다.' },
      { label: '아이들이 뛰어노는 바닥분수', picks: ['sand-filter', 'fountain-nozzle', 'inground-light'], why: '물놀이형 수경시설은 여과·살균 설비와 수질 관리가 필수다.' }
    ]
  },
  {
    id: 'roof', title: '옥상조경', q: '건물 옥상에 녹지를 만들어야 해요',
    consider: ['구조 허용 하중 — 가장 먼저 확인', '방수·방근', '관수 방법'],
    options: [
      { label: '기존 건물, 가볍고 빠르게', picks: ['green-roof-module', 'drip-line'], why: '모듈형은 1~2일 만에 설치되고 하중이 가볍다.' },
      { label: '사람이 이용하는 옥상정원', picks: ['artificial-soil', 'drainage-board', 'root-barrier', 'planter'], why: '방근시트 → 배수판 → 부직포 → 인공토양 순서의 표준 단면으로 만든다.' }
    ]
  },
  {
    id: 'slope', title: '비탈면 보호·녹화', q: '깎거나 쌓은 비탈면이 무너지거나 흙이 쓸려요',
    consider: ['비탈 기울기와 흙·암반 여부', '구조적 안정이 필요한지(붕괴 위험)', '시공 시기(발아 적기)'],
    options: [
      { label: '완만한 흙 비탈면', picks: ['vegetation-mat', 'coir-mat'], why: '식생매트로 바로 덮어 침식을 막고 풀을 키운다.' },
      { label: '암반·급경사 비탈면', picks: ['soil-spray'], why: '철망을 고정하고 녹생토를 뿜어 붙여 녹화한다.' },
      { label: '무너질 위험이 있어 구조물이 필요', picks: ['segmental-block', 'gabion', 'kenchi'], why: '녹화만으로는 안정이 안 되면 옹벽·개비온으로 먼저 안정시킨다.' }
    ]
  },
  {
    id: 'lighting', title: '야간 조명', q: '밤에 공원·정원을 밝혀야 해요',
    consider: ['기능(안전 조도) vs 연출(경관)', '눈부심·빛공해(주거지 인접)', '전선관을 포장 전에 묻기'],
    options: [
      { label: '산책로를 안전하게', picks: ['bollard-light', 'lawn-light', 'cable-conduit'], why: '낮은 볼라드·정원등이 눈부심 없이 발밑을 비춘다.' },
      { label: '광장·주차장 전체를 밝게', picks: ['pole-light', 'cable-conduit'], why: '보안등·공원등이 넓은 범위의 기본 조도를 만든다.' },
      { label: '나무·시설을 돋보이게', picks: ['uplight', 'inground-light', 'linear-led'], why: '투광등·매입등·라인조명으로 야간 경관을 연출한다.' }
    ]
  },
  {
    id: 'irrigation', title: '관수 방식', q: '식물에 물을 어떻게 줄지 정해야 해요',
    consider: ['식재 유형(잔디/화단/수목/옥상)', '관리 인력', '물 절약'],
    options: [
      { label: '넓은 잔디밭', picks: ['sprinkler', 'irrigation-controller', 'irrigation-pipe'], why: '팝업 스프링클러를 반경이 겹치게 배치하고 컨트롤러로 자동화한다.' },
      { label: '화단·관목·옥상·플랜터', picks: ['drip-line', 'irrigation-controller'], why: '점적관수는 뿌리 근처에만 물을 줘 낭비가 적다.' },
      { label: '수동 관수·청소 용수', picks: ['hydrant', 'rain-tank'], why: '살수전에 호스를 연결해 쓰고, 빗물을 모아 쓰면 수도 요금을 줄인다.' }
    ]
  },
  {
    id: 'metal', title: '금속 시설물 재료·마감', q: '난간·퍼걸러·볼라드의 금속 재료를 정해야 해요',
    consider: ['해안·염분 환경 여부', '도장 유지관리 가능 여부', '디자인(색·질감)'],
    options: [
      { label: '녹이 절대 나면 안 되는 곳', picks: ['stainless', 'aluminum'], why: '스테인리스(해안은 316), 알루미늄은 도장 없이 오래간다.' },
      { label: '일반 시설, 원하는 색으로', picks: ['steel-pipe', 'powder-coating', 'anticorrosion-paint'], why: '아연도금 강관 + 분체도장이 가장 일반적인 조합이다.' },
      { label: '자연스러운 녹 질감', picks: ['corten'], why: '코르텐은 녹층이 보호막이 되어 도장이 필요 없다.' }
    ]
  }
];
