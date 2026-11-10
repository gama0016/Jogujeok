/*
 * 조적(벽돌) 그림: 벽돌의 면·토막·벽 두께(SVG) + 쌓기 방식 3D 모형(CSS 3D, 라이브러리 없음)
 * LM_MASONRY.panel()  → 재료 페이지에 넣을 HTML
 * LM_MASONRY.mount(root) → 3D 모형 조작(끌기·터치로 전방향 회전, 두 손가락·휠 확대, 방향키)
 */
(function () {
  var D = window.LM_MASONRY_DATA;
  if (!D) return;
  var L = D.size.l, W = D.size.w, H = D.size.h, J = D.size.joint, P = H + J; // 켜 높이 67
  var Q = (W - J) / 2;           // 반절 너비 40 (반절 두 장 + 줄눈 = 90)
  var K75 = (L + J) * 0.75 - J;  // 칠오토막 140
  var K50 = (L + J) * 0.5 - J;   // 반토막 90

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- 쌓기 방식별 벽돌 배치 (단위 mm, x: 벽 길이, z: 벽 두께, c: 켜 번호) ----------
  // k: s 길이(온장) / h 마구리(온장) / q 반절 / k75 칠오토막 / k50 반토막 / k25 이오토막
  function brick(c, x, len, z, dep, k, rot) { return { c: c, x: x, len: len, z: z, dep: dep, k: k, rot: rot || 0 }; }
  function both(out, c, x, len, k) { out.push(brick(c, x, len, 0, W, k)); out.push(brick(c, x, len, W + J, W, k)); } // 1.0B 앞·뒤 두 줄
  function head(out, c, x, k) { out.push(brick(c, x, k === 'q' ? Q : W, 0, L, k || 'h')); }               // 벽 두께를 가로지름

  function stretchRow(out, c, n, x0) { for (var i = 0; i < n; i++) both(out, c, (x0 || 0) + i * (L + J), L, 's'); }
  function englishHeader(out, c, len) { // 마구리 + 반절 … 반절 + 마구리
    head(out, c, 0); head(out, c, W + J, 'q');
    var x = W + J + Q + J;
    while (x + W + J + Q + J + W <= len + 0.1) { head(out, c, x); x += W + J; }
    head(out, c, x, 'q'); head(out, c, x + Q + J);
  }
  var BUILD = {
    english: function () {
      var o = [], n = 4, len = n * (L + J) - J;
      for (var c = 0; c < 6; c++) { if (c % 2 === 0) stretchRow(o, c, n); else englishHeader(o, c, len); }
      return o;
    },
    dutch: function () {
      var o = [], n = 3, len = K75 + J + n * (L + J) + K75;
      for (var c = 0; c < 6; c++) {
        if (c % 2 === 0) { both(o, c, 0, K75, 'k75'); stretchRow(o, c, n, K75 + J); both(o, c, len - K75, K75, 'k75'); }
        else for (var x = 0; x < len; x += W + J) head(o, c, x);
      }
      return o;
    },
    flemish: function () {
      var o = [];
      for (var c = 0; c < 6; c++) {
        // A켜: 길이·마구리·길이·마구리·길이 / B켜: 마구리·반절·길이·마구리·길이·반절·마구리
        var seq = c % 2 === 0 ? ['s', 'h', 's', 'h', 's'] : ['h', 'q', 's', 'h', 's', 'q', 'h'], x = 0;
        seq.forEach(function (k) {
          if (k === 's') { both(o, c, x, L, 's'); x += L + J; }
          else { head(o, c, x, k); x += (k === 'q' ? Q : W) + J; }
        });
      }
      return o;
    },
    american: function () {
      var o = [], n = 4, len = n * (L + J) - J;
      for (var c = 0; c < 7; c++) {
        if (c === 5) englishHeader(o, c, len);                     // 6번째 켜: 마구리
        else if (c % 2 === 0 || c === 6) stretchRow(o, c, n);
        else { both(o, c, 0, K50, 'k50'); stretchRow(o, c, n - 1, K50 + J); both(o, c, len - K50, K50, 'k50'); }
      }
      return o;
    },
    yeongrong: function () {
      var o = [], gap = 110;
      for (var c = 0; c < 6; c++) {
        if (c === 0 || c === 5) { for (var i = 0; i < 4; i++) o.push(brick(c, i * (L + J), L, 0, W, 's')); }
        else if (c % 2 === 1) { [0, L + gap, 2 * (L + gap)].forEach(function (x) { o.push(brick(c, x, L, 0, W, 's')); }); }
        else {
          o.push(brick(c, 0, K75, 0, W, 'k75'));
          o.push(brick(c, K75 + J, L, 0, W, 's'));
          o.push(brick(c, K75 + J + L + gap, L, 0, W, 's'));
          o.push(brick(c, 4 * (L + J) - J - K75, K75, 0, W, 'k75'));
        }
      }
      return o;
    },
    eotmo: function () {
      var o = [], len = 4 * (L + J) - J;
      for (var c = 0; c < 5; c++) {
        if (c === 2) {
          var span = (L + W) / Math.SQRT2, step = (len - span) / 3;
          // 뒷모서리는 벽 뒷면에 맞추고 앞모서리만 벽면 밖으로 톱니처럼 나오게
          for (var i = 0; i < 4; i++) o.push(brick(c, span / 2 + i * step - L / 2, L, W - span / 2 - W / 2, W, 'h', 45));
        } else if (c % 2 === 0) { for (var k = 0; k < 4; k++) o.push(brick(c, k * (L + J), L, 0, W, 's')); }
        else {
          o.push(brick(c, 0, K50, 0, W, 'k50'));
          for (var m = 0; m < 3; m++) o.push(brick(c, K50 + J + m * (L + J), L, 0, W, 's'));
          o.push(brick(c, len - K50, K50, 0, W, 'k50'));
        }
      }
      return o;
    }
  };

  var KIND = {
    s: { n: '길이 (온장)', col: [192, 96, 63] },
    h: { n: '마구리 (온장)', col: [214, 138, 96] },
    q: { n: '반절', col: [227, 180, 90] },
    k75: { n: '칠오토막', col: [227, 180, 90] },
    k50: { n: '반토막', col: [227, 180, 90] },
    k25: { n: '이오토막', col: [227, 180, 90] }
  };
  function shade(rgb, f) { return 'rgb(' + rgb.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); }).join(',') + ')'; }

  // ---------- 2D 그림 (SVG) ----------
  var BR = '#c0603f', BR2 = '#a54e33', BR3 = '#d98a5f', YL = '#e3b45a', INK = 'var(--ink, #222)';
  function svgFaces() {
    var s = 0.9, l = L * s, h = H * s, dx = W * s * 0.62, dy = W * s * 0.42, x0 = 24, y0 = 24 + dy;
    var front = [[x0, y0], [x0 + l, y0], [x0 + l, y0 + h], [x0, y0 + h]];
    var top = [[x0, y0], [x0 + dx, y0 - dy], [x0 + l + dx, y0 - dy], [x0 + l, y0]];
    var side = [[x0 + l, y0], [x0 + l + dx, y0 - dy], [x0 + l + dx, y0 - dy + h], [x0 + l, y0 + h]];
    function poly(p, f) { return '<polygon points="' + p.map(function (q) { return q.join(','); }).join(' ') + '" fill="' + f + '" stroke="#5a2a1c" stroke-width="1"/>'; }
    function t(x, y, a, b) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" class="ms-ft">' + a + '</text>' + (b ? '<text x="' + x + '" y="' + (y + 14) + '" text-anchor="middle" class="ms-fs">' + b + '</text>' : ''); }
    return '<svg viewBox="0 0 ' + (x0 + l + dx + 24) + ' ' + (y0 + h + 22) + '" role="img" aria-label="벽돌의 세 면: 평면 190×90, 길이면 190×57, 마구리면 90×57">' +
      poly(top, BR3) + poly(front, BR) + poly(side, BR2) +
      t(x0 + l / 2 + dx / 2, y0 - dy / 2 + 4, '평면 190×90') + t(x0 + l / 2, y0 + h / 2 - 2, '길이면', '190×57') +
      t(x0 + l + dx / 2, y0 + h / 2 - dy / 2 - 2, '마구리면', '90×57') + '</svg>';
  }
  function svgJoints(stack) {
    var w = 40, h = 14, j = 3, rows = 5, out = '';
    for (var r = 0; r < rows; r++) {
      var off = stack ? 0 : (r % 2 ? -w / 2 : 0);
      for (var x = off; x < 4 * (w + j); x += w + j) {
        var x1 = Math.max(0, x), x2 = Math.min(4 * (w + j) - j, x + w);
        if (x2 > x1) out += '<rect x="' + (x1 + 4) + '" y="' + (4 + r * (h + j)) + '" width="' + (x2 - x1) + '" height="' + h + '" fill="' + BR + '"/>';
      }
    }
    if (stack) for (var k = 1; k < 4; k++) out += '<rect x="' + (4 + k * (w + j) - j) + '" y="4" width="' + j + '" height="' + (rows * (h + j) - j) + '" fill="' + YL + '"/>';
    return '<svg viewBox="0 0 ' + (4 * (w + j) + 5) + ' ' + (rows * (h + j) + 5) + '" role="img" aria-label="' + (stack ? '통줄눈: 세로줄눈이 위아래로 이어짐' : '막힌줄눈: 세로줄눈이 켜마다 엇갈림') + '">' + out + '</svg>';
  }
  function svgBat(b) {
    var s = 0.42, l = L * s, w = W * s, fl = b.half ? l : l * b.f, fw = b.half ? w / 2 : w;
    return '<svg viewBox="0 0 ' + (l + 4) + ' ' + (w + 4) + '" role="img" aria-label="' + esc(b.n + ': ' + b.m) + '">' +
      '<rect x="2" y="2" width="' + l + '" height="' + w + '" fill="none" stroke="#999" stroke-dasharray="3 2"/>' +
      '<rect x="2" y="2" width="' + fl + '" height="' + fw + '" fill="' + (b.f === 1 && !b.half ? BR : YL) + '"/></svg>';
  }
  function svgThick() {
    var s = 0.62, rowH = 30, out = '', mx = 0;
    D.thickness.forEach(function (t, i) {
      var x = 44, y = 6 + i * rowH;
      out += '<text x="0" y="' + (y + 15) + '" class="ms-t" text-anchor="start">' + t.b + '</text>';
      t.parts.forEach(function (p) {
        var w = (p === '길이' ? L : W) * s;
        out += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="20" fill="' + (p === '길이' ? '#a77b62' : '#d9785a') + '"/>' +
          '<text x="' + (x + w / 2) + '" y="' + (y + 14) + '" text-anchor="middle" class="ms-w">' + p + '</text>';
        x += w + J * s;
      });
      mx = Math.max(mx, x);
      out += '<text x="' + (44 + 400 * s + 8) + '" y="' + (y + 15) + '" class="ms-s" text-anchor="start">' + t.mm + 'mm</text>';
    });
    return '<svg viewBox="0 0 ' + (44 + 400 * s + 60) + ' ' + (D.thickness.length * rowH + 6) + '" role="img" aria-label="벽 두께 표기: 0.5B 90, 1.0B 190, 1.5B 290, 2.0B 390mm">' + out + '</svg>';
  }

  function panel() {
    var tabs = '', lastGroup = null;
    D.bonds.forEach(function (b, i) {
      if (b.group && b.group !== lastGroup) tabs += '<span class="b3d-group">' + esc(b.group) + '</span>';
      lastGroup = b.group || null;
      tabs += '<button type="button" role="tab" class="tab' + (i ? '' : ' active') + '" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') +
        ' data-bond="' + b.id + '">' + esc(b.name.replace(' 쌓기', '')) + '</button>';
    });
    var legend = ['s', 'h', 'q', 'k75', 'k50'].map(function (k) {
      return '<span><i style="background:' + shade(KIND[k].col, 1) + '"></i>' + (k === 'q' || k === 'k75' || k === 'k50' ? '' : '') + esc(KIND[k].n) + '</span>';
    }).join('');
    var html = '<section class="masonry masonry-3d" aria-labelledby="b3d-h"><div class="section-title"><h2 id="b3d-h">벽돌 쌓기 3D</h2><span>끌거나 터치해서 아무 방향으로나 돌려 보기</span></div>' +
      '<div class="bond3d" id="bond3d"><div class="b3d-tabs" role="tablist" aria-label="쌓기 방식">' + tabs + '</div>' +
      '<div class="b3d-body"><div class="b3d-stage" id="b3d-stage" tabindex="0" role="img" aria-roledescription="3D 모형" aria-label="벽돌 쌓기 3D 모형. 끌거나 방향키로 돌리고, +와 -로 확대·축소합니다.">' +
      '<div class="b3d-scene" id="b3d-scene"></div><p class="b3d-hint" aria-hidden="true">끌어서 돌리기 · 두 손가락/휠로 확대</p></div>' +
      '<div class="b3d-side"><div class="b3d-desc" id="b3d-desc" aria-live="polite"></div>' +
      '<label class="b3d-range"><span>쌓은 켜 수 <b id="b3d-cn"></b></span><input type="range" id="b3d-courses" min="1" max="6" value="6"></label>' +
      '<div class="b3d-views" role="group" aria-label="보는 방향"><button type="button" class="btn" data-view="iso">비스듬히</button><button type="button" class="btn" data-view="front">정면</button>' +
      '<button type="button" class="btn" data-view="end">벽 끝</button><button type="button" class="btn" data-view="top">위에서</button></div>' +
      '<div class="b3d-legend" aria-label="색 구분">' + legend + '</div></div></div>' +
      '<p class="section-note">표준형 190×90×57, 줄눈 10mm(틈으로 표시) 비율로 그린 모형입니다. 노란색은 잘라 쓴 토막입니다. 벽 끝과 모서리에서 토막을 넣어 세로줄눈을 엇갈리게 맞춥니다.</p></div></section>';

    html += '<section class="masonry" aria-labelledby="mb-h"><div class="section-title"><h2 id="mb-h">벽돌의 면·쌓기 용어·토막·벽 두께</h2><span>KS L 4201 표준형 190×90×57</span></div>' +
      '<div class="ms-grid">' +
      '<figure class="ms-card"><figcaption>벽돌의 면 <span>어느 면이 드러나느냐에 따라 쌓기 방법이 갈린다</span></figcaption>' + svgFaces() +
      '<p class="ms-note">높이 57mm는 현장에서 보통 <b>60</b>으로 기억하고 말한다 (“190에 90에 60”).</p></figure>' +
      '<figure class="ms-card"><figcaption>쌓기 용어</figcaption><dl class="ms-terms">' +
      D.terms.map(function (t) { return '<div><dt>' + esc(t.t) + '</dt><dd>' + esc(t.m) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="ms-joints"><div>' + svgJoints(false) + '<b>막힌줄눈</b></div><div>' + svgJoints(true) + '<b>통줄눈</b></div></div></figure>' +
      '<figure class="ms-card"><figcaption>토막 <span>위에서 내려다본 모양, 점선은 잘라 낸 부분</span></figcaption><ul class="ms-bats">' +
      D.bats.map(function (b) { return '<li>' + svgBat(b) + '<b>' + esc(b.n) + '</b><span>' + esc(b.m) + '</span></li>'; }).join('') + '</ul></figure>' +
      '<figure class="ms-card"><figcaption>벽 두께 표기</figcaption>' + svgThick() + '<p class="ms-note">' + esc(D.thicknessNote) + '</p></figure>' +
      '</div><p class="section-note">자료: KS L 4201 점토벽돌, KCS 34 50 05 3.2.7(2) 벽돌쌓기, 조경구조및적산 수업자료</p></section>';
    return html;
  }

  // ---------- 3D 모형 ----------
  function mount(root) {
    var box = root.querySelector('#bond3d');
    if (!box) return;
    var stage = box.querySelector('#b3d-stage'), scene = box.querySelector('#b3d-scene');
    var desc = box.querySelector('#b3d-desc'), range = box.querySelector('#b3d-courses'), cn = box.querySelector('#b3d-cn');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var VIEWS = { iso: [-24, -34], front: [0, 0], end: [-8, -90], top: [-90, 0] };
    var ax = VIEWS.iso[0], ay = VIEWS.iso[1], zoom = 1, cur = null, maxC = 6;

    function apply(anim) {
      scene.style.transition = anim && !reduce ? 'transform .45s ease' : 'none';
      scene.style.transform = 'scale(' + zoom + ') rotateX(' + ax + 'deg) rotateY(' + ay + 'deg)';
    }
    function face(cls, w, h, tf, col) {
      return '<div class="b3d-f ' + cls + '" style="width:' + w + 'px;height:' + h + 'px;margin:' + (-h / 2) + 'px 0 0 ' + (-w / 2) + 'px;transform:' + tf + ';background:' + col + '"></div>';
    }
    function build(id) {
      var b = D.bonds.filter(function (x) { return x.id === id; })[0];
      var list = BUILD[id]();
      maxC = 0;
      var minX = 1e9, maxX = -1e9, maxZ = 0;
      list.forEach(function (r) { maxC = Math.max(maxC, r.c + 1); minX = Math.min(minX, r.x); maxX = Math.max(maxX, r.x + r.len); maxZ = Math.max(maxZ, r.z + r.dep); });
      var sw = stage.clientWidth || 600;
      var s = Math.min(0.62, (sw * 0.62) / (maxX - minX));
      var cx = (minX + maxX) / 2, cy = maxC * P / 2, cz = maxZ / 2;
      var html = '';
      list.forEach(function (r) {
        var w = r.len * s, h = H * s, d = r.dep * s, col = KIND[r.k].col;
        var px = (r.x + r.len / 2 - cx) * s, py = (cy - (r.c * P + H / 2)) * s, pz = (cz - (r.z + r.dep / 2)) * s; // 앞면(z=0)이 화면 쪽
        html += '<div class="b3d-b" data-c="' + r.c + '" style="transform:translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,' + pz.toFixed(1) + 'px)' + (r.rot ? ' rotateY(' + r.rot + 'deg)' : '') + '">' +
          face('fr', w, h, 'translateZ(' + d / 2 + 'px)', shade(col, 1)) +
          face('bk', w, h, 'rotateY(180deg) translateZ(' + d / 2 + 'px)', shade(col, 0.78)) +
          face('rt', d, h, 'rotateY(90deg) translateZ(' + w / 2 + 'px)', shade(col, 0.86)) +
          face('lt', d, h, 'rotateY(-90deg) translateZ(' + w / 2 + 'px)', shade(col, 0.86)) +
          face('tp', w, d, 'rotateX(90deg) translateZ(' + h / 2 + 'px)', shade(col, 1.16)) +
          face('bt', w, d, 'rotateX(-90deg) translateZ(' + h / 2 + 'px)', shade(col, 0.6)) + '</div>';
      });
      // 바닥판(기초면): 방향을 잃지 않게
      var gw = (maxX - minX + 160) * s, gd = (maxZ + 160) * s;
      html += '<div class="b3d-ground" style="width:' + gw + 'px;height:' + gd + 'px;margin:' + (-gd / 2) + 'px 0 0 ' + (-gw / 2) + 'px;transform:translateY(' + (cy * s + 1) + 'px) rotateX(90deg)"></div>';
      scene.innerHTML = html;
      range.max = maxC; range.value = maxC; cn.textContent = maxC + '켜';
      desc.innerHTML = '<h3>' + esc(b.name) + (b.aka ? ' <span>' + esc(b.aka) + '</span>' : '') + ' <em>' + esc(b.wall) + ' 벽</em></h3><p>' + esc(b.d) + '</p><ul>' +
        b.pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
      stage.setAttribute('aria-label', b.name + ' 3D 모형 (' + b.wall + ' 벽, ' + maxC + '켜). 끌거나 방향키로 돌리고, +와 -로 확대·축소합니다.');
      cur = id;
      apply(false);
    }
    function showCourses(n) {
      scene.querySelectorAll('.b3d-b').forEach(function (el) { el.style.display = +el.getAttribute('data-c') < n ? '' : 'none'; });
      cn.textContent = n + '켜';
    }

    // 탭
    var tabs = [].slice.call(box.querySelectorAll('.b3d-tabs .tab'));
    function select(t) {
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
      build(t.getAttribute('data-bond'));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!k) return;
        e.preventDefault();
        var n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); select(n);
      });
    });
    range.addEventListener('input', function () { showCourses(+range.value); });
    box.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { var v = VIEWS[b.getAttribute('data-view')]; ax = v[0]; ay = v[1]; apply(true); });
    });

    // 끌기·터치: 한 손가락은 회전(위아래·좌우 제한 없음), 두 손가락은 확대
    var pts = {}, last = null, pinch0 = 0, zoom0 = 1;
    function dist() { var p = Object.keys(pts).map(function (k) { return pts[k]; }); return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); }
    // 모형 위에서 위아래로 끌 때 화면이 스크롤되지 않게: touch-action만으로는 일부 브라우저(특히 iOS)에서
    // 3D 변형된 자식 위의 세로 끌기를 스크롤로 넘겨 버리므로 터치 이벤트 기본 동작을 직접 막는다
    function stop(e) { if (e.cancelable) e.preventDefault(); }
    stage.addEventListener('touchstart', stop, { passive: false });
    stage.addEventListener('touchmove', stop, { passive: false });
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') e.preventDefault();   // 끌 때 글자 선택·페이지 끌림 방지
      if (document.activeElement !== stage) stage.focus({ preventScroll: true });
      stage.setPointerCapture(e.pointerId);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(pts).length;
      if (n === 1) last = { x: e.clientX, y: e.clientY };
      if (n === 2) { pinch0 = dist(); zoom0 = zoom; }
      stage.classList.add('dragging');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(pts).length;
      if (n === 1 && last) {
        ay += (e.clientX - last.x) * 0.5;
        ax -= (e.clientY - last.y) * 0.5;
        last = { x: e.clientX, y: e.clientY };
        apply(false);
      } else if (n === 2 && pinch0) {
        zoom = Math.max(0.5, Math.min(2.6, zoom0 * dist() / pinch0)); apply(false);
      }
    });
    function up(e) {
      delete pts[e.pointerId];
      var k = Object.keys(pts);
      last = k.length === 1 ? { x: pts[k[0]].x, y: pts[k[0]].y } : null;
      if (!k.length) stage.classList.remove('dragging');
    }
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoom = Math.max(0.5, Math.min(2.6, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); apply(false);
    }, { passive: false });
    stage.addEventListener('keydown', function (e) {
      var k = e.key, step = e.shiftKey ? 45 : 10;
      if (k === 'ArrowLeft') ay -= step; else if (k === 'ArrowRight') ay += step;
      else if (k === 'ArrowUp') ax += step; else if (k === 'ArrowDown') ax -= step;
      else if (k === '+' || k === '=') zoom = Math.min(2.6, zoom * 1.1);
      else if (k === '-') zoom = Math.max(0.5, zoom * 0.9);
      else return;
      e.preventDefault(); apply(false);
    });

    build(D.bonds[0].id);
  }

  window.LM_MASONRY = { panel: panel, mount: mount };
})();
