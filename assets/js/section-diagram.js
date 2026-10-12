/*
 * 시공 단면도 그리기 (SVG)
 * data/sections.js 의 단면 정의를 받아 도면처럼 그린다.
 * 모든 그림은 '종이' 배경(밝은색) 위에 표준 재료 해치로 그린다.
 */
(function () {
  'use strict';

  var LX = 470;          // 라벨 열 시작 x
  var VBW = 760;         // viewBox 폭
  var uid = 0;

  // ---------- 해치 패턴 ----------
  function defs(P) {
    function pat(id, w, h, bg, body) {
      return '<pattern id="' + P + id + '" patternUnits="userSpaceOnUse" width="' + w + '" height="' + h + '">' +
        '<rect width="' + w + '" height="' + h + '" fill="' + bg + '"/>' + body + '</pattern>';
    }
    return '<defs>' +
      pat('conc', 24, 24, '#e6e6e2', '<circle cx="4" cy="5" r="1" fill="#777"/><circle cx="15" cy="14" r="1.2" fill="#777"/><path d="M17 4 l3 5 h-6z" fill="none" stroke="#888" stroke-width=".8"/><path d="M5 16 l3 5 h-6z" fill="none" stroke="#888" stroke-width=".8"/>') +
      pat('mortar', 8, 8, '#d9d8d2', '<circle cx="2" cy="2" r=".7" fill="#666"/><circle cx="6" cy="6" r=".7" fill="#666"/>') +
      pat('gravel', 20, 16, '#efe6d2', '<circle cx="5" cy="5" r="3.2" fill="none" stroke="#8a7a58" stroke-width=".9"/><circle cx="15" cy="11" r="3.6" fill="none" stroke="#8a7a58" stroke-width=".9"/><circle cx="13" cy="3" r="1.6" fill="none" stroke="#8a7a58" stroke-width=".8"/>') +
      pat('crushed', 18, 16, '#ece3cf', '<path d="M2 6 l4 -4 l4 3 l-2 4z" fill="none" stroke="#7d6e50" stroke-width=".9"/><path d="M10 13 l3 -4 l4 2 l-1 4z" fill="none" stroke="#7d6e50" stroke-width=".9"/>') +
      pat('sand', 10, 10, '#f6ecc8', '<circle cx="2" cy="3" r=".7" fill="#a8914e"/><circle cx="7" cy="8" r=".7" fill="#a8914e"/><circle cx="8" cy="2" r=".5" fill="#a8914e"/>') +
      pat('soil', 22, 14, '#e2cfb0', '<path d="M2 4 h5 M12 10 h6 M14 3 h3 M4 11 h3" stroke="#8b6a43" stroke-width="1"/>') +
      pat('earth', 12, 12, '#ffffff', '<path d="M0 12 L12 0" stroke="#555" stroke-width=".9"/>') +
      pat('stone', 10, 10, '#d8d8d8', '<path d="M0 10 L10 0 M0 0 L10 10" stroke="#777" stroke-width=".6"/>') +
      pat('block', 10, 10, '#cfcfcf', '<path d="M0 10 L10 0" stroke="#666" stroke-width=".7"/>') +
      pat('brick', 8, 8, '#e7b7a2', '<path d="M0 8 L8 0" stroke="#9c4f35" stroke-width=".8"/>') +
      pat('wood', 30, 10, '#e9cf9f', '<path d="M0 3 q7 -2 15 0 t15 0 M0 7 q7 2 15 0 t15 0" fill="none" stroke="#a5773a" stroke-width=".8"/>') +
      pat('asphalt', 6, 6, '#6b6b6b', '<circle cx="2" cy="2" r=".8" fill="#2f2f2f"/><circle cx="5" cy="5" r=".6" fill="#9a9a9a"/>') +
      pat('rubber', 8, 8, '#4a6fa0', '<circle cx="2" cy="2" r="1" fill="#2d4466"/><circle cx="6" cy="6" r="1" fill="#88a7cf"/>') +
      pat('sbr', 8, 8, '#3a3a3a', '<circle cx="2" cy="3" r="1.1" fill="#666"/><circle cx="6" cy="6" r="1" fill="#222"/>') +
      pat('water', 30, 12, '#d6ebf8', '<path d="M0 6 q7.5 -4 15 0 t15 0" fill="none" stroke="#5b9bd1" stroke-width=".9"/>') +
      pat('metal', 6, 6, '#b8c6d6', '<path d="M0 6 L6 0" stroke="#5a6f86" stroke-width=".8"/>') +
      pat('mulch', 16, 10, '#b98d5b', '<path d="M2 3 l5 1 M9 7 l5 -2 M3 8 l3 -1" stroke="#6d4a26" stroke-width="1.4"/>') +
      pat('artsoil', 12, 12, '#e8dccb', '<circle cx="3" cy="3" r="1.4" fill="#fff" stroke="#aaa" stroke-width=".5"/><circle cx="9" cy="9" r="1" fill="#9a7b55"/>') +
      pat('plastic', 16, 10, '#5d5d6a', '<path d="M0 8 l4 -6 l4 6 l4 -6 l4 6" fill="none" stroke="#a9a9c0" stroke-width="1"/>') +
      pat('turf', 12, 12, '#cfe3b4', '<path d="M0 12 L12 0" stroke="#7aa35a" stroke-width=".7"/>') +
      pat('cobble', 26, 22, '#ddd', '<ellipse cx="8" cy="7" rx="7" ry="5" fill="#cfcfcf" stroke="#666" stroke-width=".8"/><ellipse cx="20" cy="17" rx="6" ry="4.5" fill="#cfcfcf" stroke="#666" stroke-width=".8"/>') +
      '</defs>';
  }

  function Canvas(h) {
    this.P = 'sd' + (++uid) + '-';
    this.parts = [];
    this.labels = [];
    this.h = h;
  }
  Canvas.prototype = {
    f: function (p) { return p ? 'url(#' + this.P + p + ')' : 'none'; },
    rect: function (x, y, w, h, p, extra) {
      this.parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + attrs({ fill: this.f(p), stroke: '#333', 'stroke-width': 1 }, extra) + '/>');
    },
    poly: function (pts, p, extra) {
      this.parts.push('<polygon points="' + pts.map(function (q) { return q[0] + ',' + q[1]; }).join(' ') + '"' + attrs({ fill: this.f(p), stroke: '#333', 'stroke-width': 1 }, extra) + '/>');
    },
    line: function (x1, y1, x2, y2, extra) {
      this.parts.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + attrs({ stroke: '#333', 'stroke-width': 1 }, extra) + '/>');
    },
    path: function (d, extra) { this.parts.push('<path d="' + d + '" ' + (extra || 'fill="none" stroke="#333" stroke-width="1"') + '/>'); },
    circle: function (cx, cy, r, p, extra) {
      this.parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + attrs({ fill: p && p.charAt(0) === '#' ? p : this.f(p), stroke: '#333', 'stroke-width': 1 }, extra) + '/>');
    },
    text: function (x, y, t, extra) {
      this.parts.push('<text x="' + x + '" y="' + y + '" font-size="11" fill="#444" ' + (extra || '') + '>' + esc(t) + '</text>');
    },
    raw: function (s) { this.parts.push(s); },
    geotex: function (d) { this.path(d, 'fill="none" stroke="#1e7b4a" stroke-width="2" stroke-dasharray="6 3"'); },
    membrane: function (d) { this.path(d, 'fill="none" stroke="#1a1a1a" stroke-width="3"'); },
    turfTop: function (x, y, w) {
      var d = '';
      for (var i = x + 3; i < x + w - 2; i += 6) d += 'M' + i + ' ' + y + ' l-2 -7 M' + (i + 1) + ' ' + y + ' l2 -6 ';
      this.path(d, 'fill="none" stroke="#4f8a34" stroke-width="1.1"');
    },
    label: function (x, y, t) { this.labels.push({ x: x, y: y, t: t }); },
    ground: function (x, y, w, h) { this.rect(x, y, w, h || 30, 'earth', 'stroke="none"'); this.line(x, y, x + w, y); },
    svg: function () {
      // 라벨 겹침 정리 (시공 단계에서는 이미 시공된 부분의 라벨만)
      var clipY = this.clipY;
      var L = this.labels.filter(function (l) { return clipY == null || clipY <= 0 || l.y >= clipY - 1; }).sort(function (a, b) { return a.y - b.y; });
      var gap = 17, minY = 16, maxY = this.h - 8;
      L.forEach(function (l, i) { l.ly = Math.max(l.y, i ? L[i - 1].ly + gap : minY); });
      for (var i = L.length - 1; i >= 0; i--) {
        var lim = i === L.length - 1 ? maxY : L[i + 1].ly - gap;
        if (L[i].ly > lim) L[i].ly = lim;
      }
      var out = L.map(function (l) {
        return '<circle cx="' + l.x + '" cy="' + l.y + '" r="2.4" fill="#c0392b"/>' +
          '<polyline points="' + l.x + ',' + l.y + ' ' + (LX - 14) + ',' + l.ly + ' ' + (LX - 4) + ',' + l.ly + '" fill="none" stroke="#c0392b" stroke-width=".9"/>' +
          '<text x="' + LX + '" y="' + (l.ly + 4) + '" font-size="12.5" fill="#1d1d1d">' + esc(l.t) + '</text>';
      }).join('');
      if (CUR && CUR.marks) drawMarks(this, CUR.marks);
      var body = this.parts.join('');
      if (this.clipY != null && this.clipY > 0) {
        // 시공 단계: 아직 시공하지 않은 부분은 흐리게, 시공된 부분(clipY 아래)만 진하게
        var cy = this.clipY;
        body = '<clipPath id="' + this.P + 'clip"><rect x="0" y="' + cy + '" width="' + VBW + '" height="' + (this.h - cy) + '"/></clipPath>' +
          '<g opacity=".13">' + body + '</g><g clip-path="url(#' + this.P + 'clip)">' + body + '</g>' +
          '<line x1="20" y1="' + cy + '" x2="440" y2="' + cy + '" stroke="#c0392b" stroke-width="1" stroke-dasharray="4 4" opacity=".6"/>';
      }
      return '<svg class="section-svg" viewBox="0 0 ' + VBW + ' ' + this.h + '" xmlns="http://www.w3.org/2000/svg" role="img">' +
        defs(this.P) + '<rect width="' + VBW + '" height="' + this.h + '" fill="#fdfcf8"/>' +
        body + out + '</svg>';
    }
  };

  // 기본 속성 + 추가 속성 문자열을 합친다 (같은 이름은 추가 속성이 우선)
  function attrs(base, extra) {
    var o = {}, k, m, re = /([\w-]+)="([^"]*)"/g;
    for (k in base) o[k] = base[k];
    while (extra && (m = re.exec(extra))) o[m[1]] = m[2];
    var out = '';
    for (k in o) out += ' ' + k + '="' + o[k] + '"';
    return out;
  }
  var CUR = null;
  // 하자 표시: 빨간 균열·처짐·화살표·물방울·X·메모
  function drawMarks(c, marks) {
    var R = 'stroke="#d0021b" fill="none" stroke-width="2.2"';
    marks.forEach(function (m) {
      if (m.type === 'crack') {
        var d = 'M' + m.x + ' ' + m.y, len = m.len || 40;
        for (var i = 1; i <= 4; i++) d += ' L' + (m.x + (i % 2 ? 6 : -4)) + ' ' + (m.y + len * i / 4);
        c.path(d, R);
      } else if (m.type === 'sag') {
        c.path('M' + m.x1 + ' ' + m.y + ' Q' + ((m.x1 + m.x2) / 2) + ' ' + (m.y + (m.depth || 18) * 2) + ' ' + m.x2 + ' ' + m.y, R + ' stroke-dasharray="6 3"');
      } else if (m.type === 'arrow') {
        var ang = Math.atan2(m.y2 - m.y1, m.x2 - m.x1), a1 = ang + 2.6, a2 = ang - 2.6;
        c.path('M' + m.x1 + ' ' + m.y1 + ' L' + m.x2 + ' ' + m.y2 + ' M' + m.x2 + ' ' + m.y2 + ' l' + (Math.cos(a1) * 10) + ' ' + (Math.sin(a1) * 10) +
          ' M' + m.x2 + ' ' + m.y2 + ' l' + (Math.cos(a2) * 10) + ' ' + (Math.sin(a2) * 10), R.replace('#d0021b', m.color || '#d0021b'));
      } else if (m.type === 'drops') {
        for (var k = 0; k < (m.n || 3); k++) {
          var dx = m.x + k * 12, dy = m.y + (k % 2) * 8;
          c.path('M' + dx + ' ' + dy + ' q4 7 0 9 q-4 -2 0 -9z', 'fill="' + (m.color || '#2b7bd0') + '" stroke="none"');
        }
      } else if (m.type === 'x') {
        c.path('M' + (m.x - 9) + ' ' + (m.y - 9) + ' l18 18 M' + (m.x + 9) + ' ' + (m.y - 9) + ' l-18 18', R + ' stroke-width="3"');
      } else if (m.type === 'path') {
        c.path(m.d, R + (m.dash ? ' stroke-dasharray="6 3"' : ''));
      } else if (m.type === 'tilt') {
        c.path('M' + m.x + ' ' + m.y + ' a' + (m.r || 30) + ' ' + (m.r || 30) + ' 0 0 1 ' + (m.r || 30) + ' ' + (m.r || 30) * 0.4, R);
      }
      if (m.t) c.label(m.lx != null ? m.lx : (m.x != null ? m.x : m.x1), m.ly != null ? m.ly : (m.y != null ? m.y : m.y1), '⚠ ' + m.t);
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lt(l) { return l.n + (l.t ? ' ' + l.t : ''); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---------- 1. 적층 단면 (포장·옥상 등) ----------
  function layers(s) {
    var X = 30, W = 400, sc = s.scale || 0.45;
    var hs = s.layers.map(function (l) { return l.line ? 0 : clamp(l.h * sc, 10, 80); });
    var top = 50;
    var total = hs.reduce(function (a, b) { return a + b; }, 0);
    var c = new Canvas(Math.max(top + total + 70, 40 + s.layers.length * 18 + 30));
    var y = top;
    if (s.layers[0] && s.layers[0].p === 'turf') c.turfTop(X, y, W);
    var ys = [];
    s.layers.forEach(function (l, i) {
      var h = hs[i];
      ys.push(y);
      if (l.line === 'membrane') { c.membrane('M' + X + ' ' + y + ' H' + (X + W)); c.label(X + W * 0.62, y, lt(l)); return; }
      if (l.line === 'geotex') { c.geotex('M' + X + ' ' + y + ' H' + (X + W)); c.label(X + W * 0.72, y, lt(l)); return; }
      if (l.line === 'mesh') { c.path('M' + X + ' ' + y + ' H' + (X + W), 'stroke="#1f4e8c" stroke-width="1.6" stroke-dasharray="2 4"'); c.label(X + W * 0.55, y, lt(l)); return; }
      c.rect(X, y, W, h, l.p);
      if (l.joints) {
        for (var jx = X + l.joints; jx < X + W - 4; jx += l.joints) c.rect(jx - 2, y, 4, h, l.jp || 'sand', 'stroke-width=".6"');
      }
      if (l.p === 'plastic') c.rect(X, y, W, h, null, 'stroke="#333"');
      c.label(X + W * (0.58 + (i % 3) * 0.12), y + h / 2, lt(l));
      y += h;
    });
    if (s.groundP) { c.rect(X, y, W, 34, s.groundP); } else { c.ground(X, y, W, 34); }
    c.label(X + W * 0.86, y + 18, s.groundLabel || '원지반 다짐');
    if (s.stage && s.stage.upto != null && s.stage.upto < s.layers.length) {
      var n = s.layers.length, k = s.stage.upto;
      c.clipY = k <= 0 ? y : ys[n - k];
    }
    if (s.insert) {
      var ins = s.insert, iw = ins.w || 60, ix = X + W * 0.28;
      var depth = 0, n = ins.through || 2;
      for (var k = 0; k < n && k < hs.length; k++) depth += hs[k];
      c.rect(ix, top - (ins.lift || 0), iw, depth + (ins.lift || 0), ins.p || 'metal');
      if (ins.glow) c.path('M' + (ix + iw / 2 - 6) + ' ' + (top - 2) + ' L' + (ix - 30) + ' ' + (top - 46) + ' M' + (ix + iw / 2 + 6) + ' ' + (top - 2) + ' L' + (ix + iw + 30) + ' ' + (top - 46), 'stroke="#e0a100" stroke-width="1.5" stroke-dasharray="4 3" fill="none"');
      if (ins.jet) c.path('M' + (ix + iw / 2) + ' ' + top + ' q-4 -24 0 -44 q4 -10 0 -6', 'stroke="#3d8bd0" stroke-width="2" fill="none"');
      c.label(ix + iw / 2, top + 8, ins.n);
    }
    if (s.slope) c.text(X, 22, s.slope);
    return c.svg();
  }

  // ---------- 2. 경계석 ----------
  function curb(s) {
    var c = new Canvas(300), k = 0.55;
    var st = s.stage && s.stage.st != null ? s.stage.st : 99;
    var G = 245, X = 30, W = 400;
    c.ground(X, G, W, 36);
    var cw = (s.cw || 150) * k, ch = (s.ch || 300) * k, cx = 230;
    var baseH = 100 * k, baseY = G - baseH;
    var curbBottom = baseY, curbTop = curbBottom - ch;
    // 왼쪽 포장층
    var left = s.left || [{ n: '보도블록', h: 60, p: 'block' }, { n: '모래', h: 30, p: 'sand' }, { n: '보조기층', h: 150, p: 'crushed' }];
    var paveTop = curbTop + (s.reveal || 0) * k;
    var yy = paveTop, tot = 0;
    left.forEach(function (l) { tot += l.h * k; });
    var fit = (G - paveTop) / tot;
    if (st >= 4) left.forEach(function (l, i) {
      var h = l.h * k * fit;
      c.rect(X, yy, cx - X - 30, h, l.p, l.joints ? '' : '');
      if (i === 0 && l.joints) for (var jx = X + 30; jx < cx - 30; jx += 30) c.line(jx, yy, jx, yy + h, 'stroke-width="2.4" stroke="#bfae7a"');
      c.label(X + 40 + i * 40, yy + h / 2, lt(l));
      yy += h;
    });
    // 기초 콘크리트
    if (st >= 1) c.rect(cx - 30, baseY, cw + 60, baseH, 'conc');
    // 뒷채움(뒷굽) 콘크리트
    if (st >= 3 && !s.noHaunch) c.poly([[cx + cw, baseY], [cx + cw + 30, baseY], [cx + cw, baseY - ch * 0.45]], 'conc');
    // 오른쪽 흙
    var soilTop = curbTop + (s.soilDrop || 50) * k;
    if (st >= 4) c.poly([[cx + cw, soilTop], [X + W, soilTop], [X + W, G], [cx + cw + 30, G], [cx + cw + 30, baseY], [cx + cw, baseY - ch * 0.45]], s.rightP || 'soil');
    if (st >= 4 && (s.rightP || 'soil') === 'soil' && s.turf) c.turfTop(cx + cw + 2, soilTop, X + W - cx - cw - 4);
    // 경계석
    if (st >= 2) {
      c.rect(cx, curbTop, cw, ch, 'stone');
      c.path('M' + cx + ' ' + (curbTop + 6) + ' L' + (cx + 6) + ' ' + curbTop, 'stroke="#333" stroke-width="1" fill="none"');
      c.label(cx + cw / 2, curbTop + ch * 0.3, s.curbLabel || '경계석');
    }
    if (st === 2) c.line(X, curbTop, X + W, curbTop, 'stroke="#c0392b" stroke-dasharray="6 4"');
    if (st === 2) c.text(X + 4, curbTop - 6, '실띄우기 (선형·높이 기준)', 'fill="#c0392b"');
    if (st >= 1) c.label(cx + cw / 2, baseY + baseH / 2, '기초 콘크리트 t100');
    if (st >= 3 && !s.noHaunch) c.label(cx + cw + 8, baseY - ch * 0.12, '뒷채움 콘크리트');
    if (st >= 4) c.label(X + W - 40, soilTop + 20, s.rightLabel || '식재지 토양');
    c.label(X + W - 30, G + 18, '원지반 다짐');
    if (st >= 4) c.text(cx - 4, 18, '줄눈 10mm · 1,000mm마다');
    return c.svg();
  }

  // ---------- 3. 옹벽·쌓기 ----------
  function wall(s) {
    var c = new Canvas(340);
    if (s.stage && s.stage.y != null) c.clipY = s.stage.y;
    var X = 20, W = 420, base = 290, H = 210, top = base - H;
    var face = s.face || 'kenchi';
    c.ground(X, base + 10, W, 36);
    // 앞쪽 지반
    c.rect(X, base - 20, 90, 30, 'soil');
    // 기초
    c.rect(100, base - 20, 140, 30, 'conc');
    c.label(170, base - 5, s.footing || '기초 콘크리트');
    var batter = face === 'masonry' || face === 'boulder' ? 0.04 : face === 'block' ? 0.12 : face === 'gabion' ? 0 : 0.28;
    var fx0 = 115, fx1 = fx0 + H * batter;
    var thick = face === 'gabion' ? 0 : 55;
    // 배면 영역
    var backX0 = fx0 + thick, backX1 = fx1 + thick;
    var drainW = 40;
    if (face === 'gabion') {
      var tiers = [[fx0, 100], [fx0 + 20, 80], [fx0 + 40, 60]], ty = base - 20;
      var th = H / 3;
      tiers.forEach(function (t, i) {
        var y0 = ty - th * (i + 1);
        c.rect(t[0], y0, t[1], th, 'cobble');
        c.path('M' + t[0] + ' ' + y0 + ' h' + t[1] + ' v' + th + ' h-' + t[1] + 'z', 'fill="none" stroke="#3a556e" stroke-width="2"');
      });
      backX0 = fx0 + 100; backX1 = fx0 + 100;
      c.geotex('M' + (fx0 + 102) + ' ' + (base - 20) + ' V' + top);
      c.poly([[fx0 + 100, top], [X + W, top], [X + W, base + 10], [240, base + 10], [240, base - 20], [fx0 + 100, base - 20]], 'soil');
      c.geotex('M' + (fx0 + 102) + ' ' + (base - 20) + ' V' + top);
      c.label(fx0 + 50, base - 50, '개비온(철망+채움돌)');
      c.label(fx0 + 70, top + 30, '채움돌 (망 눈보다 큰 돌)');
      c.label(fx0 + 102, top + 90, '부직포 (토사 유출 방지)');
      c.label(X + W - 40, top + 50, '뒤채움 흙 다짐');
      c.turfTop(fx0 + 102, top, X + W - fx0 - 104);
      return c.svg();
    }
    // 뒤채움 배수층 / 흙
    c.poly([[backX1, top], [X + W, top], [X + W, base + 10], [240, base + 10], [240, base - 20], [backX0, base - 20]], 'soil');
    if (!s.noDrain) {
      c.poly([[backX1, top + 10], [backX1 + drainW, top + 10], [backX0 + drainW, base - 20], [backX0, base - 20]], 'crushed');
      c.geotex('M' + (backX1 + drainW) + ' ' + (top + 10) + ' L' + (backX0 + drainW) + ' ' + (base - 20));
    }
    // 벽체
    var body = face === 'kenchi' ? 'stone' : face === 'block' ? 'block' : face === 'masonry' ? (s.brick ? 'brick' : 'block') : face === 'boulder' ? 'cobble' : 'stone';
    c.poly([[fx0, base - 20], [backX0, base - 20], [backX1, top], [fx1, top]], body);
    if (face === 'kenchi') {
      // 견치석 앞면 줄눈
      for (var r = 1; r < 6; r++) {
        var yy = base - 20 - (H / 6) * r, xx = fx0 + (H / 6) * r * batter;
        c.line(xx, yy, xx + 30, yy - 8, 'stroke="#555"');
      }
      c.poly([[fx0 + 30, base - 20], [backX0, base - 20], [backX1, top], [fx1 + 30, top]], 'conc', 'stroke-dasharray="3 2"');
      c.label(fx0 + (H - 70) * batter + 15, top + 70, '견치석 (앞면 300×300)');
      c.label(fx1 + 42, top + 40, '뒤채움 콘크리트 (찰쌓기)');
      c.text(fx0 - 8, top - 8, '기울기 1 : 0.3');
    } else if (face === 'block') {
      for (var b = 1; b < 7; b++) {
        var by = base - 20 - (H / 7) * b, bx = fx0 + (H / 7) * b * batter;
        c.line(bx, by, bx + thick, by);
        if (b % 2 === 0 && !s.noGrid) c.path('M' + (bx + thick) + ' ' + by + ' H' + (X + W - 20), 'stroke="#1f6f99" stroke-width="2" stroke-dasharray="10 3" fill="none"');
      }
      c.label(fx0 + (H - 60) * batter + 20, top + 60, s.faceLabel || '보강토 블록');
      if (!s.noGrid) c.label(X + W - 70, base - 20 - (H / 7) * 2, '지오그리드 (보강재)');
    } else if (face === 'masonry') {
      for (var m = 1; m < 12; m++) c.line(fx0 + m * H / 12 * batter, base - 20 - m * H / 12, backX0 + m * H / 12 * batter, base - 20 - m * H / 12, 'stroke="#777"');
      c.label(fx0 + 25, top + 60, s.faceLabel || '조적 벽체');
    } else {
      c.label(fx0 + 25, top + 60, s.faceLabel || '쌓기 돌');
    }
    if (!s.noDrain) {
      // 물빼기 구멍
      var wy = base - 20 - H * 0.3;
      c.line(fx0 - 14, wy + 6, backX0 + 30, wy - 4, 'stroke="#1f4e8c" stroke-width="4"');
      c.label(fx0 - 6, wy + 4, '물빼기 구멍 (PVC Φ50)');
      // 유공관
      c.circle(backX0 + 18, base - 32, 9, '#f5f5f5', 'stroke-dasharray="2 2"');
      c.label(backX0 + 18, base - 32, '유공관 Φ100');
      c.label(backX1 + 20, top + 50, '배수층 (쇄석)');
      c.label(backX1 + drainW, top + 20, '부직포');
    }
    c.label(X + W - 30, top + 80, '뒤채움 흙 다짐');
    c.turfTop(backX1 + 2, top, X + W - backX1 - 4);
    return c.svg();
  }

  // ---------- 4. 데크 ----------
  function deck(s) {
    var c = new Canvas(300), X = 30, W = 400, G = 230;
    if (s.stage && s.stage.y != null) c.clipY = s.stage.y;
    c.ground(X, G, W, 40);
    c.rect(X, G - 14, W, 14, 'crushed');
    c.label(X + 30, G - 7, s.under || '쇄석 + 잡초방지 시트');
    var posts = [90, 350];
    posts.forEach(function (px) {
      if (s.buried) { c.rect(px - 18, 120, 36, G + 30 - 120, 'wood'); }
      else { c.rect(px - 35, G - 14, 70, 50, 'conc'); c.rect(px - 18, 120, 36, G - 14 - 120, 'wood'); }
      c.rect(px - 22, 98, 44, 22, 'wood');
    });
    c.label(90, G + 15, s.buried ? '기둥을 흙에 바로 묻음' : '독립기초 (콘크리트)');
    c.label(350, 170, s.post || '기둥 89×89');
    c.label(350, 109, s.beam || '멍에 89×89');
    c.rect(X + 20, 76, W - 40, 22, 'wood');
    c.label(250, 87, s.joist || '장선 38×140 @400~600');
    var bw = 26, gap = s.noGap ? 0 : 5;
    for (var bx = X + 22; bx + bw <= X + W - 20; bx += bw + gap) c.rect(bx, 60, bw, 16, s.board || 'wood');
    c.label(X + 70, 68, s.boardLabel || '데크재 (판 간격 3~5mm)');
    c.path('M' + (X + 90) + ' 56 v22 M' + (X + 300) + ' 56 v22', 'stroke="#555" stroke-width="2"');
    c.label(X + 300, 56, s.screw || '스테인리스 피스 (장선마다 2개)');
    c.text(X, 30, s.note || '');
    return c.svg();
  }

  // ---------- 5. 암거 (유공관) ----------
  function trench(s) {
    var c = new Canvas(320), X = 30, W = 400, G = 70;
    var st = s.stage && s.stage.st != null ? s.stage.st : 99;
    var tx = 150, tw = 150, ty = G + 60, th = 190;
    c.rect(X, G, W, 250, 'soil');
    if (st >= 4 && s.turf !== false) c.turfTop(X, G, W);
    if (st < 4) c.rect(tx, G, tw, ty - G, null, 'fill="#fdfcf8" stroke="#888" stroke-dasharray="3 3"');
    c.rect(tx, ty, tw, th - 10, st >= 3 ? 'crushed' : null, st >= 3 ? '' : 'fill="#fdfcf8"');
    if (st >= 1 && !s.noGeo) c.geotex(st >= 4 ? 'M' + tx + ' ' + ty + ' V' + (ty + th - 10) + ' H' + (tx + tw) + ' V' + ty + ' Z' : 'M' + (tx - 20) + ' ' + (ty - 10) + ' L' + tx + ' ' + ty + ' V' + (ty + th - 10) + ' H' + (tx + tw) + ' V' + ty + ' L' + (tx + tw + 20) + ' ' + (ty - 10));
    if (st >= 1) c.rect(tx, ty + th - 22, tw, 12, 'sand');
    if (st >= 2) {
      c.circle(tx + tw / 2, ty + th - 50, 26, '#fafafa');
      for (var a = 0; a < 8; a++) { var ang = a * Math.PI / 4; c.circle(tx + tw / 2 + Math.cos(ang) * 20, ty + th - 50 + Math.sin(ang) * 20, 1.8, '#333'); }
      c.label(tx + tw / 2, ty + th - 50, s.pipe || '유공관 Φ100~150');
    }
    if (st >= 3) c.label(tx + 20, ty + 40, s.fill || '배수 쇄석 13~25mm');
    if (st >= 1 && !s.noGeo) c.label(tx + tw, ty + 80, st >= 4 ? '부직포로 감싸기' : '부직포 깔기 (양옆 여유 남김)');
    if (st >= 1) c.label(tx + 30, ty + th - 16, '모래 기초');
    if (st >= 4) c.label(X + 30, G + 25, s.top || '표토·잔디');
    if (st === 0) c.label(tx + tw / 2, ty + 60, '터파기 (바닥 기울기 1% 이상)');
    c.text(tx, ty - 8 - (st < 4 ? 50 : 0), '폭 300~500 · 깊이 600~1,000 · 기울기 1% 이상');
    return c.svg();
  }

  // ---------- 6. 매설관 ----------
  function pipe(s) {
    var c = new Canvas(320), X = 30, W = 400, G = 50;
    if (s.surface === 'paving') {
      c.rect(X, G, W, 22, 'block'); c.rect(X, G + 22, W, 40, 'crushed');
      c.label(X + 40, G + 11, '포장'); c.label(X + 60, G + 42, '보조기층');
    } else { c.rect(X, G, W, 62, 'soil'); c.turfTop(X, G, W); c.label(X + 40, G + 30, '표토'); }
    c.rect(X, G + 62, W, 210, 'soil');
    var tx = 140, tw = 180, ty = G + 62;
    c.rect(tx, ty + 70, tw, 140, 'sand');
    if (s.tape !== false) { c.line(tx + 10, ty + 55, tx + tw - 10, ty + 55, 'stroke="#e3a400" stroke-width="4"'); c.label(tx + tw - 20, ty + 55, s.tapeLabel || '매설 경고 테이프'); }
    var pipes = s.pipes || [{ r: 32, n: s.pipeLabel || '관' }];
    var span = tw / (pipes.length + 1);
    pipes.forEach(function (p, i) {
      var cx = tx + span * (i + 1), cy = ty + 210 - 30 - p.r;
      c.circle(cx, cy, p.r, p.fill || '#f2f2f2', p.thick ? 'stroke-width="' + p.thick + '"' : '');
      if (p.inner) c.circle(cx, cy, p.r - p.inner, '#fff');
      c.label(cx, cy, p.n);
    });
    c.label(tx + 20, ty + 90, s.bed || '모래 (관 주변 채움·기초)');
    c.label(X + W - 30, ty + 30, '되메우기 흙 다짐');
    c.line(tx - 20, G, tx - 20, ty + 120, 'stroke="#c0392b" stroke-dasharray="3 2"');
    c.text(tx - 18 - 70, ty + 40, s.cover || '토피 600 이상', 'transform="rotate(-90 ' + (tx - 26) + ' ' + (ty + 40) + ')"');
    return c.svg();
  }

  // ---------- 7. 기둥·등주 ----------
  function pole(s) {
    var type = s.type || 'pole';
    var c = new Canvas(type === 'bollard' ? 300 : 360), X = 30, W = 400;
    if (s.stage && s.stage.y != null) c.clipY = s.stage.y;
    var G = type === 'bollard' ? 180 : 240;
    c.rect(X, G, W, 22, s.surfaceP || 'block');
    c.rect(X, G + 22, W, c.h - G - 22, 'soil');
    var fw = type === 'bollard' ? 110 : 150, fh = type === 'bollard' ? 70 : 100;
    var fx = 230 - fw / 2;
    c.rect(fx, G + 10, fw, fh, 'conc');
    c.label(fx + fw - 20, G + 10 + fh / 2, s.footing || '기초 콘크리트');
    c.line(220, G - 4, 220, G + fh - 10, 'stroke="#555" stroke-width="2.5"');
    c.line(240, G - 4, 240, G + fh - 10, 'stroke="#555" stroke-width="2.5"');
    c.label(240, G + fh - 25, '앵커볼트 매립');
    c.rect(205, G - 6, 50, 6, 'metal');
    c.label(255, G - 3, '베이스플레이트·너트');
    // 전선관
    c.path('M' + X + ' ' + (G + fh - 6) + ' H 205 Q 228 ' + (G + fh - 6) + ' 228 ' + (G + 30), 'fill="none" stroke="#1f4e8c" stroke-width="5"');
    if (s.conduit !== false) c.label(X + 50, G + fh - 6, s.conduitLabel || '전선관 (CD관·ELP)');
    var ph = type === 'bollard' ? 110 : 200, pw = type === 'bollard' ? 34 : 18;
    c.rect(230 - pw / 2, G - 6 - ph, pw, ph, s.poleP || 'metal');
    if (type === 'bollard') {
      c.rect(230 - pw / 2 - 2, G - 6 - ph, pw + 4, 26, 'metal');
      c.rect(230 - pw / 2 + 4, G - 6 - ph + 6, pw - 8, 12, null, 'fill="#ffe08a"');
      c.path('M212 ' + (G - ph + 8) + ' L170 ' + (G - 10) + ' M248 ' + (G - ph + 8) + ' L290 ' + (G - 10), 'stroke="#e0a100" stroke-dasharray="4 3" stroke-width="1.4" fill="none"');
      c.label(230, G - ph + 6, s.head || 'LED 등기구');
      c.label(230, G - 40, s.body || '볼라드 본체 (알루미늄)');
    } else if (type === 'pole') {
      c.path('M230 ' + (G - 6 - ph) + ' q0 -14 40 -14 h20', 'fill="none" stroke="#333" stroke-width="5"');
      c.rect(280, G - ph - 30, 50, 12, 'metal');
      c.path('M285 ' + (G - ph - 18) + ' L250 ' + (G - 40) + ' M325 ' + (G - ph - 18) + ' L370 ' + (G - 40), 'stroke="#e0a100" stroke-dasharray="4 3" stroke-width="1.4" fill="none"');
      c.label(305, G - ph - 24, s.head || '등기구 (LED)');
      c.label(230, G - 80, s.body || '폴 (아연도금 강관)');
      c.text(250, G - ph / 2, '높이 3~5m');
    } else {
      c.label(230, G - 60, s.body || '기둥');
    }
    c.label(X + 30, G + 11, s.surface || '포장');
    return c.svg();
  }

  // ---------- 8. 조경석 ----------
  function boulder(s) {
    var c = new Canvas(280), X = 30, W = 400, G = 150;
    c.rect(X, G, W, 100, 'soil');
    c.turfTop(X, G, 120); c.turfTop(330, G, 100);
    c.poly([[150, G + 70], [140, G + 10], [160, G - 50], [220, G - 80], [290, G - 60], [320, G - 10], [310, G + 70], [230, G + 82]], 'stone');
    c.line(140, G, 320, G, 'stroke="#333" stroke-dasharray="5 3"');
    c.rect(150, G + 70, 160, 14, 'crushed');
    c.label(230, G - 40, s.n || '조경석 (보는 면을 앞으로)');
    c.label(300, G + 40, '돌 높이 1/3 이상 묻기');
    c.label(230, G + 77, '하부 잡석·흙 채움 다짐 (공극 없게)');
    c.label(X + 60, G + 40, '주변 흙 되메우기 + 물다짐');
    return c.svg();
  }

  // ---------- 9. 수경 (연못·수조) ----------
  function pond(s) {
    var c = new Canvas(320), X = 30, W = 400, G = 90;
    if (s.variant === 'basin') {
      c.ground(X, 270, W, 40);
      c.rect(X, G, 60, 180, 'soil'); c.rect(X + W - 60, G, 60, 180, 'soil');
      c.poly([[90, G], [120, G], [120, 240], [340, 240], [340, G], [370, G], [370, 270], [90, 270]], 'conc');
      c.membrane('M120 ' + G + ' V240 H340 V' + G);
      c.rect(84, G - 14, 42, 14, 'stone'); c.rect(334, G - 14, 42, 14, 'stone');
      c.rect(121, G + 20, 218, 240 - G - 21, 'water', 'stroke="none"');
      c.line(122, G + 20, 338, G + 20, 'stroke="#2b6ca3" stroke-width="1.4"');
      c.label(110, 200, '철근콘크리트 수조');
      c.label(124, 150, s.coat || '도막방수 (우레탄 2~3mm)');
      c.label(100, G - 7, '마감 석재(갓돌)');
      c.label(200, G + 20, '계획 수위');
      // 펌프·노즐
      c.rect(170, 212, 40, 26, 'metal'); c.rect(166, 234, 48, 4, 'metal');
      c.label(190, 225, s.pump || '수중펌프 (받침대 위)');
      c.line(190, 212, 190, G + 8, 'stroke="#555" stroke-width="4"');
      c.path('M190 ' + (G + 8) + ' q-3 -30 0 -70 q3 -6 0 -4', 'stroke="#3d8bd0" stroke-width="2" fill="none"');
      c.label(190, G - 30, s.nozzle || '분수 노즐');
      // 오버플로
      c.line(340, G + 20, 400, G + 20, 'stroke="#1f4e8c" stroke-width="5"');
      c.label(380, G + 20, '오버플로관 (수위 높이)');
      c.line(300, 240, 300, 280, 'stroke="#1f4e8c" stroke-width="5"');
      c.label(300, 262, '바닥 배수 (청소용)');
      if (s.filter) c.label(170, 150, '→ 여과기·살균기로 순환');
      return c.svg();
    }
    var st = s.stage && s.stage.st != null ? s.stage.st : 99;
    c.rect(X, G, W, 220, 'soil');
    var P = function (d) { return [[80 + d * 1.3, G], [150 + d * 0.6, 250 - d], [310 - d * 0.6, 250 - d], [380 - d * 1.3, G]]; };
    var dPath = function (d) { return 'M' + P(d).map(function (q) { return q.join(' '); }).join(' L'); };
    c.poly(P(-14), st >= 1 && !s.noProtect ? 'sand' : null, st >= 1 && !s.noProtect ? '' : 'fill="#fdfcf8"');
    if (st >= 2) { c.membrane(dPath(-6)); if (!s.noProtect) c.geotex(dPath(-10)); }
    if (st >= 3) c.poly(P(0), 'gravel'); else if (st >= 1) c.poly(P(-6), null, 'fill="#fdfcf8" stroke="none"');
    if (st >= 4) { c.poly(P(14), 'water', 'stroke="none"'); c.line(70, G + 14, 390, G + 14, 'stroke="#2b6ca3" stroke-width="1.4"'); }
    // 가장자리 고정 트렌치
    if (st >= 2) { c.membrane('M64 ' + G + ' v20 h-14'); c.membrane('M396 ' + G + ' v20 h14'); }
    if (st >= 3) {
      c.poly([[40, G - 12], [86, G - 22], [104, G], [44, G + 6]], 'stone');
      c.poly([[372, G - 2], [392, G - 24], [430, G - 12], [430, G + 6]], 'stone');
    }
    if (st === 0) c.label(230, 200, '터파기 (돌·뿌리 제거)');
    if (st >= 1 && !s.noProtect) c.label(230, 255, '모래 50mm (바닥 고르기)');
    if (st >= 2) { c.label(330, 220, s.liner || '방수시트 (EPDM 1.0~1.2mm)'); if (!s.noProtect) c.label(300, 235, '보호 부직포 (상·하부)'); c.label(396, G + 18, '시트 끝 트렌치 고정'); }
    if (st >= 3) { c.label(260, 200, '자갈·흙 덮기'); c.label(60, G - 6, '가장자리 자연석 (시트 끝 덮기)'); }
    if (st >= 4) c.label(200, G + 50, '물');
    return c.svg();
  }

  // ---------- 10. 측구·트렌치 ----------
  function channel(s) {
    var c = new Canvas(280), X = 30, W = 400, G = 80;
    c.ground(X, 240, W, 40);
    [[X, 130], [330, 100]].forEach(function (a) {
      c.rect(a[0], G, a[1], 22, 'block'); c.rect(a[0], G + 22, a[1], 30, 'sand'); c.rect(a[0], G + 52, a[1], 108, 'crushed');
    });
    c.label(X + 40, G + 11, '포장'); c.label(X + 50, G + 80, '보조기층');
    c.rect(160, 205, 170, 35, 'conc');
    c.poly([[170, G], [190, G], [190, 185], [300, 185], [300, G], [320, G], [320, 205], [170, 205]], s.p || 'conc');
    c.rect(190, 160, 110, 25, 'water', 'stroke="none"');
    if (s.grating !== false) {
      c.rect(186, G, 118, 8, 'metal');
      for (var gx = 192; gx < 300; gx += 10) c.line(gx, G, gx, G + 8, 'stroke="#333"');
      c.label(245, G + 4, s.cover || '그레이팅 덮개');
    }
    c.label(178, 150, s.body || '측구 본체 (PC 콘크리트)');
    c.label(245, 222, '기초 콘크리트');
    c.label(245, 172, '물 흐름 (기울기 0.5% 이상)');
    return c.svg();
  }

  // ---------- 11. 집수정·저류조 ----------
  function box(s) {
    var c = new Canvas(320), X = 30, W = 400, G = 60;
    c.rect(X, G, W, 250, 'soil');
    if (s.variant === 'tank') {
      c.turfTop(X, G, W);
      c.rect(110, 130, 240, 140, null, 'fill="#eef3f8"');
      for (var gx = 110; gx < 350; gx += 40) for (var gy = 130; gy < 270; gy += 35) c.rect(gx, gy, 40, 35, null, 'fill="#dbe7f3" stroke="#6b8bb0"');
      c.membrane('M104 124 V276 H356 V124');
      c.geotex('M100 120 V280 H360 V120 Z');
      c.rect(100, 280, 260, 12, 'sand');
      c.line(X, 140, 110, 140, 'stroke="#1f4e8c" stroke-width="6"');
      c.line(350, 145, X + W, 145, 'stroke="#1f4e8c" stroke-width="6"');
      c.label(230, 200, 'PP 저류 모듈');
      c.label(356, 250, '방수시트');
      c.label(100, 230, '보호 부직포');
      c.label(X + 40, 140, '빗물 유입관 (초기우수 배제 후)');
      c.label(X + W - 30, 145, '오버플로 → 우수관');
      c.label(230, 290, '모래 기초');
      c.label(230, 95, '되메우기 흙 (상부 하중 검토)');
      return c.svg();
    }
    c.rect(X, G, W, 20, 'block');
    c.poly([[150, G], [170, G], [170, 250], [290, 250], [290, G], [310, G], [310, 270], [150, 270]], 'conc');
    c.rect(166, G - 4, 128, 8, 'metal');
    for (var x2 = 172; x2 < 292; x2 += 10) c.line(x2, G - 4, x2, G + 4);
    c.rect(170, 220, 120, 30, 'sand', 'stroke="none"');
    c.rect(170, 150, 120, 70, 'water', 'stroke="none"');
    c.line(X, 150, 170, 150, 'stroke="#1f4e8c" stroke-width="10"');
    c.line(290, 170, X + W, 170, 'stroke="#1f4e8c" stroke-width="12"');
    c.rect(140, 270, 180, 14, 'crushed');
    c.label(230, G, '덮개 (주철·스틸 그레이팅)');
    c.label(X + 40, 150, '유입관 (유공관·트렌치)');
    c.label(X + W - 30, 170, '유출관 → 우수관');
    c.label(230, 235, '침사 공간 (토사 가라앉음)');
    c.label(160, 120, '집수정 본체');
    c.label(230, 277, '기초 쇄석·콘크리트');
    return c.svg();
  }

  // ---------- 12. 지주목 ----------
  function stake(s) {
    var c = new Canvas(330), X = 30, W = 400, G = 250;
    c.rect(X, G, W, 80, 'soil');
    c.turfTop(X, G, W);
    c.path('M230 ' + G + ' C 160 ' + (G + 10) + ' 170 ' + (G + 70) + ' 230 ' + (G + 70) + ' C 290 ' + (G + 70) + ' 300 ' + (G + 10) + ' 230 ' + G, 'fill="#cdb48f" stroke="#6b4f2b"');
    c.rect(222, 30, 16, G - 30, null, 'fill="#8a6a46" stroke="#5a4127"');
    c.line(140, G + 50, 222, 110, 'stroke="#a0703c" stroke-width="8"');
    c.line(320, G + 50, 238, 110, 'stroke="#a0703c" stroke-width="8"');
    c.line(230, G + 55, 230, G + 55);
    c.rect(214, 100, 32, 18, null, 'fill="#e8dcc2" stroke="#7a6a4a"');
    c.line(150, 180, 310, 180, 'stroke="#a0703c" stroke-width="5"');
    c.label(230, 109, '결속 (완충재 감기)');
    c.label(175, 220, s.n || '지주목 (원주목 Φ60~80)');
    c.label(250, 180, '가로대');
    c.label(230, G + 40, '분(뿌리분)');
    c.label(140, G + 50, '600mm 이상 박기');
    return c.svg();
  }

  // ---------- 13. 스프링클러·급수전 ----------
  function sprinkler(s) {
    var c = new Canvas(310), X = 30, W = 400, G = 90;
    c.rect(X, G, W, 200, 'soil');
    c.turfTop(X, G, W);
    if (s.variant === 'hydrant') {
      c.rect(180, G - 4, 100, 70, 'block');
      c.rect(186, G + 2, 88, 58, null, 'fill="#f4f4f4"');
      c.rect(220, G + 20, 20, 40, 'metal');
      c.line(230, G + 60, 230, 240, 'stroke="#333" stroke-width="8"');
      c.rect(190, 210, 80, 50, 'gravel');
      c.line(X, 240, 230, 240, 'stroke="#222" stroke-width="10"');
      c.label(230, G + 30, s.head || '퀵커플러 밸브');
      c.label(180, G + 10, '살수전 박스(뚜껑)');
      c.label(230, 150, '입상관');
      c.label(260, 235, '퇴수용 자갈 (동파 방지)');
      c.label(X + 40, 240, 'PE 급수관');
      return c.svg();
    }
    c.rect(214, G - 2, 32, 70, 'metal');
    c.path('M230 ' + (G - 4) + ' Q 160 ' + (G - 70) + ' 70 ' + (G - 4) + ' M230 ' + (G - 4) + ' Q 300 ' + (G - 70) + ' 400 ' + (G - 4), 'stroke="#3d8bd0" stroke-dasharray="4 4" stroke-width="1.6" fill="none"');
    c.path('M230 ' + (G + 68) + ' v20 h40 v40 h-40 v30', 'stroke="#555" stroke-width="7" fill="none"');
    c.circle(230, 225, 16, '#2b2b2b');
    c.rect(200, 240, 60, 14, 'sand');
    c.label(230, G + 20, s.head || '팝업 헤드 (윗면 = 지면)');
    c.label(270, G + 108, '스윙조인트 (침하 대응)');
    c.label(230, 225, s.pipe || 'PE 관수관');
    c.label(230, 247, '모래');
    c.label(120, G - 45, '살수 반경 (헤드 간 간격 = 반경)');
    return c.svg();
  }

  // ---------- 14. 거푸집 ----------
  function formwork() {
    var c = new Canvas(300), X = 30, W = 400;
    c.ground(X, 250, W, 40);
    c.rect(150, 230, 160, 20, 'conc');
    c.rect(200, 40, 60, 190, 'conc');
    [184, 260].forEach(function (x) { c.rect(x, 30, 16, 200, 'wood'); });
    [70, 130, 190].forEach(function (y) {
      c.line(170, y, 290, y, 'stroke="#555" stroke-width="2.2"');
      c.rect(170, y - 12, 14, 24, 'wood'); c.rect(276, y - 12, 14, 24, 'wood');
    });
    c.line(130, 60, 170, 120, 'stroke="#a0703c" stroke-width="6"');
    c.label(192, 50, '거푸집 (코팅합판)');
    c.label(230, 100, '콘크리트');
    c.label(283, 130, '띠장 (각재)');
    c.label(230, 190, '폼타이·세파 (간격 유지)');
    c.label(150, 90, '버팀대');
    c.label(230, 240, '기초');
    return c.svg();
  }

  // ---------- 15. 기초 배근 ----------
  function footing(s) {
    var c = new Canvas(280), X = 30, W = 400;
    c.ground(X, 230, W, 40);
    c.rect(80, 218, 300, 12, 'conc');
    c.rect(90, 120, 280, 98, 'conc');
    c.line(105, 192, 355, 192, 'stroke="#8b1d1d" stroke-width="3"');
    c.line(105, 140, 355, 140, 'stroke="#8b1d1d" stroke-width="3"');
    for (var x = 115; x < 355; x += 30) { c.circle(x, 188, 3, '#8b1d1d'); c.circle(x, 144, 3, '#8b1d1d'); }
    [150, 300].forEach(function (x) { c.rect(x - 6, 196, 12, 22, null, 'fill="#bbb" stroke="#555"'); });
    c.label(300, 192, s.n || '철근 D13 @200 (하부)');
    c.label(200, 140, '상부 철근');
    c.label(150, 205, '스페이서 (사이코로)');
    c.label(105, 210, '피복두께 (가부리) 75');
    c.label(250, 224, '버림 콘크리트 t50');
    c.label(330, 247, '잡석·쇄석 다짐');
    return c.svg();
  }

  // ---------- 16. 라인조명 (벤치 하부) ----------
  function linearled() {
    var c = new Canvas(260), X = 30, W = 400;
    c.ground(X, 200, W, 40);
    c.rect(X, 180, W, 20, 'block');
    c.rect(120, 90, 200, 90, 'conc');
    c.rect(100, 70, 240, 24, s0('stone'));
    c.rect(124, 94, 20, 10, 'metal');
    c.rect(126, 104, 16, 4, null, 'fill="#ffe08a" stroke="#c99a00"');
    c.path('M134 108 L90 180 M134 108 L170 180', 'stroke="#e0a100" stroke-dasharray="4 3" stroke-width="1.4" fill="none"');
    c.label(110, 82, '벤치 상판 (돌출부)');
    c.label(134, 99, 'LED 라인바 (IP67, DC24V)');
    c.label(220, 140, '벤치 몸체');
    c.label(100, 170, '바닥을 비추는 간접광');
    c.label(330, 190, '포장');
    return c.svg();
    function s0(p) { return p; }
  }

  // ---------- 17. 벤치 ----------
  function bench(s) {
    var c = new Canvas(300), X = 30, W = 400, G = 220;
    if (s.stage && s.stage.y != null) c.clipY = s.stage.y;
    c.rect(X, G, W, 20, 'block'); c.rect(X, G + 20, W, 60, 'soil');
    [130, 330].forEach(function (x) {
      c.rect(x - 40, G + 4, 80, 50, 'conc');
      c.line(x - 10, G - 2, x - 10, G + 40, 'stroke="#555" stroke-width="2.5"');
      c.line(x + 10, G - 2, x + 10, G + 40, 'stroke="#555" stroke-width="2.5"');
      c.poly([[x - 26, G], [x + 26, G], [x + 18, 150], [x - 18, 150]], s.leg || 'metal');
      c.poly([[x + 10, 150], [x + 18, 150], [x + 40, 70], [x + 32, 68]], s.leg || 'metal');
    });
    for (var i = 0; i < 6; i++) c.rect(96 + i * 46, 136, 40, 14, 'wood');
    for (var j = 0; j < 3; j++) c.poly([[150 + j * 4, 120 - j * 22], [330 + j * 4, 120 - j * 22], [334 + j * 4, 106 - j * 22], [154 + j * 4, 106 - j * 22]], 'wood');
    c.label(200, 143, s.seat || '좌판 (목재·합성목재)');
    c.label(250, 92, '등받이 (각도 100~110°)');
    c.label(130, 180, s.legLabel || '프레임 (주철·스틸, 분체도장)');
    c.label(330, G + 30, '기초 콘크리트');
    c.label(320, G + 15, '앵커볼트 고정');
    c.label(X + 40, G + 10, '포장');
    c.text(40, 145, '좌판 높이 400~450');
    return c.svg();
  }

  // ---------- 18. 퍼걸러·정자 ----------
  function pergola(s) {
    var roof = s.variant === 'roof';
    var c = new Canvas(330), X = 30, W = 400, G = 270;
    if (s.stage && s.stage.y != null) c.clipY = s.stage.y;
    c.rect(X, G, W, 16, 'block'); c.rect(X, G + 16, W, 44, 'soil');
    [90, 370].forEach(function (x) {
      c.rect(x - 35, G + 2, 70, 50, 'conc');
      c.rect(x - 20, G - 4, 40, 6, 'metal');
      c.rect(x - 12, 110, 24, G - 114, s.postP || 'wood');
    });
    c.rect(50, 92, 360, 20, s.beamP || 'wood');
    if (roof) {
      c.poly([[30, 96], [230, 30], [430, 96]], 'stone');
      c.label(230, 60, s.roofLabel || '지붕 (기와·슁글·금속)');
    } else {
      for (var x = 60; x <= 395; x += 28) c.rect(x, 78, 12, 14, s.beamP || 'wood');
      c.label(150, 85, s.rafter || '살 (서까래) @300~600');
    }
    c.label(300, 102, s.beam || '보');
    c.label(370, 190, s.post || '기둥');
    c.label(90, G - 1, '기둥 받침 철물 (물에 잠기지 않게)');
    c.label(370, G + 30, '독립기초 + 앵커볼트');
    if (roof) c.text(200, 200, '마루 높이 450~600', 'fill="#666"');
    return c.svg();
  }

  var builders = { layers: layers, curb: curb, wall: wall, deck: deck, trench: trench, pipe: pipe, pole: pole, boulder: boulder,
    pond: pond, channel: channel, box: box, stake: stake, sprinkler: sprinkler, formwork: formwork, footing: footing, linearled: linearled, bench: bench, pergola: pergola };

  window.LM_SECTION = {
    render: function (spec) {
      var b = builders[spec.kind];
      if (!b) return '';
      CUR = spec;
      try { return b(spec); } catch (e) { console.error(e); return ''; } finally { CUR = null; }
    }
  };
})();
