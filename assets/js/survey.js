/*
 * 측량 기초 페이지 (#/survey): data/survey.js 내용을 그리고, 수준측량·기울기 계산기를 붙인다
 * LM_SURVEY_VIEW.html() → 페이지 HTML, LM_SURVEY_VIEW.bind(root) → 계산기 연결
 */
(function () {
  var S = window.LM_SURVEY;
  if (!S) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f3(v) { return (Math.round(v * 1000) / 1000).toFixed(3); }

  // 수준측량 그림: 기준점(BM)과 A점에 세운 표척, 가운데 레벨, 수평 시준선
  function svgLevel() {
    var bm = S.level.example[0], a = S.level.example[1], ih = bm.gh + bm.bs, gA = ih - a.fs;
    var sc = 100, base = 262, gy = function (h) { return base - (h - 9.6) * sc; }; // 높이 → y
    var xB = 150, xA = 470, xL = 310;
    var yB = gy(bm.gh), yA = gy(gA), yI = gy(ih);
    var staff = function (x, y0, read, lab) {
      return '<rect x="' + (x - 6) + '" y="' + (y0 - 150) + '" width="12" height="150" fill="#fff" stroke="#1c1f1d"/>' +
        Array.apply(null, Array(15)).map(function (_, i) { return '<rect x="' + (x - 6) + '" y="' + (y0 - 10 - i * 10) + '" width="6" height="5" fill="#b3322a"/>'; }).join('') +
        '<text x="' + (x + (x < xL ? -12 : 12)) + '" y="' + ((y0 + yI) / 2 + 4) + '" text-anchor="' + (x < xL ? 'end' : 'start') + '" class="sv-r">' + lab + ' ' + read.toFixed(3) + '</text>' +
        '<line x1="' + (x + (x < xL ? -9 : 9)) + '" y1="' + yI + '" x2="' + (x + (x < xL ? -9 : 9)) + '" y2="' + y0 + '" stroke="#b3322a" marker-start="url(#sv-ar)" marker-end="url(#sv-ar)"/>';
    };
    return '<svg class="sv-fig" viewBox="0 0 580 300" role="img" aria-label="수준측량: 기준점 지반고 ' + bm.gh.toFixed(3) + ', 후시 ' + bm.bs.toFixed(3) + ', 기계고 ' + f3(ih) + ', 전시 ' + a.fs.toFixed(3) + ', A점 지반고 ' + f3(gA) + '">' +
      '<defs><marker id="sv-ar" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8z" fill="#b3322a"/></marker></defs>' +
      '<path d="M10 ' + (yB + 4) + ' L' + xB + ' ' + yB + ' L' + xL + ' ' + ((yB + yA) / 2 + 6) + ' L' + xA + ' ' + yA + ' L570 ' + (yA - 4) + ' L570 298 L10 298 Z" fill="#e9e1cd" stroke="#1c1f1d"/>' +
      staff(xB, yB, bm.bs, '후시 BS') + staff(xA, yA, a.fs, '전시 FS') +
      '<line x1="' + xB + '" y1="' + yI + '" x2="' + xA + '" y2="' + yI + '" stroke="#1c1f1d" stroke-dasharray="6 4"/>' +
      '<text x="' + xL + '" y="' + (yI - 26) + '" text-anchor="middle" class="sv-t">시준선 = 기계고 IH ' + f3(ih) + '</text>' +
      // 레벨과 삼각대
      '<rect x="' + (xL - 22) + '" y="' + (yI - 9) + '" width="44" height="16" rx="3" fill="#1c1f1d"/><rect x="' + (xL + 20) + '" y="' + (yI - 6) + '" width="8" height="10" fill="#1c1f1d"/>' +
      '<path d="M' + xL + ' ' + (yI + 7) + ' L' + (xL - 26) + ' ' + ((yB + yA) / 2 + 6) + ' M' + xL + ' ' + (yI + 7) + ' L' + (xL + 26) + ' ' + ((yB + yA) / 2 + 6) + ' M' + xL + ' ' + (yI + 7) + ' L' + xL + ' ' + ((yB + yA) / 2 + 6) + '" stroke="#1c1f1d" stroke-width="2"/>' +
      '<text x="' + xB + '" y="' + (yB + 18) + '" text-anchor="middle" class="sv-t">BM ' + bm.gh.toFixed(3) + '</text>' +
      '<text x="' + xA + '" y="' + (yA + 18) + '" text-anchor="middle" class="sv-t">A ' + f3(gA) + '</text>' +
      '</svg>';
  }

  // 점고법 그림: L자 땅을 사각형으로 나누고 꼭짓점마다 몇 칸이 함께 쓰는지 표시
  function svgGrid() {
    var cells = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2]], cs = 54, ox = 20, oy = 16, cnt = {};
    cells.forEach(function (c) { [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (d) { var k = (c[0] + d[0]) + ',' + (c[1] + d[1]); cnt[k] = (cnt[k] || 0) + 1; }); });
    var out = cells.map(function (c) { return '<rect x="' + (ox + c[0] * cs) + '" y="' + (oy + c[1] * cs) + '" width="' + cs + '" height="' + cs + '" fill="#efe7d3" stroke="#1c1f1d"/>'; }).join('');
    Object.keys(cnt).forEach(function (k) {
      var p = k.split(',').map(Number), n = cnt[k], x = ox + p[0] * cs, y = oy + p[1] * cs;
      out += '<circle cx="' + x + '" cy="' + y + '" r="10" fill="' + ['', '#fff', '#f3d9a0', '#e9a05f', '#b3322a'][n] + '" stroke="#1c1f1d"/>' +
        '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" class="sv-n' + (n === 4 ? ' w' : '') + '">' + n + '</text>';
    });
    return '<svg class="sv-grid" viewBox="0 0 ' + (ox * 2 + 3 * cs) + ' ' + (oy * 2 + 3 * cs) + '" role="img" aria-label="점고법: 꼭짓점의 숫자는 그 점을 함께 쓰는 사각형 칸 수(h1~h4)">' + out + '</svg>';
  }

  function html() {
    var lv = S.level, ex = lv.example, ih = 0, rows = '';
    ex.forEach(function (r, i) {
      var gh = r.gh != null ? r.gh : ih - r.fs;
      var newIh = r.bs != null ? gh + r.bs : null;
      rows += '<tr><th scope="row">' + esc(r.p) + '</th><td>' + (r.bs != null ? r.bs.toFixed(3) : '') + '</td><td>' + (r.fs != null ? r.fs.toFixed(3) : '') + '</td>' +
        '<td>' + (newIh != null ? f3(newIh) : '') + '</td><td><b>' + f3(gh) + '</b></td></tr>';
      if (newIh != null) ih = newIh;
    });
    var h = '<div class="survey"><h1>측량 기초</h1><p class="hero-alias">측량 방법 · 수준측량 · 토공량 계산 · 관련 법</p><p class="summary">' + esc(S.lead) + '</p>' +
      '<nav class="toc" aria-label="이 페이지 목차"></nav>';

    h += '<section aria-labelledby="sv-flow"><div class="section-title"><h2 id="sv-flow">조경 공사 속 측량</h2></div><ol class="sv-flow">' +
      S.flow.map(function (f) {
        return '<li><span class="sv-when">' + esc(f.when) + '</span><b>' + esc(f.t) + '</b><p>' + esc(f.d) + '</p>' + (f.ref ? '<span class="sv-ref">' + esc(f.ref) + '</span>' : '') + '</li>';
      }).join('') + '</ol></section>';

    h += '<section aria-labelledby="sv-m"><div class="section-title"><h2 id="sv-m">측량 방법</h2></div><div class="table-wrap"><table class="sv-table"><thead><tr><th scope="col">방법</th><th scope="col">쓰는 장비</th><th scope="col">내용</th></tr></thead><tbody>' +
      S.methods.map(function (m) { return '<tr' + (m.key ? ' class="key"' : '') + '><th scope="row">' + esc(m.t) + '</th><td>' + esc(m.tool) + '</td><td>' + esc(m.d) + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>';

    h += '<section aria-labelledby="sv-l"><div class="section-title"><h2 id="sv-l">수준측량 (레벨 보기)</h2><span>기고식</span></div>' +
      '<div class="sv-two"><figure class="section-figure sv-card">' + svgLevel() + '<figcaption class="section-note">기계고 = 기준점 지반고 + 후시, 구할 점 지반고 = 기계고 − 전시</figcaption></figure>' +
      '<dl class="sv-terms">' + lv.terms.map(function (t) { return '<div><dt>' + esc(t[0]) + '</dt><dd>' + esc(t[1]) + '</dd></div>'; }).join('') + '</dl></div>' +
      '<p class="note">' + esc(lv.books) + '</p>' +
      '<div class="table-wrap"><table class="sv-table num"><caption>기고식 야장 예 (단위 m)</caption><thead><tr><th scope="col">측점</th><th scope="col">후시 BS</th><th scope="col">전시 FS</th><th scope="col">기계고 IH</th><th scope="col">지반고 GH</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="sv-calc"><h3>바로 계산</h3><div class="sv-calc-grid">' +
      '<fieldset><legend>지반고 구하기</legend><label>기준점 지반고 (m)<input type="number" step="0.001" id="sv-gh" value="10.000" inputmode="decimal"></label>' +
      '<label>후시 BS (m)<input type="number" step="0.001" id="sv-bs" value="1.250" inputmode="decimal"></label>' +
      '<label>전시 FS (m)<input type="number" step="0.001" id="sv-fs" value="0.850" inputmode="decimal"></label><output id="sv-out1" aria-live="polite"></output></fieldset>' +
      '<fieldset><legend>기울기 구하기</legend><label>높이 차 (m)<input type="number" step="0.001" id="sv-dh" value="0.12" inputmode="decimal"></label>' +
      '<label>수평거리 (m)<input type="number" step="0.01" id="sv-dl" value="6" inputmode="decimal"></label><output id="sv-out2" aria-live="polite"></output></fieldset>' +
      '</div><p class="note">' + esc(lv.slope) + '</p></div></section>';

    h += '<section aria-labelledby="sv-e"><div class="section-title"><h2 id="sv-e">토공량 계산</h2><span>측량 → 적산</span></div><div class="sv-earth">' +
      S.earth.map(function (e) {
        return '<div class="panel"><h3>' + esc(e.t) + '</h3><p class="sv-f">' + esc(e.f) + '</p><p>' + esc(e.d) + '</p>' + (e.grid ? svgGrid() : '') + '</div>';
      }).join('') + '</div><p class="note">' + esc(S.earthNote) + ' <a href="#/calc">물량·공사비 계산기 ›</a></p></section>';

    h += '<section aria-labelledby="sv-t"><div class="section-title"><h2 id="sv-t">측량 장비</h2></div><dl class="sv-terms sv-tools">' +
      S.tools.map(function (t) { return '<div><dt>' + esc(t[0]) + '</dt><dd>' + esc(t[1]) + '</dd></div>'; }).join('') + '</dl></section>';

    h += '<section aria-labelledby="sv-law"><div class="section-title"><h2 id="sv-law">관련 법·기준</h2></div><ul class="sv-law">' +
      S.law.map(function (l) {
        return '<li><b>' + (l.url ? '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.t) + ' ↗<span class="sr-only"> (새 창)</span></a>' : esc(l.t)) + '</b><p>' + esc(l.d) + '</p></li>';
      }).join('') + '</ul><p class="note">현장 측량 은어(야리방·레베루·나와바리 등)는 <a href="#/slang">현장 은어</a>에서 볼 수 있습니다.</p></section></div>';
    return h;
  }

  function bind(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : null; }
    function calc() {
      var gh = num('sv-gh'), bs = num('sv-bs'), fs = num('sv-fs');
      $('sv-out1').innerHTML = gh == null || bs == null || fs == null ? '숫자를 넣어 주세요' :
        '기계고 <b>' + f3(gh + bs) + '</b> m → 지반고 <b>' + f3(gh + bs - fs) + '</b> m <span>(기준점보다 ' + (bs - fs >= 0 ? '+' : '') + f3(bs - fs) + ' m)</span>';
      var dh = num('sv-dh'), dl = num('sv-dl');
      $('sv-out2').innerHTML = dh == null || !dl ? '수평거리는 0보다 커야 합니다' : '기울기 <b>' + (Math.round(dh / dl * 1000) / 10) + '%</b> <span>(1 : ' + (dh ? Math.round(dl / Math.abs(dh) * 10) / 10 : '∞') + ')</span>';
    }
    ['sv-gh', 'sv-bs', 'sv-fs', 'sv-dh', 'sv-dl'].forEach(function (id) { $(id).addEventListener('input', calc); });
    calc();
  }

  window.LM_SURVEY_VIEW = { html: html, bind: bind };
})();
