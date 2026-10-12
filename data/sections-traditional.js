/* 전통 조경재료 단면도 정의 (data/sections.js 와 같은 형식) */
Object.assign(window.LM_SECTIONS, {
 "jangdaeseok": {
  "kind": "wall",
  "face": "masonry",
  "noDrain": true,
  "title": "장대석 기단 (2단 쌓기, 개념)",
  "faceLabel": "장대석 (맞댄면 가공, 뒤뿌리 경사)",
  "footing": "지대석 · 잡석다짐"
 },
 "bakseok": {
  "kind": "layers",
  "title": "박석 깔기 단면 (모래 기초)",
  "layers": [
   {
    "n": "박석 (거친면·정다듬, 줄눈 30 내외)",
    "t": "120~250",
    "h": 150,
    "p": "stone",
    "joints": 90,
    "jp": "sand"
   },
   {
    "n": "모래 깔기 (반죽·콘크리트 금지)",
    "h": 60,
    "p": "sand"
   },
   {
    "n": "흙다짐 (마사토+모래)",
    "h": 120,
    "p": "soil"
   },
   {
    "n": "잡석기층 (배수)",
    "h": 150,
    "p": "cobble"
   }
  ],
  "groundLabel": "원지반",
  "slope": "줄눈은 처마 낙수지점을 피하고 배수 구배를 둔다"
 },
 "jeondol": {
  "kind": "layers",
  "title": "방전 깔기 단면",
  "layers": [
   {
    "n": "방전 300×300",
    "t": "45",
    "h": 45,
    "p": "brick",
    "joints": 66,
    "jp": "sand"
   },
   {
    "n": "깔기모래 (살수 다짐, 구배 1/50)",
    "h": 50,
    "p": "sand"
   },
   {
    "n": "바탕 다짐 (설계도서)",
    "h": 120,
    "p": "soil"
   }
  ],
  "groundLabel": "원지반",
  "slope": "구배: 측구·배수시설 쪽으로 1/50 정도"
 },
 "giwa": {
  "kind": "layers",
  "title": "담장기와이기 구성 (위 → 아래, 개념)",
  "scale": 0.6,
  "layers": [
   {
    "n": "숫마루장 · 적새 · 착고 (마루)",
    "h": 90,
    "p": "brick"
   },
   {
    "n": "수키와 + 홍두깨흙",
    "h": 60,
    "p": "brick"
   },
   {
    "n": "암키와",
    "h": 40,
    "p": "brick"
   },
   {
    "n": "알매흙 (진흙)",
    "h": 40,
    "p": "soil"
   }
  ],
  "groundP": "stone",
  "groundLabel": "담장 몸체 윗면"
 },
 "wapyeon-wall": {
  "kind": "layers",
  "title": "와편 꽃담 구성 (위 → 아래, 개념)",
  "scale": 0.35,
  "layers": [
   {
    "n": "담장기와 (암키와·수키와, 알매흙·홍두깨흙)",
    "h": 120,
    "p": "brick"
   },
   {
    "n": "와편 무늬층 (기와편 + 진흙, 줄눈 2~3cm)",
    "h": 300,
    "p": "brick",
    "joints": 40,
    "jp": "soil"
   },
   {
    "n": "토석·와편 쌓기 몸체",
    "h": 500,
    "p": "cobble"
   },
   {
    "n": "지대석",
    "h": 150,
    "p": "stone"
   }
  ],
  "groundLabel": "기초 다짐"
 },
 "choseok": {
  "kind": "layers",
  "title": "초석 놓기와 적심석지정 (개념)",
  "layers": [
   {
    "n": "초석 (상면 수평, 十자 심먹)",
    "h": 180,
    "p": "stone"
   },
   {
    "n": "고임돌 + 잔돌 섞은 진흙 채움",
    "h": 50,
    "p": "soil"
   },
   {
    "n": "잡석(적심석)지정 — 방사형, 250 내외씩 다짐",
    "h": 250,
    "p": "cobble"
   },
   {
    "n": "또는 모래지정 (200~250씩 물다짐)",
    "h": 120,
    "p": "sand"
   }
  ],
  "groundLabel": "굳은 지층"
 },
 "samhwato": {
  "kind": "layers",
  "title": "강회다짐 마당 포장 (개념)",
  "layers": [
   {
    "n": "강회다짐 (생석회 + 마사토, 켜당 50 내외로 나눠 다짐)",
    "h": 120,
    "p": "mortar"
   },
   {
    "n": "잡석기층 (배수)",
    "h": 150,
    "p": "cobble"
   }
  ],
  "groundLabel": "원지반 다짐",
  "slope": "예: 생석회 128kg + 마사 1.1㎥ / ㎥ (지붕 생석회다짐 배합)"
 },
 "todam": {
  "kind": "layers",
  "title": "판축 토담 구성 (위 → 아래, 개념)",
  "scale": 0.3,
  "layers": [
   {
    "n": "기와 또는 이엉 덮기",
    "h": 150,
    "p": "brick"
   },
   {
    "n": "판축 흙다짐 (거푸집에 300씩 넣고 달고 다짐)",
    "h": 900,
    "p": "soil"
   },
   {
    "n": "지대석 (습기 차단)",
    "h": 200,
    "p": "stone"
   }
  ],
  "groundLabel": "기초 다짐"
 },
 "sagoseok-wall": {
  "kind": "layers",
  "title": "사괴석담 구성 (위 → 아래, 개념)",
  "scale": 0.3,
  "layers": [
   {
    "n": "담장기와 (암키와·수키와, 알매흙·홍두깨흙)",
    "h": 120,
    "p": "brick"
   },
   {
    "n": "전벽돌 띠",
    "h": 180,
    "p": "brick",
    "joints": 30,
    "jp": "mortar"
   },
   {
    "n": "사괴석 바른층쌓기 (150~250각, 50 들여쌓기)",
    "h": 800,
    "p": "stone",
    "joints": 70,
    "jp": "mortar"
   },
   {
    "n": "장대석 지대석",
    "h": 200,
    "p": "stone"
   },
   {
    "n": "잡석다짐",
    "h": 200,
    "p": "cobble"
   }
  ],
  "groundLabel": "원지반"
 }
});
