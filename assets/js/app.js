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
  var VERIFY = window.LM_VERIFY || {};
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
  var TOOLS = [
    { h: '#/guide', n: '재료 선정 가이드' }, { h: '#/decide', n: '다기준 의사결정' }, { h: '#/compare', n: '재료 비교표' },
    { h: '#/calc', n: '물량·공사비 계산기' }, { h: '#/defects', n: '하자 사례' }, { h: '#/slang', n: '현장 은어 사전' },
    { h: '#/refs', n: '참고문헌' }, { h: '#/book', n: '전체 PDF' }
  ];
  function renderSidebar(activeCat, activeTool) {
    var html = '<h2>분류</h2>' +
      '<a class="cat-link' + (!activeCat && !activeTool ? ' active' : '') + '" href="#/all"><span class="cat-dot" style="background:var(--accent)"></span>전체<span class="cat-count">' + MATS.length + '</span></a>';
    CATS.forEach(function (c) {
      var n = MATS.filter(function (m) { return m.cat === c.id; }).length;
      html += '<a class="cat-link' + (activeCat === c.id ? ' active' : '') + '" href="#/cat/' + c.id + '">' +
        '<span class="cat-dot" style="background:' + c.color + '"></span>' + esc(c.name) +
        '<span class="cat-count">' + n + '</span></a>';
    });
    html += '<h2 class="side-tools">학습 도구</h2>' + TOOLS.map(function (t) {
      return '<a class="cat-link tool-link' + (activeTool === t.h ? ' active' : '') + '" href="' + t.h + '">' + esc(t.n) + '</a>';
    }).join('');
    sidebar.innerHTML = html;
  }

  function setNav(name) {
    document.querySelectorAll('.topnav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === name);
    });
  }

  // ---------- views ----------
  // 분류 타일: 대표 사진 최대 3장 + 이름 + 재료 수 + 예시 재료
  function catTile(c) {
    var ms = MATS.filter(function (m) { return m.cat === c.id; });
    var pics = [];
    ms.forEach(function (m) {
      if (pics.length >= 3) return;
      var ph = (PHOTOS[m.id] || []).filter(function (p) { return p.type !== 'site'; })[0] || (PHOTOS[m.id] || [])[0];
      if (ph) pics.push(ph.src);
    });
    var cover = pics.length ? '<div class="cat-cover n' + pics.length + '">' + pics.map(function (src) { return '<img loading="lazy" src="' + esc(src) + '" alt="">'; }).join('') + '</div>'
      : '<div class="cat-cover none" style="background:' + c.color + '"></div>';
    var names = ms.slice(0, 3).map(function (m) { return m.name; }).join(' · ') + (ms.length > 3 ? ' 외 ' + (ms.length - 3) + '종' : '');
    return '<a class="cat-tile" href="#/cat/' + c.id + '">' + cover + '<div class="cat-tile-body"><div class="cat-tile-head"><span class="cat-dot" style="background:' + c.color + '"></span><b>' + esc(c.name) + '</b><span class="cat-num">' + ms.length + '</span></div>' +
      '<span class="cat-names">' + esc(names) + '</span></div></a>';
  }

  function viewHome(catId, showAll) {
    renderSidebar(catId, catId || showAll ? null : '#/');
    setNav('home');
    var items = MATS.filter(function (m) { return (!catId || m.cat === catId) && matches(m, query); });
    if (query) items.sort(function (a, b) { return score(a, query) - score(b, query) || byKo(a.name, b.name); });

    var slangCount = MATS.reduce(function (n, m) { return n + (m.slang || []).length; }, 0);
    var html = '';
    var home = !catId && !query && !showAll;
    if (home) {
      var photoCount = Object.keys(PHOTOS).reduce(function (n, k) { return n + PHOTOS[k].length; }, 0);
      var secCount = Object.keys(window.LM_SECTIONS || {}).filter(function (k) { return matById[k]; }).length;
      html += '<section class="hero home-hero"><h1>조경재료 백과사전</h1>' +
        '<p>현장에서 쓰는 재료의 특성·규격·시공 단면도와 현장 은어까지. 식재(수목·초화류)는 다루지 않습니다.</p>' +
        '<p class="hero-meta">재료 <b>' + MATS.length + '</b> · 현장 은어 <b>' + (slangCount + GLOSSARY.length) + '</b> · 시공 단면도 <b>' + secCount + '</b> · 사진 <b>' + photoCount + '</b></p></section>';
      html += '<nav class="tool-strip" aria-label="학습 도구">' + TOOLS.map(function (t) {
        return '<a class="tool-pill" href="' + t.h + '">' + esc(t.n) + '</a>';
      }).join('') + '</nav>';
      html += '<div class="section-title"><h2>분류별로 둘러보기</h2><span>' + CATS.length + '개 분류</span>' +
        '<a class="see-all" href="#/all">재료 전체 목록 ' + MATS.length + '종 ›</a></div>';
      html += '<div class="cat-grid">' + CATS.map(catTile).join('') + '</div>';
      app.innerHTML = html;
      return;
    }
    if (query) {
      html += '<div class="section-title"><h2>“' + esc(query) + '” 검색 결과</h2><span>' + items.length + '건</span></div>';
      html += items.length ? '<div class="grid">' + items.map(card).join('') + '</div>'
        : '<div class="empty">찾는 재료가 없습니다. 다른 이름이나 은어로 검색해 보세요.</div>';
    } else if (catId) {
      var c = catById[catId];
      html += '<div class="crumbs"><a href="#/">홈</a> › ' + esc(c.name) + '</div>' +
        '<div class="section-title"><h2>' + esc(c.name) + '</h2><span>' + esc(c.desc) + ' · ' + items.length + '종</span></div>' +
        '<div class="grid">' + items.map(card).join('') + '</div>';
    } else {
      html += '<div class="crumbs"><a href="#/">홈</a> › 전체 목록</div>';
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

    var html = '<div class="crumbs"><a href="#/">홈</a> › <a href="#/cat/' + c.id + '">' + esc(c.name) + '</a>' +
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

    var ver = VERIFY[m.id] || [];
    if (ver.length) {
      var cnt = { confirmed: 0, corrected: 0, unverifiable: 0 };
      ver.forEach(function (v) { cnt[v.status] = (cnt[v.status] || 0) + 1; });
      var FIELD = { props: '특성', specs: '규격', steps: '시공', cautions: '주의', care: '유지관리', summary: '요약', slang: '은어', section: '단면도', procedure: '시공 순서' };
      var ST = { confirmed: ['ok', '확인'], corrected: ['fix', '수정 반영'], unverifiable: ['na', '확인 불가'] };
      html += '<details class="panel verify-panel"><summary><h3>표준 대조 결과</h3><span class="vcount"><span class="vtag ok">확인 ' + cnt.confirmed + '</span>' +
        '<span class="vtag fix">수정 ' + cnt.corrected + '</span><span class="vtag na">확인 불가 ' + cnt.unverifiable + '</span></span></summary>' +
        '<ul class="verify-list">' + ver.map(function (v) {
          var st = ST[v.status] || ['na', v.status];
          return '<li><span class="vtag ' + st[0] + '">' + st[1] + '</span> <span class="dash">[' + esc(FIELD[v.field] || v.field) + ']</span> ' + esc(v.text || '') +
            '<div class="vmeta">' + (v.ref ? '<b>' + esc(v.ref) + '</b> · ' : '') + esc(v.note || '') + '</div></li>';
        }).join('') + '</ul><p class="note">본문의 주요 수치·기준을 조경공사 표준시방서(KCS 34, 2024) 원문과 관련 법령·KS로 대조한 결과입니다. 수정 항목은 본문에 이미 반영되어 있습니다.</p></details>';
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
      if (canAnimate(box)) box.animate([{ opacity: .55 }, { opacity: 1 }], { duration: reducedMotion() ? 1 : 220, easing: SPRING });
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
        img.addEventListener('click', function () { openLightbox(p.src, (p.caption || '') + (credit ? ' — ' + credit : ''), img); });
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
    var host = '';
    try { host = new URL(p.url).hostname; } catch (e) { /* url 없음 */ }
    var src = /wikimedia|wikipedia/.test(host) ? 'Wikimedia Commons' : /flickr/.test(host) ? 'Flickr' : /geograph/.test(host) ? 'Geograph' : host.replace(/^www\./, '');
    return (p.artist || '작자 미상') + (p.license ? ' / ' + p.license : '') + (src && (p.artist || '').indexOf('(' ) === -1 ? ' (' + src + ')' : '');
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
    renderSidebar(null, '#/compare');
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
    renderSidebar(null, '#/guide');
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
    renderSidebar(null, '#/refs');
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
    renderSidebar(null, '#/book');
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
      '<p class="cover-note">콘텐츠 제작 © 2631063 유인선</p>' +
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
    var ver = VERIFY[m.id] || [];
    if (ver.length) {
      var cnt = { confirmed: 0, corrected: 0, unverifiable: 0 };
      ver.forEach(function (v) { cnt[v.status] = (cnt[v.status] || 0) + 1; });
      var FIELD = { props: '특성', specs: '규격', steps: '시공', cautions: '주의', care: '유지관리', summary: '요약', slang: '은어', section: '단면도', procedure: '시공 순서' };
      var ST = { confirmed: ['ok', '확인'], corrected: ['fix', '수정 반영'], unverifiable: ['na', '확인 불가'] };
      html += '<details class="panel verify-panel"><summary><h3>표준 대조 결과</h3><span class="vcount"><span class="vtag ok">확인 ' + cnt.confirmed + '</span>' +
        '<span class="vtag fix">수정 ' + cnt.corrected + '</span><span class="vtag na">확인 불가 ' + cnt.unverifiable + '</span></span></summary>' +
        '<ul class="verify-list">' + ver.map(function (v) {
          var st = ST[v.status] || ['na', v.status];
          return '<li><span class="vtag ' + st[0] + '">' + st[1] + '</span> <span class="dash">[' + esc(FIELD[v.field] || v.field) + ']</span> ' + esc(v.text || '') +
            '<div class="vmeta">' + (v.ref ? '<b>' + esc(v.ref) + '</b> · ' : '') + esc(v.note || '') + '</div></li>';
        }).join('') + '</ul><p class="note">본문의 주요 수치·기준을 조경공사 표준시방서(KCS 34, 2024) 원문과 관련 법령·KS로 대조한 결과입니다. 수정 항목은 본문에 이미 반영되어 있습니다.</p></details>';
    }

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

  // ---------- 물량·공사비 계산기 ----------
  var CALC = window.LM_CALC || [];
  function fmtNum(n, d) { return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('ko-KR'); }
  function viewCalc(id) {
    renderSidebar(null, '#/calc');
    setNav('');
    document.title = '물량·공사비 계산기 · 조경재료 백과사전';
    var a = CALC.filter(function (x) { return x.id === id; })[0] || CALC[0];
    var html = '<section class="hero"><h1>물량·공사비 계산기</h1><p>면적이나 길이를 넣으면 단면도의 층 구성대로 필요한 재료 수량과 대략의 자재비를 계산합니다. 두께·간격을 바꿔 보며 공사비가 어떻게 달라지는지 확인해 보세요.</p></section>' +
      '<div class="calc-pick">' + CALC.map(function (x) {
        return '<a class="chip preset' + (x === a ? ' on' : '') + '" href="#/calc/' + x.id + '">' + esc(x.name) + '</a>';
      }).join('') + '</div>';
    html += '<div class="calc-box"><div class="calc-inputs"><h2>' + esc(a.name) + '</h2><p class="dash">' + esc(a.desc) + ' · <a href="#/m/' + a.mat + '">재료 보기</a></p>' +
      '<label class="calc-field"><span>' + (a.unit === 'm' ? '길이' : '면적') + '</span><input type="number" id="calc-a" min="0" step="1" value="100"> <b>' + a.unit + '</b></label>' +
      a.params.map(function (p) {
        return '<label class="calc-field"><span>' + esc(p.label) + '</span><input type="number" data-p="' + p.key + '" min="0" step="1" value="' + p.value + '"> <b>' + esc(p.unit) + '</b></label>';
      }).join('') + '</div><div class="calc-out" id="calc-out"></div></div>' +
      '<p class="note">※ 자재비만 계산합니다 (인건비·장비비·운반비·부가세 제외). 단가는 <a href="#/m/' + a.mat + '">재료 페이지</a>의 참고 단가(출처 표시)에서 대표값을 골랐고, 할증(손실·겹침·다짐)은 일반적인 값을 가정했습니다. 실제 적산은 표준품셈과 견적을 따르세요.</p>';
    app.innerHTML = html;
    function calc() {
      var A = Math.max(0, +document.getElementById('calc-a').value || 0);
      var P = {};
      a.params.forEach(function (p) { var el = app.querySelector('[data-p="' + p.key + '"]'); P[p.key] = Math.max(0, +el.value || 0); });
      var total = 0, missing = false;
      var rows = a.items.map(function (it) {
        var q = it.q(A, P) * (1 + (it.loss || 0));
        var cost = it.price != null ? q * it.price : null;
        if (cost != null) total += cost; else missing = true;
        return '<tr><td><a href="#/m/' + it.mat + '">' + esc(it.name) + '</a><div class="calc-how">' + esc(it.how(P)) + (it.loss ? ' (할증 포함)' : '') + '</div></td>' +
          '<td class="num">' + fmtNum(q, q < 10 ? 2 : 1) + '</td><td>' + esc(it.unit) + '</td>' +
          '<td class="num">' + (it.price != null ? fmtNum(it.price, 0) : '<span class="dash">—</span>') + '</td>' +
          '<td class="num">' + (cost != null ? fmtNum(cost, 0) : '<span class="dash">단가 없음</span>') + '</td></tr>';
      }).join('');
      document.getElementById('calc-out').innerHTML = '<div class="table-wrap"><table class="gtable calc-table"><thead><tr><th>재료 · 산출 근거</th><th class="num">수량</th><th>단위</th><th class="num">단가(원)</th><th class="num">금액(원)</th></tr></thead><tbody>' + rows +
        '</tbody><tfoot><tr><th colspan="4">자재비 합계' + (missing ? ' (단가 없는 항목 제외)' : '') + '</th><th class="num">' + fmtNum(total, 0) + '</th></tr>' +
        (A > 0 ? '<tr><th colspan="4">' + a.unit + '당 자재비</th><th class="num">' + fmtNum(total / A, 0) + '</th></tr>' : '') + '</tfoot></table></div>';
    }
    app.querySelectorAll('.calc-inputs input').forEach(function (el) { el.addEventListener('input', calc); });
    calc();
  }

  // ---------- 하자 사례 ----------
  var DEFECTS = window.LM_DEFECTS || [];
  function sectionOf(x) { return typeof x === 'string' ? (window.LM_SECTIONS || {})[x] : x; }
  function viewDefects(id) {
    renderSidebar(null, '#/defects');
    setNav('');
    var d = DEFECTS.filter(function (x) { return x.id === id; })[0];
    if (!d) {
      document.title = '하자 사례 · 조경재료 백과사전';
      app.innerHTML = '<section class="hero"><h1>하자 사례</h1><p>조경 현장에서 자주 생기는 하자를 원인·예방·보수로 정리하고, 정상 시공 단면과 잘못 시공한 단면을 나란히 비교합니다.</p></section>' +
        '<div class="guide-grid">' + DEFECTS.map(function (x) {
          return '<a class="guide-card" href="#/defects/' + x.id + '"><b>' + esc(x.title) + '</b><span class="guide-q">' + esc(x.symptom) + '</span>' +
            '<span class="guide-meta">' + x.mats.map(function (m) { return matById[m] ? matById[m].name : ''; }).filter(Boolean).join(' · ') + '</span></a>';
        }).join('') + '</div>';
      return;
    }
    document.title = d.title + ' · 하자 사례';
    var good = sectionOf(d.good), bad = d.bad;
    var html = '<div class="crumbs"><a href="#/defects">하자 사례</a> › ' + esc(d.title) + '</div>' +
      '<section class="hero"><h1>' + esc(d.title) + '</h1><p>' + esc(d.symptom) + '</p></section>' +
      '<div class="defect-pair"><figure class="section-figure good"><figcaption><span class="tag ok">✓ 올바른 시공</span> ' + esc(good && good.title || '') + '</figcaption>' +
      '<div class="section-scroll">' + (good ? window.LM_SECTION.render(good) : '') + '</div></figure>' +
      '<figure class="section-figure bad"><figcaption><span class="tag ng">✕ 하자 발생</span> ' + esc(bad.title || '') + '</figcaption>' +
      '<div class="section-scroll">' + window.LM_SECTION.render(bad) + '</div></figure></div>' +
      '<div class="sections"><div class="panel"><h3>원인</h3>' + list(d.causes, 'cons') + '</div>' +
      '<div class="panel"><h3>예방</h3>' + list(d.prevent, 'pros') + '</div>' +
      '<div class="panel wide"><h3>보수 방법</h3>' + list(d.repair) + '</div></div>' +
      '<div class="related"><div class="section-title"><h2>관련 재료</h2></div><div class="grid">' +
      d.mats.map(function (m) { return matById[m]; }).filter(Boolean).map(card).join('') + '</div></div>';
    app.innerHTML = html;
  }

  // ---------- 다기준 의사결정 ----------
  var CRIT = window.LM_CRITERIA || [];
  var SCORES = window.LM_SCORES || {};
  var W_KEY = 'lm-weights';
  function loadWeights() {
    try { var w = JSON.parse(localStorage.getItem(W_KEY) || 'null'); if (w && w.length === CRIT.length) return w; } catch (e) { /* 저장 불가 */ }
    return CRIT.map(function () { return 3; });
  }
  function decideGroups() {
    var g = [];
    (window.LM_COMPARE_PRESETS || []).forEach(function (p, i) { g.push({ key: 'p' + i, group: '추천 비교 묶음', name: p.name, ids: p.ids }); });
    GUIDE.forEach(function (x) {
      x.options.forEach(function (o, i) {
        g.push({ key: 'g-' + x.id + '-' + i, group: '선정 가이드 · ' + x.title, name: x.title + ' — ' + o.label, ids: o.picks });
      });
      var all = [];
      x.options.forEach(function (o) { o.picks.forEach(function (p) { if (all.indexOf(p) === -1) all.push(p); }); });
      g.push({ key: 'g-' + x.id, group: '선정 가이드 · ' + x.title, name: x.title + ' — 모든 후보', ids: all });
    });
    CATS.forEach(function (c) {
      g.push({ key: 'c-' + c.id, group: '분류 전체', name: c.name, ids: MATS.filter(function (m) { return m.cat === c.id; }).map(function (m) { return m.id; }) });
    });
    return g;
  }
  function viewDecide(key) {
    renderSidebar(null, '#/decide');
    setNav('');
    document.title = '다기준 의사결정 · 조경재료 백과사전';
    var groups = decideGroups();
    var grp = groups.filter(function (x) { return x.key === key; })[0] || groups[0];
    var W = loadWeights();
    var byGroup = {};
    groups.forEach(function (x) { (byGroup[x.group] = byGroup[x.group] || []).push(x); });
    var html = '<section class="hero"><h1>다기준 의사결정</h1><p>내구성·경제성·시공성·유지관리·친환경성 다섯 기준에 가중치를 주면, 후보 재료의 종합 점수가 다시 계산되어 순위가 바뀝니다. (가중합 방식, 0~5점)</p></section>' +
      '<div class="decide-top"><label class="calc-field"><span>후보 묶음</span><select id="dc-group">' + Object.keys(byGroup).map(function (gn) {
        return '<optgroup label="' + esc(gn) + '">' + byGroup[gn].map(function (x) {
          return '<option value="' + x.key + '"' + (x === grp ? ' selected' : '') + '>' + esc(x.name) + '</option>';
        }).join('') + '</optgroup>';
      }).join('') + '</select></label></div>' +
      '<div class="decide-box"><div class="weights">' + CRIT.map(function (c, i) {
        return '<label class="weight"><span class="wname"><span><i class="sw c' + (i + 1) + '"></i>' + esc(c.name) + '</span><small>' + esc(c.desc) + '</small></span>' +
          '<input type="range" min="0" max="5" step="1" value="' + W[i] + '" data-w="' + i + '" aria-label="' + esc(c.name) + ' 가중치"><b id="wv' + i + '">' + W[i] + '</b></label>';
      }).join('') + '<div class="weight-presets"><button type="button" class="btn" data-wp="3,3,3,3,3">균등</button>' +
        '<button type="button" class="btn" data-wp="2,5,3,2,1">예산 우선</button><button type="button" class="btn" data-wp="5,1,2,5,2">오래가는 공공시설</button>' +
        '<button type="button" class="btn" data-wp="2,2,2,3,5">친환경 우선</button><button type="button" class="btn" data-wp="3,3,5,3,1">공기 단축</button></div></div>' +
      '<div class="decide-chart" id="dc-chart"></div></div>' +
      '<details class="decide-table"><summary>점수표 보기</summary><div class="table-wrap" id="dc-table"></div></details>' +
      '<p class="note">※ 기준별 점수(1~5)는 각 재료 페이지의 장단점·가격대·유지관리 내용을 바탕으로 작성자가 매긴 상대 평가입니다. 같은 용도 재료끼리 비교할 때 의미가 있으며, 가중치를 바꿔 보는 민감도 분석에 활용하세요.</p>';
    app.innerHTML = html;
    var ids = grp.ids.filter(function (id) { return matById[id] && SCORES[id]; });
    function draw() {
      var sw = W.reduce(function (a, b) { return a + b; }, 0) || 1;
      var rows = ids.map(function (id) {
        var s = SCORES[id];
        var parts = s.map(function (v, i) { return v * W[i] / sw; });
        return { m: matById[id], s: s, parts: parts, total: parts.reduce(function (a, b) { return a + b; }, 0) };
      }).sort(function (a, b) { return b.total - a.total; });
      // 행은 재료별로 한 번만 만들고, 가중치가 바뀌면 막대 길이만 바꾼 뒤 순위 이동을 FLIP 으로 미끄러지게 한다.
      var chartEl = document.getElementById('dc-chart');
      if (!chartEl.querySelector('.bar-list')) {
        chartEl.innerHTML = '<div class="legend"></div><div class="bar-list">' + rows.map(function (r) {
          return '<div class="bar-row" data-id="' + r.m.id + '"><a class="bar-name" href="#/m/' + r.m.id + '"></a><div class="bar-track">' +
            CRIT.map(function (c, i) { return '<span class="seg c' + (i + 1) + '"></span>'; }).join('') + '</div><b class="bar-val"></b></div>';
        }).join('') + '</div><div class="bar-axis"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>';
      }
      chartEl.querySelector('.legend').innerHTML = CRIT.map(function (c, i) { return '<span><i class="sw c' + (i + 1) + '"></i>' + esc(c.name) + ' ×' + W[i] + '</span>'; }).join('');
      var list = chartEl.querySelector('.bar-list');
      var before = {};
      list.querySelectorAll('.bar-row').forEach(function (el) { before[el.getAttribute('data-id')] = el.getBoundingClientRect().top; });
      rows.forEach(function (r, k) {
        var el = list.querySelector('[data-id="' + r.m.id + '"]');
        el.querySelector('.bar-name').textContent = (k + 1) + '. ' + r.m.name;
        el.querySelector('.bar-val').textContent = r.total.toFixed(2);
        el.querySelectorAll('.seg').forEach(function (seg, i) {
          var v = r.parts[i];
          seg.style.width = (v / 5 * 100) + '%';
          seg.style.display = v > 0 ? '' : 'none';
          seg.setAttribute('data-tip', r.m.name + ' · ' + CRIT[i].name + ' ' + r.s[i] + '점 × 가중치 ' + W[i] + ' → ' + v.toFixed(2));
        });
        list.appendChild(el);
      });
      if (!reducedMotion()) list.querySelectorAll('.bar-row').forEach(function (el) {
        var dy = (before[el.getAttribute('data-id')] || 0) - el.getBoundingClientRect().top;
        if (dy && canAnimate(el)) el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 420, easing: SPRING });
      });
      document.getElementById('dc-table').innerHTML = '<table class="gtable"><thead><tr><th>재료</th>' + CRIT.map(function (c) { return '<th class="num">' + esc(c.name) + '</th>'; }).join('') + '<th class="num">종합</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + esc(r.m.name) + '</td>' + r.s.map(function (v) { return '<td class="num">' + v + '</td>'; }).join('') + '<td class="num"><b>' + r.total.toFixed(2) + '</b></td></tr>'; }).join('') + '</tbody></table>';
    }
    function setW(nw) {
      W = nw;
      try { localStorage.setItem(W_KEY, JSON.stringify(W)); } catch (e) { /* 저장 불가 */ }
      app.querySelectorAll('[data-w]').forEach(function (el) { var i = +el.getAttribute('data-w'); el.value = W[i]; document.getElementById('wv' + i).textContent = W[i]; });
      draw();
    }
    app.querySelectorAll('[data-w]').forEach(function (el) {
      el.addEventListener('input', function () { var nw = W.slice(); nw[+el.getAttribute('data-w')] = +el.value; setW(nw); });
    });
    app.querySelectorAll('[data-wp]').forEach(function (b) {
      b.addEventListener('click', function () { setW(b.getAttribute('data-wp').split(',').map(Number)); });
    });
    document.getElementById('dc-group').addEventListener('change', function (e) { location.hash = '#/decide/' + e.target.value; });
    // 막대 위 툴팁
    var tip = document.getElementById('viz-tip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'viz-tip'; tip.className = 'viz-tip'; document.body.appendChild(tip); }
    tip.hidden = true;
    var chartEl = document.getElementById('dc-chart');
    chartEl.addEventListener('mousemove', function (e) {
      var t = e.target.getAttribute && e.target.getAttribute('data-tip');
      if (!t) { tip.hidden = true; return; }
      tip.hidden = false; tip.textContent = t;
      tip.style.left = Math.min(e.clientX + 12, window.innerWidth - 290) + 'px'; tip.style.top = (e.clientY + 14) + 'px';
    });
    chartEl.addEventListener('mouseleave', function () { tip.hidden = true; });
    draw();
  }

  function viewSlang() {
    renderSidebar(null, '#/slang');
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
      '<p>아래 사진은 위키미디어 공용(Wikimedia Commons)과 Flickr 등에 올라온 자유 이용 허락(CC·퍼블릭 도메인) 사진을 비상업적 교육 목적으로 사용했습니다. 원본은 각 링크에서 확인할 수 있습니다.</p>' +
      '<div class="table-wrap"><table class="gtable"><thead><tr><th>재료</th><th>사진</th><th>저작자 / 라이선스</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td><a href="#/m/' + r.m.id + '">' + esc(r.m.name) + '</a></td><td>' + esc(r.p.caption || '') +
          (r.p.type === 'site' ? ' <span class="chip">시공 사례</span>' : '') + '</td><td>' + creditHtml(r.p) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  // ---------- motion helpers ----------
  // 임계 감쇠 스프링에 가까운 곡선. 동작 줄이기 설정이면 짧은 크로스페이드로 대체한다.
  var SPRING = 'cubic-bezier(.22, 1, .36, 1)';
  function reducedMotion() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function canAnimate(el) { return el && typeof el.animate === 'function'; }

  // ---------- lightbox ----------
  // 사진이 갤러리 속 제자리에서 커져 나오고, 닫으면 같은 길로 돌아간다(공간 일관성).
  // 열리는 도중에 닫아도 같은 애니메이션을 그 자리에서 되돌린다(중단 가능).
  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<div><img alt=""><p></p></div>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), lbAnim = null, lbFade = null, lbSource = null;
  function flipFrom(src) {
    var a = src.getBoundingClientRect(), b = lbImg.getBoundingClientRect();
    if (!a.width || !b.width) return null;
    return 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')';
  }
  function closeLightbox() {
    if (!lb.classList.contains('open')) return;
    var finish = function () { lb.classList.remove('open'); lbAnim = lbFade = null; };
    if (lbAnim && lbFade && !reducedMotion()) {
      lbAnim.onfinish = null;
      lbAnim.playbackRate = 1.25; lbFade.playbackRate = 1.25;
      lbAnim.reverse(); lbFade.reverse();
      lbFade.onfinish = finish;
    } else if (canAnimate(lb)) {
      lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out' }).onfinish = finish;
    } else finish();
  }
  lb.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  function openLightbox(src, caption, fromEl) {
    lbSource = fromEl || null;
    lb.querySelector('p').textContent = caption || '';
    lbImg.src = src;
    lb.classList.add('open');
    if (!canAnimate(lb)) return;
    if (reducedMotion()) { lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }); return; }
    var run = function () {
      lbFade = lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: SPRING, fill: 'both' });
      var from = lbSource && flipFrom(lbSource);
      lbAnim = lbImg.animate(from ? [{ transform: from, borderRadius: '10px' }, { transform: 'none', borderRadius: '12px' }]
        : [{ transform: 'scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: SPRING, fill: 'both' });
    };
    if (lbImg.complete && lbImg.naturalWidth) run(); else lbImg.onload = function () { lbImg.onload = null; run(); };
  }

  // 화면 전환: 새 화면이 살짝 떠오르며 나타남 (동작 줄이기면 짧은 페이드)
  function enterView() {
    if (!canAnimate(app)) return;
    app.animate(reducedMotion() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
      { duration: reducedMotion() ? 140 : 360, easing: SPRING });
  }

  // 상단 바: 내용이 밑으로 들어갈 때만 가장자리 표시 (하드 구분선 대신)
  var topbar = document.querySelector('.topbar');
  function onScroll() { topbar.classList.toggle('scrolled', window.scrollY > 4); }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- router ----------
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    document.title = '조경재료 백과사전';
    document.body.classList.toggle('is-book', parts[0] === 'book');
    if (parts[0] === 'm' && parts[1]) viewMaterial(decodeURIComponent(parts[1]));
    else if (parts[0] === 'cat' && parts[1]) viewHome(parts[1]);
    else if (parts[0] === 'all') viewHome(null, true);
    else if (parts[0] === 'compare') viewCompare(parts.slice(1).join('/'));
    else if (parts[0] === 'guide') viewGuide(parts[1]);
    else if (parts[0] === 'calc') viewCalc(parts[1]);
    else if (parts[0] === 'defects') viewDefects(parts[1]);
    else if (parts[0] === 'decide') viewDecide(parts[1]);
    else if (parts[0] === 'refs') viewRefs();
    else if (parts[0] === 'book') viewBook();
    else if (parts[0] === 'slang') viewSlang();
    else if (parts[0] === 'about') viewAbout();
    else viewHome(null);
  }

  // 검색: 입력 즉시 결과 반영 (지연 없음)
  search.addEventListener('input', function () {
    query = search.value.trim();
    var h = location.hash;
    if (/^#\/slang/.test(h)) { viewSlang(); return; }
    if (query && !/^#\/(cat\/.*|all)?$/.test(h) && h !== '') { location.hash = '#/'; return; }
    route();
  });

  window.addEventListener('hashchange', function () { window.scrollTo(0, 0); route(); enterView(); onScroll(); });
  route();
  onScroll();
})();
