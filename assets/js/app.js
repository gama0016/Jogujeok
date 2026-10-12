(function () {
  'use strict';

  var CATS = window.LM_CATEGORIES || [];
  var MATS = window.LM_MATERIALS || [];
  var GLOSSARY = window.LM_GLOSSARY || [];
  var catById = {};
  var matById = {};
  CATS.forEach(function (c) { catById[c.id] = c; });
  MATS.forEach(function (m) { matById[m.id] = m; });

  var app = document.getElementById('app');
  var sidebar = document.getElementById('sidebar');
  var search = document.getElementById('search');
  var query = '';

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function byKo(a, b) { return a.localeCompare(b, 'ko'); }
  function list(items, cls) {
    if (!items || !items.length) return '';
    return '<ul class="' + (cls || '') + '">' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
  }
  function haystack(m) {
    var parts = [m.name, m.en, m.sub, m.summary].concat(m.aka || []);
    (m.slang || []).forEach(function (s) { parts.push(s.t, s.m); });
    (m.uses || []).forEach(function (u) { parts.push(u); });
    var c = catById[m.cat]; if (c) parts.push(c.name);
    return norm(parts.join('|'));
  }
  // 초성 검색: "ㄷㄹㄲ" → 다루끼
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  function cho(s) {
    return String(s || '').replace(/[가-힣]/g, function (ch) { return CHO.charAt(Math.floor((ch.charCodeAt(0) - 0xAC00) / 588)); });
  }
  function isCho(w) { return /^[ㄱ-ㅎ]+$/.test(w); }
  function choHay(m) {
    var parts = [m.name].concat(m.aka || []);
    (m.slang || []).forEach(function (s) { parts.push(s.t); });
    return norm(cho(parts.join('|')));
  }
  MATS.forEach(function (m) { m._hay = haystack(m); m._cho = choHay(m); });

  function wordMatch(hay, choHayStr, w) {
    return isCho(w) ? choHayStr.indexOf(w) !== -1 : hay.indexOf(norm(w)) !== -1;
  }
  function textMatch(text, choSource, q) {
    var hay = norm(text), ch = norm(cho(choSource));
    return q.split(/\s+/).filter(Boolean).every(function (w) { return wordMatch(hay, ch, w); });
  }
  function matches(m, q) {
    if (!q) return true;
    return q.split(/\s+/).filter(Boolean).every(function (w) { return wordMatch(m._hay, m._cho, w); });
  }
  function score(m, q) {
    var n = norm(q);
    if (isCho(n)) {
      if (norm(cho(m.name)) === n) return 0;
      if ((m.slang || []).some(function (s) { return norm(cho(s.t)) === n; })) return 1;
      return norm(cho(m.name)).indexOf(n) !== -1 ? 2 : 3;
    }
    if (norm(m.name) === n) return 0;
    if ((m.slang || []).some(function (s) { return norm(s.t) === n; })) return 1;
    if (norm(m.name).indexOf(n) !== -1) return 2;
    if ((m.slang || []).some(function (s) { return norm(s.t).indexOf(n) !== -1; })) return 3;
    return 4;
  }

  function costHtml(n) {
    if (!n) return '';
    var labels = { 1: '저가', 2: '보통', 3: '고가' };
    var s = '';
    for (var i = 1; i <= 3; i++) s += i <= n ? '₩' : '<span class="off">₩</span>';
    return '<span class="cost" title="상대 가격대">' + s + '</span> ' + labels[n];
  }

  var PROCS = window.LM_PROCEDURES || {};
  var REFS = window.LM_REFS || { refs: {}, materials: {} };
  var PRICES = window.LM_PRICES || {};
  function priceHtml(p) {
    var meta = [p.spec, p.basis, p.year ? p.year + '년' : ''].filter(Boolean).join(' · ');
    var conf = { high: '신뢰 높음', medium: '신뢰 보통', low: '신뢰 낮음' }[p.confidence];
    return '<b>' + esc(p.price) + '</b> / ' + esc(p.unit) + (conf ? ' <span class="chip conf-' + esc(p.confidence) + '">' + conf + '</span>' : '') +
      (meta ? '<div class="price-meta">' + esc(meta) + (p.source ? ' · <a href="' + esc(p.source) + '" target="_blank" rel="noopener">출처</a>' : '') + '</div>' : '');
  }
  function refItem(k, tag) {
    var r = (REFS.refs || {})[k];
    if (!r) return '';
    return '<li>' + (tag ? '<span class="chip">' + esc(tag) + '</span> ' : '') +
      (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a>' : esc(r.title)) +
      (r.org ? ' <span class="dash">— ' + esc(r.org) + '</span>' : '') + '</li>';
  }

  function placeholder(m) {
    var c = catById[m.cat] || { color: '#888', name: '' };
    return '<div class="placeholder" style="background-color:' + c.color + '">' + esc(m.name.charAt(0)) +
      '<small>사진 준비중</small></div>';
  }

  // 사진: 재료의 photos 필드 → data/photos.js(인터넷 수집 사진) → images/{id}-N.jpg 자동 탐색 순
  var PHOTOS = window.LM_PHOTOS || {};
  function photoList(m, type) {
    var listed = (m.photos && m.photos.length) ? m.photos : PHOTOS[m.id];
    if (listed && listed.length) {
      return listed.filter(function (p) { return (p.type || 'material') === type; });
    }
    var out = [];
    for (var i = 1; i <= 3; i++) {
      out.push({ src: 'images/' + m.id + (type === 'site' ? '-site-' : '-') + i + '.jpg', caption: '', auto: true });
    }
    return out;
  }

  function card(m) {
    var c = catById[m.cat] || {};
    var first = PHOTOS[m.id] || (m.photos && m.photos.length) ? (photoList(m, 'material')[0] || photoList(m, 'site')[0]) : photoList(m, 'material')[0];
    var slang = (m.slang || []).slice(0, 3).map(function (s) { return '<span class="chip slang">' + esc(s.t) + '</span>'; }).join('');
    return '<a class="card" href="#/m/' + esc(m.id) + '">' +
      '<div class="thumb">' + placeholder(m) +
        (first ? '<img loading="lazy" alt="' + esc(m.name) + '" src="' + esc(first.src) + '" onerror="this.remove()" style="position:absolute;inset:0">' : '') +
      '</div>' +
      '<div class="card-body">' +
        '<div><span class="card-title">' + esc(m.name) + '</span> <span class="card-en">' + esc(m.en || '') + '</span></div>' +
        '<div class="chips"><span class="chip cat" style="background:' + c.color + '">' + esc(c.name || '') + '</span>' + slang + '</div>' +
        '<div class="card-sum">' + esc(m.summary || '') + '</div>' +
      '</div></a>';
  }

  // ---------- sidebar ----------
  function renderSidebar(activeCat) {
    var html = '<h2>분류</h2>' +
      '<a class="cat-link' + (!activeCat ? ' active' : '') + '" href="#/"><span class="cat-dot" style="background:var(--accent)"></span>전체<span class="cat-count">' + MATS.length + '</span></a>';
    CATS.forEach(function (c) {
      var n = MATS.filter(function (m) { return m.cat === c.id; }).length;
      html += '<a class="cat-link' + (activeCat === c.id ? ' active' : '') + '" href="#/cat/' + c.id + '">' +
        '<span class="cat-dot" style="background:' + c.color + '"></span>' + esc(c.name) +
        '<span class="cat-count">' + n + '</span></a>';
    });
    sidebar.innerHTML = html;
  }

  function setNav(name) {
    document.querySelectorAll('.topnav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === name);
    });
  }

  // ---------- views ----------
  function viewHome(catId) {
    renderSidebar(catId);
    setNav('home');
    var items = MATS.filter(function (m) { return (!catId || m.cat === catId) && matches(m, query); });
    if (query) items.sort(function (a, b) { return score(a, query) - score(b, query) || byKo(a.name, b.name); });

    var slangCount = MATS.reduce(function (n, m) { return n + (m.slang || []).length; }, 0);
    var html = '';
    if (!catId && !query) {
      html += '<section class="hero"><h1>조경재료 백과사전</h1>' +
        '<p>실제 조경 현장에서 자주 쓰는 재료·자재의 특성, 규격, 시공 단면도, 시공 방법, 그리고 현장에서 부르는 은어까지 정리했습니다. 식재(수목·초화류)는 다루지 않습니다.</p></section>' +
        '<div class="stats"><span class="stat">재료 <b>' + MATS.length + '</b></span>' +
        '<span class="stat">분류 <b>' + CATS.length + '</b></span>' +
        '<span class="stat">현장 은어 <b>' + (slangCount + GLOSSARY.length) + '</b></span>' +
        '<span class="stat">시공 단면도 <b>' + Object.keys(window.LM_SECTIONS || {}).filter(function (k) { return matById[k]; }).length + '</b></span>' +
        '<span class="stat">사진 <b>' + Object.keys(PHOTOS).reduce(function (n, k) { return n + PHOTOS[k].length; }, 0) + '</b></span></div>';
    }
    if (query) {
      html += '<div class="section-title"><h2>“' + esc(query) + '” 검색 결과</h2><span>' + items.length + '건</span></div>';
      html += items.length ? '<div class="grid">' + items.map(card).join('') + '</div>'
        : '<div class="empty">찾는 재료가 없습니다. 다른 이름이나 은어로 검색해 보세요.</div>';
    } else if (catId) {
      var c = catById[catId];
      html += '<div class="crumbs"><a href="#/">전체</a> › ' + esc(c.name) + '</div>' +
        '<div class="section-title"><h2>' + esc(c.name) + '</h2><span>' + esc(c.desc) + ' · ' + items.length + '종</span></div>' +
        '<div class="grid">' + items.map(card).join('') + '</div>';
    } else {
      CATS.forEach(function (c) {
        var group = items.filter(function (m) { return m.cat === c.id; });
        if (!group.length) return;
        html += '<div class="section-title"><h2><a href="#/cat/' + c.id + '" style="color:inherit">' + esc(c.name) + '</a></h2><span>' +
          esc(c.desc) + ' · ' + group.length + '종</span></div><div class="grid">' + group.map(card).join('') + '</div>';
      });
    }
    app.innerHTML = html;
  }

  function viewMaterial(id) {
    var m = matById[id];
    if (!m) { app.innerHTML = '<div class="empty">없는 항목입니다. <a href="#/">목록으로</a></div>'; return; }
    var c = catById[m.cat] || {};
    renderSidebar(m.cat);
    setNav('home');
    document.title = m.name + ' · 조경재료 백과사전';

    var html = '<div class="crumbs"><a href="#/">전체</a> › <a href="#/cat/' + c.id + '">' + esc(c.name) + '</a>' +
      (m.sub ? ' › ' + esc(m.sub) : '') + '</div>';
    html += '<div class="detail-head"><h1>' + esc(m.name) + '</h1><span class="en">' + esc(m.en || '') + '</span>' +
      '<div class="tools"><button class="btn" id="cmp-btn" type="button">비교에 추가</button>' +
      '<button class="btn" id="print-btn" type="button">인쇄·PDF</button></div></div>';
    if (m.aka && m.aka.length) html += '<div class="aka">다른 이름 · ' + m.aka.map(esc).join(', ') + '</div>';
    if (m.summary) html += '<p class="summary">' + esc(m.summary) + '</p>';

    if (m.slang && m.slang.length) {
      html += '<div class="slang-box"><h3>현장에서는 이렇게 불러요</h3><ul class="slang-list">' +
        m.slang.map(function (s) {
          return '<li><div><span class="slang-term">' + esc(s.t) + '</span>' +
            (s.o ? '<div class="slang-origin">' + esc(s.o) + '</div>' : '') + '</div><div>' + esc(s.m || '') + '</div></li>';
        }).join('') + '</ul></div>';
    }

    html += '<div class="gallery-wrap" id="g-material"><div class="section-title"><h2>재료 사진</h2></div><div class="gallery"></div></div>';

    html += '<div class="sections">';
    if (m.props && m.props.length) {
      html += '<div class="panel"><h3>재료 특성</h3><table class="props">' +
        m.props.map(function (p) { return '<tr><th>' + esc(p[0]) + '</th><td>' + esc(p[1]) + '</td></tr>'; }).join('') +
        (m.cost ? '<tr><th>상대 가격대</th><td>' + costHtml(m.cost) + '</td></tr>' : '') +
        (PRICES[m.id] ? '<tr><th>참고 단가</th><td>' + priceHtml(PRICES[m.id]) + '</td></tr>' : '') + '</table></div>';
    }
    if (m.specs && m.specs.length) html += '<div class="panel"><h3>대표 규격</h3>' + list(m.specs) + '</div>';
    if (m.pros && m.pros.length) html += '<div class="panel"><h3>장점</h3>' + list(m.pros, 'pros') + '</div>';
    if (m.cons && m.cons.length) html += '<div class="panel"><h3>단점</h3>' + list(m.cons, 'cons') + '</div>';
    if (m.uses && m.uses.length) html += '<div class="panel wide"><h3>주요 용도</h3><div class="chips">' +
      m.uses.map(function (u) { return '<span class="chip">' + esc(u) + '</span>'; }).join('') + '</div></div>';
    if (m.steps && m.steps.length) html += '<div class="panel wide"><h3>시공 방법</h3><ol class="steps">' +
      m.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>';
    if (m.cautions && m.cautions.length) html += '<div class="panel"><h3>시공 시 주의</h3>' + list(m.cautions) + '</div>';
    if (m.care && m.care.length) html += '<div class="panel"><h3>유지관리</h3>' + list(m.care) + '</div>';
    html += '</div>';

    var sec = (window.LM_SECTIONS || {})[m.id];
    var svg = sec && window.LM_SECTION ? window.LM_SECTION.render(sec) : '';
    var proc = PROCS[m.id];
    if (svg) {
      html += '<div class="section-wrap"><div class="section-title"><h2>시공 단면도</h2><span>' + esc(sec.title || '') + '</span></div>' +
        '<div class="section-figure">' +
        (proc ? '<div class="sec-tabs"><button type="button" class="tab active" data-sec="full">완성 단면</button>' +
          '<button type="button" class="tab" data-sec="steps">시공 순서 (' + proc.length + '단계)</button></div>' : '') +
        '<div class="section-scroll" id="sec-svg">' + svg + '</div>' +
        (proc ? '<div class="sec-stepper" id="sec-stepper" hidden><button type="button" class="btn" id="sec-prev">◀ 이전</button>' +
          '<div class="sec-cap"><b id="sec-num"></b> <span id="sec-text"></span><div class="sec-dots" id="sec-dots"></div></div>' +
          '<button type="button" class="btn" id="sec-next">다음 ▶</button></div>' : '') +
        '<p class="section-note">개념 단면도(축척 없음) · 두께 단위 mm · 수치는 대표 예시이며 실제 설계는 표준시방서·설계도를 따릅니다.' +
        (proc ? ' 시공 순서에서 흐리게 보이는 부분은 아직 시공 전입니다.' : '') + '</p></div></div>';
    }

    var refKeys = (REFS.materials || {})[m.id] || [];
    if (refKeys.length || (m.slang && m.slang.length && (REFS.slangRefs || []).length)) {
      html += '<div class="panel refs-panel"><h3>근거 자료</h3><ul class="refs">' +
        refKeys.map(function (k) { return refItem(k); }).join('') +
        (m.slang && m.slang.length ? (REFS.slangRefs || []).map(function (k) { return refItem(k, '은어·순화어'); }).join('') : '') +
        '</ul><p class="note"><a href="#/refs">전체 참고문헌 보기</a></p></div>';
    }

    html += '<div class="gallery-wrap" id="g-site" style="margin-top:28px"><div class="section-title"><h2>시공 사례</h2></div><div class="gallery"></div></div>';

    var rel = (m.related || []).map(function (r) { return matById[r]; }).filter(Boolean);
    if (rel.length) {
      html += '<div class="related"><div class="section-title"><h2>관련 재료</h2></div><div class="grid">' + rel.map(card).join('') + '</div></div>';
    }

    var siblings = MATS.filter(function (x) { return x.cat === m.cat; });
    var idx = siblings.indexOf(m);
    var prev = siblings[idx - 1], next = siblings[idx + 1];
    html += '<div class="pager">' + (prev ? '<a href="#/m/' + prev.id + '">← ' + esc(prev.name) + '</a>' : '<span></span>') +
      (next ? '<a href="#/m/' + next.id + '">' + esc(next.name) + ' →</a>' : '<span></span>') + '</div>';

    app.innerHTML = html;
    document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
    document.getElementById('cmp-btn').addEventListener('click', function () {
      var ids = loadCompare().filter(function (x) { return x !== m.id; });
      ids.push(m.id);
      location.hash = '#/compare/' + ids.slice(-4).join(',');
    });
    if (proc && svg) bindStepper(sec, proc);
    fillGallery(document.querySelector('#g-material .gallery'), photoList(m, 'material'), m, 'material');
    fillGallery(document.querySelector('#g-site .gallery'), photoList(m, 'site'), m, 'site');
  }

  function bindStepper(sec, proc) {
    var box = document.getElementById('sec-svg'), stepper = document.getElementById('sec-stepper');
    var i = 0, mode = 'full';
    var dots = document.getElementById('sec-dots');
    dots.innerHTML = proc.map(function (_, k) { return '<button type="button" data-k="' + k + '" aria-label="' + (k + 1) + '단계"></button>'; }).join('');
    function draw() {
      if (mode === 'full') { box.innerHTML = window.LM_SECTION.render(sec); stepper.hidden = true; return; }
      stepper.hidden = false;
      box.innerHTML = window.LM_SECTION.render(Object.assign({}, sec, { stage: proc[i] }));
      document.getElementById('sec-num').textContent = (i + 1) + ' / ' + proc.length;
      document.getElementById('sec-text').textContent = proc[i].t;
      document.getElementById('sec-prev').disabled = i === 0;
      document.getElementById('sec-next').disabled = i === proc.length - 1;
      dots.querySelectorAll('button').forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    app.querySelectorAll('[data-sec]').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-sec');
        app.querySelectorAll('[data-sec]').forEach(function (x) { x.classList.toggle('active', x === b); });
        i = 0; draw();
      });
    });
    document.getElementById('sec-prev').addEventListener('click', function () { if (i > 0) { i--; draw(); } });
    document.getElementById('sec-next').addEventListener('click', function () { if (i < proc.length - 1) { i++; draw(); } });
    dots.addEventListener('click', function (e) { var k = e.target.getAttribute('data-k'); if (k != null) { i = +k; draw(); } });
  }

  function fillGallery(el, photos, m, type) {
    var pending = photos.length, shown = 0;
    function done() {
      if (--pending > 0 || shown) return;
      var name = type === 'site' ? m.id + '-site-1.jpg' : m.id + '-1.jpg';
      el.innerHTML = '<div class="photo-slot">' + (type === 'site' ? '시공 사례 사진' : '재료 사진') +
        '이 아직 없습니다. <code>images/' + esc(name) + '</code> 처럼 파일을 넣으면 자동으로 표시됩니다 (최대 3장, -1·-2·-3).</div>';
    }
    if (!pending) { pending = 1; done(); return; }
    photos.forEach(function (p) {
      var img = new Image();
      img.onload = function () {
        shown++;
        var fig = document.createElement('figure');
        fig.appendChild(img);
        img.alt = p.caption || m.name;
        var credit = creditText(p);
        if (p.caption || credit) {
          var cap = document.createElement('figcaption');
          cap.innerHTML = esc(p.caption || '') + (credit ? '<span class="credit">' + creditHtml(p) + '</span>' : '');
          cap.addEventListener('click', function (e) { e.stopPropagation(); });
          fig.appendChild(cap);
        }
        img.addEventListener('click', function () { openLightbox(p.src, (p.caption || '') + (credit ? ' — ' + credit : '')); });
        el.appendChild(fig);
        done();
      };
      img.onerror = done;
      img.src = p.src;
    });
  }

  // ---------- 사진 출처 ----------
  function creditText(p) {
    if (p.credit) return p.credit;
    if (!p.artist && !p.license) return '';
    return (p.artist || '작자 미상') + (p.license ? ' / ' + p.license : '') + ' (Wikimedia Commons)';
  }
  function creditHtml(p) {
    var t = esc(creditText(p));
    return p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + t + '</a>' : t;
  }

  // ---------- 비교표 ----------
  var CMP_KEY = 'lm-compare';
  function loadCompare() {
    try { return JSON.parse(localStorage.getItem(CMP_KEY) || '[]').filter(function (id) { return matById[id]; }); }
    catch (e) { return []; }
  }
  function saveCompare(ids) {
    try { localStorage.setItem(CMP_KEY, JSON.stringify(ids)); } catch (e) { /* 저장 불가 환경 */ }
  }

  function viewCompare(param) {
    renderSidebar(null);
    setNav('compare');
    document.title = '재료 비교표 · 조경재료 백과사전';
    var ids = param ? param.split(',').map(decodeURIComponent).filter(function (id) { return matById[id]; }) : loadCompare();
    ids = ids.filter(function (id, i) { return ids.indexOf(id) === i; }).slice(0, 4);
    saveCompare(ids);
    var mats = ids.map(function (id) { return matById[id]; });
    var presets = window.LM_COMPARE_PRESETS || [];

    var html = '<section class="hero"><h1>재료 비교표</h1><p>재료를 최대 4개까지 골라 특성·규격·장단점·가격대를 나란히 비교합니다. 재료 페이지의 <b>비교에 추가</b> 버튼으로도 담을 수 있습니다.</p></section>';
    html += '<div class="preset-row"><span class="preset-label">추천 비교</span>' + presets.map(function (p) {
      return '<a class="chip preset" href="#/compare/' + p.ids.join(',') + '">' + esc(p.name) + '</a>';
    }).join('') + '</div>';

    var opts = '<option value="">+ 재료 추가</option>' + CATS.map(function (c) {
      var g = MATS.filter(function (m) { return m.cat === c.id && ids.indexOf(m.id) === -1; });
      return g.length ? '<optgroup label="' + esc(c.name) + '">' + g.map(function (m) {
        return '<option value="' + m.id + '">' + esc(m.name) + '</option>';
      }).join('') + '</optgroup>' : '';
    }).join('');
    html += '<div class="cmp-picker">' + mats.map(function (m) {
      return '<span class="chip cmp-chip">' + esc(m.name) + ' <button type="button" data-rm="' + m.id + '" aria-label="' + esc(m.name) + ' 빼기">×</button></span>';
    }).join('') + (ids.length < 4 ? '<select id="cmp-add" aria-label="비교할 재료 추가">' + opts + '</select>' : '') +
      (ids.length ? '<button class="btn" type="button" id="cmp-clear">모두 지우기</button>' : '') + '</div>';

    if (mats.length < 2) {
      html += '<div class="empty">비교할 재료를 2개 이상 고르거나, 위의 추천 비교를 눌러 보세요.</div>';
      app.innerHTML = html;
      bindCompare(ids);
      return;
    }

    function row(label, fn, cls) {
      return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th scope="row">' + esc(label) + '</th>' +
        mats.map(function (m) { return '<td>' + fn(m) + '</td>'; }).join('') + '</tr>';
    }
    function ul(a) { return a && a.length ? '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<span class="dash">—</span>'; }
    // 두 재료 이상이 같은 항목을 가지면 한 줄로 나란히, 나머지는 '기타 특성'으로 묶는다
    var labelCount = {}, propLabels = [];
    mats.forEach(function (m) { (m.props || []).forEach(function (p) {
      if (!labelCount[p[0]]) { labelCount[p[0]] = 0; propLabels.push(p[0]); }
      labelCount[p[0]]++;
    }); });
    var shared = propLabels.filter(function (l) { return labelCount[l] > 1; });

    var t = '<div class="table-wrap cmp-wrap"><table class="gtable cmp-table"><thead><tr><th></th>' +
      mats.map(function (m) {
        var c = catById[m.cat] || {};
        var ph = photoList(m, 'material')[0] || photoList(m, 'site')[0];
        return '<th scope="col"><a class="cmp-head" href="#/m/' + m.id + '"><div class="cmp-thumb">' + placeholder(m) +
          (ph ? '<img src="' + esc(ph.src) + '" alt="" onerror="this.remove()">' : '') + '</div>' +
          '<b>' + esc(m.name) + '</b><span>' + esc(m.en || '') + '</span></a>' +
          '<span class="chip cat" style="background:' + c.color + '">' + esc(c.name || '') + '</span></th>';
      }).join('') + '</tr></thead><tbody>';
    t += row('현장 은어', function (m) {
      return (m.slang || []).length ? '<div class="chips">' + m.slang.map(function (s) { return '<span class="chip slang">' + esc(s.t) + '</span>'; }).join('') + '</div>' : '<span class="dash">—</span>';
    });
    t += row('요약', function (m) { return esc(m.summary || ''); });
    t += row('상대 가격대', function (m) { return m.cost ? costHtml(m.cost) : '<span class="dash">—</span>'; }, 'hl');
    if (mats.some(function (m) { return PRICES[m.id]; })) {
      t += row('참고 단가', function (m) { return PRICES[m.id] ? priceHtml(PRICES[m.id]) : '<span class="dash">—</span>'; });
    }
    shared.forEach(function (lbl) {
      t += row(lbl, function (m) {
        var p = (m.props || []).filter(function (x) { return x[0] === lbl; })[0];
        return p ? esc(p[1]) : '<span class="dash">—</span>';
      });
    });
    t += row(shared.length ? '기타 특성' : '재료 특성', function (m) {
      var own = (m.props || []).filter(function (x) { return shared.indexOf(x[0]) === -1; });
      return own.length ? '<ul>' + own.map(function (x) { return '<li><span class="dash">' + esc(x[0]) + '</span> ' + esc(x[1]) + '</li>'; }).join('') + '</ul>' : '<span class="dash">—</span>';
    });
    t += row('대표 규격', function (m) { return ul(m.specs); });
    t += row('장점', function (m) { return ul(m.pros); }, 'pros-row');
    t += row('단점', function (m) { return ul(m.cons); }, 'cons-row');
    t += row('주요 용도', function (m) { return ul(m.uses); });
    t += row('유지관리', function (m) { return ul(m.care); });
    t += '</tbody></table></div>';
    html += t + '<p class="note">※ 가격대는 같은 용도 재료 사이의 상대적인 수준입니다. 참고 단가는 공개된 쇼핑몰·조달·기사 자료(대부분 부가세 별도, 자재비 기준)를 모은 참고값이며, 실제 단가는 물량·지역·시기·규격에 따라 크게 다릅니다.</p>';
    app.innerHTML = html;
    bindCompare(ids);
  }

  function bindCompare(ids) {
    app.querySelectorAll('[data-rm]').forEach(function (b) {
      b.addEventListener('click', function () {
        var rest = ids.filter(function (x) { return x !== b.getAttribute('data-rm'); });
        saveCompare(rest);
        location.hash = '#/compare/' + rest.join(',');
      });
    });
    var sel = document.getElementById('cmp-add');
    if (sel) sel.addEventListener('change', function () {
      if (sel.value) location.hash = '#/compare/' + ids.concat(sel.value).join(',');
    });
    var clr = document.getElementById('cmp-clear');
    if (clr) clr.addEventListener('click', function () { saveCompare([]); location.hash = '#/compare/'; });
  }

  // ---------- 재료 선정 가이드 ----------
  var GUIDE = window.LM_GUIDE || [];
  function viewGuide(id) {
    renderSidebar(null);
    setNav('guide');
    var g = GUIDE.filter(function (x) { return x.id === id; })[0];
    if (!g) {
      document.title = '재료 선정 가이드 · 조경재료 백과사전';
      app.innerHTML = '<section class="hero"><h1>재료 선정 가이드</h1><p>상황을 고르면 조건별로 어떤 재료를 쓰면 좋을지 후보와 이유를 보여줍니다. 후보는 바로 비교표로 넘겨 비교할 수 있습니다.</p></section>' +
        '<div class="guide-grid">' + GUIDE.map(function (x) {
          var mats = [];
          x.options.forEach(function (o) { o.picks.forEach(function (p) { if (mats.indexOf(p) === -1 && matById[p]) mats.push(p); }); });
          return '<a class="guide-card" href="#/guide/' + x.id + '"><b>' + esc(x.title) + '</b><span class="guide-q">“' + esc(x.q) + '”</span>' +
            '<span class="guide-meta">' + x.options.length + '가지 상황 · 후보 ' + mats.length + '종</span></a>';
        }).join('') + '</div>';
      return;
    }
    document.title = g.title + ' · 재료 선정 가이드';
    var html = '<div class="crumbs"><a href="#/guide">재료 선정 가이드</a> › ' + esc(g.title) + '</div>' +
      '<section class="hero"><h1>' + esc(g.title) + '</h1><p>“' + esc(g.q) + '”</p></section>';
    if (g.consider && g.consider.length) html += '<div class="panel consider"><h3>먼저 따져볼 것</h3>' + list(g.consider) + '</div>';
    g.options.forEach(function (o, i) {
      var picks = o.picks.map(function (p) { return matById[p]; }).filter(Boolean);
      html += '<section class="guide-option"><div class="guide-opt-head"><span class="guide-num">' + (i + 1) + '</span><h2>' + esc(o.label) + '</h2>' +
        (picks.length > 1 ? '<a class="btn" href="#/compare/' + picks.slice(0, 4).map(function (m) { return m.id; }).join(',') + '">이 후보 비교하기</a>' : '') + '</div>' +
        '<p class="guide-why">' + esc(o.why) + '</p><div class="grid">' + picks.map(card).join('') + '</div></section>';
    });
    if (g.related) html += '<p class="note">함께 보면 좋은 재료: ' + g.related.map(function (r) { return matById[r] ? '<a href="#/m/' + r + '">' + esc(matById[r].name) + '</a>' : ''; }).join(', ') + '</p>';
    html += '<p class="note">※ 가이드는 일반적인 선택 기준입니다. 실제 설계는 현장 조건·법규·예산을 함께 검토하세요.</p>';
    app.innerHTML = html;
  }

  // ---------- 참고문헌 ----------
  function viewRefs() {
    renderSidebar(null);
    setNav('about');
    document.title = '참고문헌 · 조경재료 백과사전';
    var refs = REFS.refs || {}, keys = Object.keys(refs);
    var used = {};
    Object.keys(REFS.materials || {}).forEach(function (id) {
      (REFS.materials[id] || []).forEach(function (k) { (used[k] = used[k] || []).push(id); });
    });
    var types = {};
    keys.forEach(function (k) { var t = refs[k].type || '기타'; (types[t] = types[t] || []).push(k); });
    var html = '<section class="hero"><h1>참고문헌</h1><p>재료별 설명의 근거가 되는 국가건설기준(KCS), 한국산업표준(KS), 법령·지침, 국립국어원 자료입니다. 각 재료 페이지 아래 “근거 자료”에도 연결되어 있습니다.</p></section>';
    if (!keys.length) html += '<div class="empty">참고문헌을 정리하는 중입니다.</div>';
    Object.keys(types).sort().forEach(function (t) {
      html += '<div class="section-title"><h2>' + esc(t) + '</h2><span>' + types[t].length + '건</span></div><ol class="ref-list">' +
        types[t].sort(function (a, b) { return byKo(refs[a].title, refs[b].title); }).map(function (k) {
          var r = refs[k], ms = (used[k] || []).map(function (id) { return matById[id]; }).filter(Boolean);
          return '<li><div>' + (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a>' : esc(r.title)) +
            (r.org ? ' <span class="dash">— ' + esc(r.org) + '</span>' : '') + '</div>' +
            (r.note ? '<div class="note">' + esc(r.note) + '</div>' : '') +
            (ms.length ? '<div class="chips">' + ms.map(function (m) { return '<a class="chip" href="#/m/' + m.id + '">' + esc(m.name) + '</a>'; }).join('') + '</div>' : '') + '</li>';
        }).join('') + '</ol>';
    });
    app.innerHTML = html + creditsSection();
  }

  // ---------- 전체 PDF (인쇄용 책자) ----------
  function viewBook() {
    renderSidebar(null);
    setNav('book');
    document.title = '조경재료 백과사전 (전체본)';
    var html = '<div class="book-tools"><div><h1>전체 PDF 만들기</h1><p>모든 재료를 표지·목차와 함께 한 문서로 모았습니다. <b>인쇄 → 대상: PDF로 저장</b>을 고르고, 설정에서 <b>배경 그래픽</b>을 켜면 단면도 색이 그대로 나옵니다.</p>' +
      '<label><input type="checkbox" id="bk-photo" checked> 사진 포함</label> <label><input type="checkbox" id="bk-sec" checked> 단면도 포함</label></div>' +
      '<button class="btn primary" type="button" id="bk-print">인쇄 · PDF로 저장</button></div>';
    html += '<div class="book" id="book">';
    html += '<section class="book-cover"><div class="cover-mark">조</div><h1>조경재료 백과사전</h1><p class="cover-sub">현장에서 쓰는 재료·자재의 특성, 규격, 시공 단면, 현장 은어</p>' +
      '<div class="cover-fields"><div><span>과목</span><b contenteditable="true">과목명을 입력하세요</b></div>' +
      '<div><span>학번 · 이름</span><b contenteditable="true">학번 · 이름</b></div>' +
      '<div><span>제출일</span><b contenteditable="true">' + new Date().toISOString().slice(0, 10) + '</b></div></div>' +
      '<p class="cover-note">재료 ' + MATS.length + '종 · 분류 ' + CATS.length + '개 · 표시된 글자(과목·이름)는 눌러서 고칠 수 있습니다.</p></section>';
    html += '<section class="book-toc"><h2>목차</h2>' + CATS.map(function (c) {
      var ms = MATS.filter(function (m) { return m.cat === c.id; });
      if (!ms.length) return '';
      return '<div class="toc-cat"><h3><span class="cat-dot" style="background:' + c.color + '"></span>' + esc(c.name) + '</h3><ol>' +
        ms.map(function (m) { return '<li><a href="#bk-' + m.id + '" data-jump="bk-' + m.id + '">' + esc(m.name) + '</a> <span class="dash">' + esc(m.en || '') + '</span></li>'; }).join('') + '</ol></div>';
    }).join('') + '</section>';
    CATS.forEach(function (c) {
      MATS.filter(function (m) { return m.cat === c.id; }).forEach(function (m) { html += bookEntry(m, c); });
    });
    html += '<section class="book-entry">' + glossaryBook() + '</section>';
    html += '</div>';
    app.innerHTML = html;
    var book = document.getElementById('book');
    document.getElementById('bk-print').addEventListener('click', function () { window.print(); });
    document.getElementById('bk-photo').addEventListener('change', function (e) { book.classList.toggle('no-photo', !e.target.checked); });
    document.getElementById('bk-sec').addEventListener('change', function (e) { book.classList.toggle('no-sec', !e.target.checked); });
    book.addEventListener('click', function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-jump');
      if (id) { e.preventDefault(); var el = document.getElementById(id); if (el) el.scrollIntoView(); }
    });
  }

  function bookEntry(m, c) {
    var ph = (PHOTOS[m.id] || []).filter(function (p) { return p.type !== 'site'; })[0] || (PHOTOS[m.id] || [])[0];
    var sec = (window.LM_SECTIONS || {})[m.id];
    var svg = sec ? window.LM_SECTION.render(sec) : '';
    var refKeys = (REFS.materials || {})[m.id] || [];
    var h = '<section class="book-entry" id="bk-' + m.id + '">' +
      '<div class="be-head"><span class="chip cat" style="background:' + c.color + '">' + esc(c.name) + '</span><h2>' + esc(m.name) + ' <small>' + esc(m.en || '') + '</small></h2>' +
      (m.aka && m.aka.length ? '<div class="aka">다른 이름 · ' + m.aka.map(esc).join(', ') + '</div>' : '') + '</div>' +
      '<div class="be-top">' + (ph ? '<figure class="be-photo"><img src="' + esc(ph.src) + '" alt=""><figcaption>' + esc(ph.caption || '') + ' · ' + esc(creditText(ph)) + '</figcaption></figure>' : '') +
      '<div><p class="summary">' + esc(m.summary || '') + '</p>' +
      (m.slang && m.slang.length ? '<div class="be-slang"><b>현장 은어</b> ' + m.slang.map(function (s) { return '<span><em>' + esc(s.t) + '</em> ' + esc(s.m || '') + '</span>'; }).join('') + '</div>' : '') +
      '</div></div><div class="be-grid">' +
      (m.props && m.props.length ? '<div><h4>재료 특성</h4><table class="props">' + m.props.map(function (p) { return '<tr><th>' + esc(p[0]) + '</th><td>' + esc(p[1]) + '</td></tr>'; }).join('') +
        (m.cost ? '<tr><th>상대 가격대</th><td>' + costHtml(m.cost) + '</td></tr>' : '') +
        (PRICES[m.id] ? '<tr><th>참고 단가</th><td>' + esc(PRICES[m.id].price + ' / ' + PRICES[m.id].unit) + '</td></tr>' : '') + '</table></div>' : '') +
      (m.specs && m.specs.length ? '<div><h4>대표 규격</h4>' + list(m.specs) + '</div>' : '') +
      (m.pros && m.pros.length ? '<div><h4>장점</h4>' + list(m.pros, 'pros') + '</div>' : '') +
      (m.cons && m.cons.length ? '<div><h4>단점</h4>' + list(m.cons, 'cons') + '</div>' : '') + '</div>' +
      (m.steps && m.steps.length ? '<h4>시공 방법</h4><ol class="steps">' + m.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '') +
      (svg ? '<div class="be-sec"><h4>시공 단면도 — ' + esc(sec.title || '') + '</h4>' + svg + '</div>' : '') +
      '<div class="be-grid">' + (m.cautions && m.cautions.length ? '<div><h4>시공 시 주의</h4>' + list(m.cautions) + '</div>' : '') +
      (m.care && m.care.length ? '<div><h4>유지관리</h4>' + list(m.care) + '</div>' : '') + '</div>' +
      (refKeys.length ? '<div class="be-refs"><h4>근거 자료</h4><ul class="refs">' + refKeys.map(function (k) { return refItem(k); }).join('') + '</ul></div>' : '') +
      '</section>';
    return h;
  }

  function glossaryBook() {
    var gl = GLOSSARY.slice().sort(function (a, b) { return byKo(a.t, b.t); });
    return '<h2>부록 · 공정·작업 은어</h2><table class="gtable"><thead><tr><th>은어</th><th>어원</th><th>바른 말</th><th>뜻</th></tr></thead><tbody>' +
      gl.map(function (r) { return '<tr><td class="term">' + esc(r.t) + '</td><td>' + esc(r.o || '') + '</td><td>' + esc(r.s || '') + '</td><td>' + esc(r.m || '') + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }

  function viewSlang() {
    renderSidebar(null);
    setNav('slang');
    document.title = '현장 은어 · 조경재료 백과사전';
    var mat = [];
    MATS.forEach(function (m) {
      (m.slang || []).forEach(function (s) { mat.push({ t: s.t, o: s.o, m: s.m, mat: m }); });
    });
    mat.sort(function (a, b) { return byKo(a.t, b.t); });
    var gl = GLOSSARY.slice().sort(function (a, b) { return byKo(a.t, b.t); });

    app.innerHTML = '<section class="hero"><h1>현장 은어 사전</h1>' +
      '<p>조경·건설 현장에서 실제로 오가는 말을 모았습니다. 일본어에서 온 말이 많아 국립국어원 순화어(바른 말)를 함께 적었습니다. 보고서·도면에는 바른 말을 쓰는 것이 원칙입니다.</p></section>' +
      '<div class="tabs"><button class="tab active" data-tab="mat" type="button">재료 은어 (' + mat.length + ')</button>' +
      '<button class="tab" data-tab="work" type="button">공정·작업 은어 (' + gl.length + ')</button></div>' +
      '<div id="tab-mat" class="table-wrap"><table class="gtable"><thead><tr><th>은어</th><th>어원</th><th>뜻</th><th>재료</th></tr></thead><tbody>' +
        mat.filter(function (r) { return !query || textMatch(r.t + '|' + r.m + '|' + r.mat.name, r.t + '|' + r.mat.name, query); }).map(function (r) {
          return '<tr><td class="term">' + esc(r.t) + '</td><td>' + esc(r.o || '') + '</td><td>' + esc(r.m || '') + '</td>' +
            '<td><a href="#/m/' + r.mat.id + '">' + esc(r.mat.name) + '</a></td></tr>';
        }).join('') + '</tbody></table></div>' +
      '<div id="tab-work" class="table-wrap" hidden><table class="gtable"><thead><tr><th>은어</th><th>어원</th><th>바른 말</th><th>뜻</th></tr></thead><tbody>' +
        gl.filter(function (r) { return !query || textMatch(r.t + '|' + r.m + '|' + r.s, r.t + '|' + r.s, query); }).map(function (r) {
          return '<tr><td class="term">' + esc(r.t) + '</td><td>' + esc(r.o || '') + '</td><td>' + esc(r.s || '') + '</td><td>' + esc(r.m || '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
      '<p class="note">※ 은어의 뜻과 치수는 지역·업체마다 조금씩 다를 수 있습니다. 발주·도면에는 표준 명칭과 mm 치수를 쓰세요.</p>';

    app.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () {
        app.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === b); });
        document.getElementById('tab-mat').hidden = b.getAttribute('data-tab') !== 'mat';
        document.getElementById('tab-work').hidden = b.getAttribute('data-tab') !== 'work';
      });
    });
  }

  function viewAbout() {
    renderSidebar(null);
    setNav('about');
    document.title = '안내 · 조경재료 백과사전';
    app.innerHTML = '<div class="prose"><h1>안내</h1>' +
      '<p>이 백과사전은 조경 시공 현장에서 자주 쓰이는 <b>재료와 자재</b>를 정리한 자료입니다. 수목·초화류 같은 <b>식재는 조경재료가 아니므로 다루지 않습니다</b>. 지주목·인공토양·멀칭재처럼 식재를 돕는 자재는 포함했습니다.</p>' +
      '<h2>보는 방법</h2><ul>' +
      '<li>위쪽 검색창에 재료명이나 <b>현장 은어</b>(예: 공구리, 다루끼, 노깡)를 입력하면 해당 재료를 찾습니다.</li>' +
      '<li>왼쪽 분류로 석재·목재·금속 등을 골라 볼 수 있습니다.</li>' +
      '<li>재료 페이지의 <b>인쇄·PDF</b> 버튼으로 인쇄하거나 PDF로 저장할 수 있습니다.</li></ul>' +
      '<h2>사진 넣기</h2><p><code>images</code> 폴더에 아래 이름으로 넣으면 자동으로 표시됩니다.</p>' +
      '<pre>images/granite-1.jpg       ← 재료 사진 (최대 3장: -1, -2, -3)\nimages/granite-site-1.jpg  ← 시공 사례 사진 (최대 3장)</pre>' +
      '<p>재료의 영문 id는 주소창의 <code>#/m/</code> 뒤에 있는 이름입니다. 직접 찍은 사진이 아니면 출처를 꼭 남기세요(데이터 파일의 <code>photos</code> 항목에 <code>credit</code>).</p>' +
      '<h2>시공 단면도</h2><p>재료 페이지의 단면도는 재료가 실제로 어떤 층·부재와 함께 시공되는지 보여주는 <b>개념도</b>입니다. 축척이 없고 치수는 대표 예시입니다.</p>' +
      '<h2>수치에 대하여</h2><p>규격·강도 등은 대표적인 값입니다. 제조사, 산지, KS 개정, 현장 조건에 따라 달라지므로 실제 설계·발주에는 제품 자료와 표준시방서를 확인하세요.</p>' +
      '<h2>참고문헌</h2><p>재료 설명의 근거 자료는 <a href="#/refs">참고문헌</a> 페이지에 모아 두었습니다.</p>' +
      creditsSection() + '</div>';
  }

  function creditsSection() {
    var rows = [];
    MATS.forEach(function (m) {
      (PHOTOS[m.id] || []).forEach(function (p) { rows.push({ m: m, p: p }); });
    });
    if (!rows.length) return '';
    return '<h2 id="credits">사진 출처 (' + rows.length + '장)</h2>' +
      '<p>아래 사진은 위키미디어 공용(Wikimedia Commons)의 자유 이용 허락(CC·퍼블릭 도메인) 사진을 비상업적 교육 목적으로 사용했습니다. 원본은 각 링크에서 확인할 수 있습니다.</p>' +
      '<div class="table-wrap"><table class="gtable"><thead><tr><th>재료</th><th>사진</th><th>저작자 / 라이선스</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td><a href="#/m/' + r.m.id + '">' + esc(r.m.name) + '</a></td><td>' + esc(r.p.caption || '') +
          (r.p.type === 'site' ? ' <span class="chip">시공 사례</span>' : '') + '</td><td>' + creditHtml(r.p) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  // ---------- lightbox ----------
  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<div><img alt=""><p></p></div>';
  document.body.appendChild(lb);
  lb.addEventListener('click', function () { lb.classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
  function openLightbox(src, caption) {
    lb.querySelector('img').src = src;
    lb.querySelector('p').textContent = caption || '';
    lb.classList.add('open');
  }

  // ---------- router ----------
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    document.title = '조경재료 백과사전';
    document.body.classList.toggle('is-book', parts[0] === 'book');
    if (parts[0] === 'm' && parts[1]) viewMaterial(decodeURIComponent(parts[1]));
    else if (parts[0] === 'cat' && parts[1]) viewHome(parts[1]);
    else if (parts[0] === 'compare') viewCompare(parts.slice(1).join('/'));
    else if (parts[0] === 'guide') viewGuide(parts[1]);
    else if (parts[0] === 'refs') viewRefs();
    else if (parts[0] === 'book') viewBook();
    else if (parts[0] === 'slang') viewSlang();
    else if (parts[0] === 'about') viewAbout();
    else viewHome(null);
  }

  var timer;
  search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      query = search.value.trim();
      var h = location.hash;
      if (/^#\/slang/.test(h)) { viewSlang(); return; }
      if (query && !/^#\/(cat\/.*)?$/.test(h) && h !== '') { location.hash = '#/'; return; }
      route();
    }, 120);
  });

  window.addEventListener('hashchange', function () { route(); window.scrollTo(0, 0); });
  route();
})();
