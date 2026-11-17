/* 잘못된 내용 알리기 · 건의하기 (2026-11-17)
 *
 * 로그인 없이 보낸다. 사진·정보가 틀렸거나 건의·제안이 있을 때 쓰는 창구다.
 * 받는 곳은 리프노트의 접수 API(POST https://leafnote.kr/api/reports, site: 'materials')이고,
 * 보낸 글과 보고 있던 화면만 저장한다 — 누가 보냈는지(IP·기기)는 저장하지 않는다.
 *
 * 유형 값(photo·info·suggestion·other)과 글자 수 상한은 리프노트 src/lib/reports.ts와 맞춘 것이다.
 * 한쪽을 바꾸면 다른 쪽도 같이 바꾼다. 숨은 칸 이름(website)도 마찬가지다.
 */
(function () {
  'use strict';
  var ENDPOINT = 'https://leafnote.kr/api/reports';
  var SITE = 'materials';
  var MIN = 5, MAX = 1000;
  var KINDS = [
    ['photo', '사진이 잘못됐습니다'],
    ['info', '정보·수치가 잘못됐습니다'],
    ['suggestion', '건의·제안이 있습니다'],
    ['other', '그 밖의 문제']
  ];

  var openBtn = document.getElementById('report-open');
  if (!openBtn) return;

  function el(tag, attrs, children) {
    var node = document.createElement(tag), k;
    for (k in attrs || {}) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  /* 지금 보고 있는 화면 — 해시 경로와 제목. 받는 쪽에서 어느 항목 얘기인지 알 수 있게 한다 */
  function where() {
    var h1 = document.querySelector('#app h1');
    var title = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
    return { path: location.hash || '#/', title: title };
  }

  var dialog, form, textarea, count, status, submit, whereLine;

  function build() {
    var radios = KINDS.map(function (k, i) {
      var input = el('input', { type: 'radio', name: 'kind', value: k[0] });
      if (i === 0) input.checked = true;
      return el('label', { 'class': 'rp-kind' }, [input, el('span', { text: k[1] })]);
    });
    textarea = el('textarea', {
      id: 'rp-message', name: 'message', rows: '5', required: '', minlength: String(MIN), maxlength: String(MAX),
      placeholder: '어디가 어떻게 다른지, 또는 무엇을 바라는지 적어 주세요. 예) 화강석 판석 사진이 다른 석재로 보입니다.'
    });
    count = el('span', { text: '0' });
    status = el('p', { 'class': 'rp-status', role: 'status', 'aria-live': 'polite' });
    submit = el('button', { type: 'submit', 'class': 'btn primary rp-submit', text: '보내기' });
    whereLine = el('p', { 'class': 'rp-where' });
    /* 숨은 칸 — 사람에게는 보이지 않는다. 자동 프로그램만 채운다 */
    var hp = el('div', { 'class': 'rp-hp', 'aria-hidden': 'true' }, [
      el('label', { text: '이 칸은 비워 두세요' }, [el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off' })])
    ]);
    form = el('form', { 'class': 'rp-form', novalidate: '' }, [
      el('fieldset', { 'class': 'rp-kinds' }, [el('legend', { 'class': 'rp-label', text: '무엇을 알려 주시나요?' })].concat(radios)),
      whereLine,
      el('label', { 'class': 'rp-label', 'for': 'rp-message', text: '내용' }),
      textarea,
      el('p', { 'class': 'rp-count' }, [count, document.createTextNode(' / ' + MAX + '자')]),
      hp,
      el('p', { 'class': 'rp-note', text: '이름·연락처 같은 개인정보는 적지 말아 주세요. 답장은 드리지 않습니다. 보낸 글과 보고 있던 화면만 저장하고, 누가 보냈는지는 저장하지 않습니다.' }),
      el('div', { 'class': 'rp-actions' }, [submit, el('button', { type: 'button', 'class': 'btn', 'data-rp-close': '', text: '닫기' })]),
      status
    ]);
    dialog = el('dialog', { 'class': 'rp-dialog', 'aria-labelledby': 'rp-title' }, [
      el('h2', { id: 'rp-title', 'class': 'rp-title', text: '잘못된 내용 알리기 · 건의하기' }),
      el('p', { 'class': 'rp-lead', text: '로그인 없이 보낼 수 있습니다. 확인해서 고치겠습니다.' }),
      form
    ]);
    document.body.appendChild(dialog);

    textarea.addEventListener('input', function () { count.textContent = String(textarea.value.length); });
    dialog.addEventListener('click', function (e) {
      /* 바깥(어두운 배경)을 누르면 닫는다 — dialog 자신이 눌린 경우가 배경이다 */
      if (e.target === dialog || (e.target.hasAttribute && e.target.hasAttribute('data-rp-close'))) close();
    });
    form.addEventListener('submit', send);
  }

  function say(text, kind) {
    status.textContent = text;
    status.className = 'rp-status' + (kind ? ' is-' + kind : '');
  }

  function open() {
    if (!dialog) build();
    var w = where();
    whereLine.textContent = '보고 있던 화면: ' + (w.title || '첫 화면');
    say('', '');
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    textarea.focus();
  }

  function close() {
    if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
    openBtn.focus();
  }

  function send(e) {
    e.preventDefault();
    var message = textarea.value.replace(/^\s+|\s+$/g, '');
    if (message.length < MIN) { say('조금 더 자세히 적어 주세요(' + MIN + '자 이상).', 'error'); textarea.focus(); return; }
    var w = where();
    var kind = (form.querySelector('input[name="kind"]:checked') || {}).value || 'other';
    var body = {
      site: SITE, kind: kind, message: message.slice(0, MAX),
      pagePath: (w.path + (w.title ? ' · ' + w.title : '')).slice(0, 300),
      website: form.querySelector('input[name="website"]').value
    };
    submit.disabled = true;
    say('보내는 중입니다…', '');
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (res) {
        if (res.ok) {
          say('보냈습니다. 알려 주셔서 고맙습니다.', 'ok');
          form.reset(); count.textContent = '0';
          setTimeout(function () { if (dialog.open) close(); }, 1800);
        } else if (res.status === 429) {
          say('지금 접수가 몰려 있습니다. 잠시 뒤 다시 보내 주세요.', 'error');
        } else {
          say('보내지 못했습니다. 내용을 확인하고 다시 시도해 주세요.', 'error');
        }
      })
      .catch(function () { say('연결이 되지 않아 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.', 'error'); })
      .then(function () { submit.disabled = false; });
  }

  openBtn.addEventListener('click', open);
})();
