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
  MATS.forEach(function (m) { m._hay = haystack(m); });

  function matches(m, q) {
    if (!q) return true;
    return q.split(/\s+/).filter(Boolean).every(function (w) { return m._hay.indexOf(norm(w)) !== -1; });
  }
  function score(m, q) {
    var n = norm(q);
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

  function placeholder(m) {
    var c = catById[m.cat] || { color: '#888', name: '' };
    return '<div class="placeholder" style="background-color:' + c.color + '">' + esc(m.name.charAt(0)) +
      '<small>사진 준비중</small></div>';
  }

  // 사진: photos 필드가 있으면 그것을, 없으면 images/{id}-N.jpg 를 자동 탐색
  function photoList(m, type) {
    if (m.photos && m.photos.length) {
      return m.photos.filter(function (p) { return (p.type || 'material') === type; });
    }
    var out = [];
    for (var i = 1; i <= 3; i++) {
      out.push({ src: 'images/' + m.id + (type === 'site' ? '-site-' : '-') + i + '.jpg', caption: '', auto: true });
    }
    return out;
  }

  function card(m) {
    var c = catById[m.cat] || {};
    var first = photoList(m, 'material')[0];
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
        '<p>실제 조경 현장에서 자주 쓰는 재료·자재의 특성, 규격, 시공 방법, 그리고 현장에서 부르는 은어까지 정리했습니다. 식재(수목·초화류)는 다루지 않습니다.</p></section>' +
        '<div class="stats"><span class="stat">재료 <b>' + MATS.length + '</b></span>' +
        '<span class="stat">분류 <b>' + CATS.length + '</b></span>' +
        '<span class="stat">현장 은어 <b>' + (slangCount + GLOSSARY.length) + '</b></span></div>';
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
      '<div class="tools"><button class="btn" id="print-btn" type="button">인쇄·PDF</button></div></div>';
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
        (m.cost ? '<tr><th>상대 가격대</th><td>' + costHtml(m.cost) + '</td></tr>' : '') + '</table></div>';
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
    fillGallery(document.querySelector('#g-material .gallery'), photoList(m, 'material'), m, 'material');
    fillGallery(document.querySelector('#g-site .gallery'), photoList(m, 'site'), m, 'site');
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
        if (p.caption || p.credit) {
          var cap = document.createElement('figcaption');
          cap.textContent = (p.caption || '') + (p.credit ? ' · 출처: ' + p.credit : '');
          fig.appendChild(cap);
        }
        fig.addEventListener('click', function () { openLightbox(p.src, p.caption); });
        el.appendChild(fig);
        done();
      };
      img.onerror = done;
      img.src = p.src;
    });
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
        mat.filter(function (r) { return !query || norm(r.t + r.m + r.mat.name).indexOf(norm(query)) !== -1; }).map(function (r) {
          return '<tr><td class="term">' + esc(r.t) + '</td><td>' + esc(r.o || '') + '</td><td>' + esc(r.m || '') + '</td>' +
            '<td><a href="#/m/' + r.mat.id + '">' + esc(r.mat.name) + '</a></td></tr>';
        }).join('') + '</tbody></table></div>' +
      '<div id="tab-work" class="table-wrap" hidden><table class="gtable"><thead><tr><th>은어</th><th>어원</th><th>바른 말</th><th>뜻</th></tr></thead><tbody>' +
        gl.filter(function (r) { return !query || norm(r.t + r.m + r.s).indexOf(norm(query)) !== -1; }).map(function (r) {
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
      '<h2>수치에 대하여</h2><p>규격·강도 등은 대표적인 값입니다. 제조사, 산지, KS 개정, 현장 조건에 따라 달라지므로 실제 설계·발주에는 제품 자료와 표준시방서를 확인하세요.</p></div>';
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
    if (parts[0] === 'm' && parts[1]) viewMaterial(decodeURIComponent(parts[1]));
    else if (parts[0] === 'cat' && parts[1]) viewHome(parts[1]);
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
