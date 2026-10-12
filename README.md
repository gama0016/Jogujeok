# 조경재료 백과사전

실제 조경 현장에서 자주 쓰는 **재료·자재**의 특성, 규격, 시공 방법, 유지관리, 그리고 **현장 은어**(공구리, 다루끼, 투바이, 노깡 …)를 정리한 정적 웹사이트입니다.
수목·초화류 같은 식재는 조경재료가 아니므로 다루지 않습니다.

## 보는 방법
- `index.html`을 브라우저로 열면 서버 없이 바로 볼 수 있습니다.
- GitHub Pages: 저장소 Settings → Pages → Branch를 선택하면 `https://<아이디>.github.io/Jogujeok/` 주소로 공개됩니다.

## 구성
| 분류 | 파일 |
|---|---|
| 석재 | `data/stone.js` |
| 목재 | `data/wood.js` |
| 콘크리트·조적 | `data/concrete.js` |
| 포장재 | `data/paving.js` |
| 금속재 | `data/metal.js` |
| 골재·토양 | `data/aggregate.js` |
| 배수·관로 | `data/drainage.js` |
| 합성수지·토목섬유 | `data/synthetic.js` |
| 수경시설 | `data/water.js` |
| 조명 | `data/lighting.js` |
| 관수 | `data/irrigation.js` |
| 공정·작업 은어 | `data/glossary.js` |
| 시공 단면도 정의 | `data/sections.js` (그리는 코드: `assets/js/section-diagram.js`) |
| 비교표 추천 묶음 | `data/compare-presets.js` |
| 인터넷 수집 사진 목록·출처 | `data/photos.js` |

항목 형식은 `data/categories.js` 맨 위 주석에 있습니다. 재료를 추가하려면 해당 분류 파일의 `LM.add( … )` 안에 항목을 하나 더 넣으면 됩니다.

## 주요 기능
- **시공 단면도**: 재료 페이지마다 그 재료가 어떤 층·부재와 함께 시공되는지 SVG 개념 단면도로 보여줍니다. `data/sections.js`에서 층 이름·두께를 고치면 그림이 바로 바뀝니다.
- **재료 비교표** (`#/compare`): 최대 4종을 나란히 비교합니다. 재료 페이지의 “비교에 추가” 버튼이나 추천 비교 묶음을 쓰세요.
- **현장 은어 사전** (`#/slang`): 재료 은어와 공정 은어를 어원·바른 말과 함께 정리했습니다.

## 사진 넣기
인터넷 사진은 위키미디어 공용(Wikimedia Commons)의 자유 이용 허락 사진만 썼고, 저작자·라이선스를 사진 아래와 “안내” 페이지에 표시합니다.

`data/photos.js`에 사진이 없는 재료는 `images/` 폴더에 재료 id로 이름을 붙여 넣으면 자동으로 표시됩니다. (이미 사진이 등록된 재료에 더 넣으려면 `data/photos.js`에 항목을 추가하세요.)

```
images/granite-1.jpg ~ granite-3.jpg            재료 사진
images/granite-site-1.jpg ~ granite-site-3.jpg  시공 사례 사진
```

직접 찍지 않은 사진은 출처를 남겨 주세요. 데이터 항목에 `photos: [{ src, caption, credit, type: 'material' | 'site' }]`를 쓰면 캡션과 출처가 함께 표시됩니다.

## 주의
규격·강도 등 수치는 대표값입니다. 은어가 가리키는 치수(다루끼, 오비끼 등)는 지역과 업체마다 다르니 발주와 도면에는 표준 명칭과 mm 치수를 쓰세요.
