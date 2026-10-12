/*
 * 분류 정의 + 재료 등록 도우미
 *
 * 재료 항목 형식 (모든 필드는 선택, id·name·cat 은 필수)
 * {
 *   id:      'granite',              // 영문 소문자, 사진 파일 이름에도 사용 (images/granite-1.jpg)
 *   name:    '화강석',
 *   en:      'Granite',
 *   cat:     'stone',                // 아래 LM_CATEGORIES 의 id
 *   sub:     '가공석',                // 세부 분류
 *   aka:     ['화강암'],               // 다른 이름(표준어·동의어)
 *   slang:   [{ t: '은어', o: '어원', m: '뜻·쓰임' }],   // 현장 은어
 *   summary: '한두 문장 요약',
 *   props:   [['항목', '값'], ...],    // 물리적 특성 표
 *   specs:   ['대표 규격', ...],
 *   pros:    [], cons: [], uses: [],
 *   steps:   ['시공 순서 1', ...],
 *   cautions:['시공 시 주의', ...],
 *   care:    ['유지관리', ...],
 *   related: ['다른 재료 id', ...],
 *   cost:    1 | 2 | 3,               // 상대 가격대 (저가·보통·고가)
 *   photos:  [{ src: 'images/x.jpg', caption: '', credit: '', type: 'material' | 'site' }]
 * }
 * photos 를 비워 두면 images/{id}-1.jpg ~ -3.jpg (재료 사진),
 * images/{id}-site-1.jpg ~ -3.jpg (시공 사례) 파일을 자동으로 찾아 보여줍니다.
 */
window.LM_CATEGORIES = [
  { id: 'stone',     name: '석재',              en: 'Stone',              color: '#8a8f98', desc: '가공석·자연석·경계석 등 돌로 된 재료' },
  { id: 'wood',      name: '목재',              en: 'Timber',             color: '#a0703c', desc: '방부목·구조목·각재·데크재·합성목재' },
  { id: 'concrete',  name: '콘크리트·조적',      en: 'Concrete & Masonry', color: '#6f7a86', desc: '레미콘·모르타르·철근·거푸집·벽돌·블록' },
  { id: 'paving',    name: '포장재',            en: 'Paving',             color: '#b4572e', desc: '보도블록·아스콘·탄성포장·흙포장' },
  { id: 'metal',     name: '금속재',            en: 'Metal',              color: '#4f6d8a', desc: '스테인리스·강관·형강·코르텐·철물' },
  { id: 'aggregate', name: '골재·토양',          en: 'Aggregate & Soil',   color: '#a68a4e', desc: '모래·마사토·쇄석·자갈·인공토양·멀칭재·토양개량재' },
  { id: 'drainage',  name: '배수·관로',          en: 'Drainage',           color: '#3f7f86', desc: '흄관·유공관·측구·트렌치·집수정' },
  { id: 'synthetic', name: '합성수지·토목섬유',   en: 'Synthetics',         color: '#6b5a92', desc: '부직포·배수판·방근시트·인조잔디·야자매트' },
  { id: 'water',     name: '수경시설',          en: 'Water Features',     color: '#2f78b5', desc: '연못·분수·벽천의 방수재·노즐·펌프·여과기' },
  { id: 'lighting',  name: '조명',              en: 'Landscape Lighting', color: '#c08a1e', desc: '볼라드등·잔디등·투광등·보안등·매입등·전선관' },
  { id: 'irrigation',name: '관수',              en: 'Irrigation',         color: '#3c8f5a', desc: '스프링클러·점적호스·관수관·컨트롤러·급수전' },
  { id: 'facility',  name: '시설물',            en: 'Site Furniture',     color: '#7a5c3e', desc: '벤치·퍼걸러·정자·놀이대·볼라드·플랜터 완제품' },
  { id: 'greening',  name: '녹화자재',          en: 'Greening Systems',   color: '#58873a', desc: '옥상녹화 모듈·식생매트·녹생토 취부' },
  { id: 'finish',    name: '도료·마감재',        en: 'Coatings & Finishes', color: '#a14d6b', desc: '오일스테인·방청도료·분체도장·발수제' }
];

window.LM_MATERIALS = [];
window.LM = {
  add: function () {
    for (var i = 0; i < arguments.length; i++) window.LM_MATERIALS.push(arguments[i]);
  }
};
