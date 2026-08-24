/* =========================================================
   비개발자 웹샵 가이드 사이트 — 에디터 워크벤치 런타임
   모든 문서 페이지가 이 파일 하나를 공유합니다.

   하는 일
   1) 타이틀바 / 파일 트리 / 개요(아웃라인) / 상태바 생성
   2) 명령 팔레트 (Ctrl+P / Ctrl+K) 와 단축키
   3) 프롬프트 COPY 버튼, 체크리스트(저장 안 함), 테마 전환
   4) 워크샵 당일 공개(잠금) 처리

   화면 껍데기는 일부러 얇게 유지합니다. 탭바·빵부스러기·줄번호·미니맵·
   하단 터미널은 읽는 데 도움이 안 돼서 뺐습니다. 문서 이동은 사이드바
   하나로만 합니다.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 문서 목록 (사이드바·탭·팔레트 공통 소스) ---------- */
  var FILES = [
    { f: 'index.html',     t: 'README · 준비 체크리스트', d: '개요와 전날까지 준비할 것' },
    { f: 'dday.html',      t: '오늘 할 일',               d: '배우는 것 · 순서 · 용어' },
    { f: 'templates.html', t: '범용 프롬프트 템플릿',     d: '역할·맥락·요청·형식 4칸' },
    { f: 'step1.html',     t: 'STEP 1 · 화면(UI) 만들기', d: '목록·글쓰기·상세보기' },
    { f: 'step2.html',     t: 'STEP 2 · Google Sheets 연동', d: '저장과 불러오기' },
    { f: 'step3.html',     t: 'STEP 3 · GitHub + Vercel 배포', d: '인터넷 주소 만들기' },
    { f: 'extra.html',     t: '여유 시 도전 과제',        d: '답변달기 · 도메인' },
    { f: 'errors.html',    t: '에러 해결법',              d: '콘솔 읽는 법과 패턴표' },
    { f: 'tips.html',      t: 'AI와 일하는 두 가지 습관', d: '심화 · 쪼개기와 인터뷰' }
  ];

  /* ---------- 공개 설정 ----------
     index.html 을 뺀 나머지 문서는 워크샵 당일에 열립니다.
     날짜가 지났거나 참가자 코드를 넣으면 열립니다.

     ⚠️ 이건 "커튼"이지 보안이 아닙니다. 정적 사이트라 잠긴 문서의 HTML은
        브라우저 소스 보기나 GitHub 저장소에서 그대로 읽을 수 있습니다.
        워크샵 전에 미리 열어보지 않게 하는 용도로만 쓰세요.        */
  var OPEN_AT = new Date(2026, 7, 30, 0, 0, 0);   // 2026년 8월 30일(일) 0시, 보는 사람의 시간대 기준
  var PASSCODE = '1021';
  var FREE = ['index.html'];                      // 언제나 열려 있는 문서 (참가자는 여기까지)

  var ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.6 14.6 20 20"/></svg>',
    theme:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15" /><path d="M12 6.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M9.5 5v14"/></svg>'
  };

  var ide = document.querySelector('.ide');
  var main = document.querySelector('.main');
  if (!ide || !main) return;

  var current = document.body.dataset.file || 'index.html';
  var meta = null;
  for (var i = 0; i < FILES.length; i++) if (FILES[i].f === current) meta = FILES[i];
  if (!meta) meta = { f: current, t: document.title, d: '' };
  var pageIndex = FILES.indexOf(meta);

  var scroller = document.getElementById('scroller');
  var headings = [];
  var locked = false;   // 지금 보고 있는 문서가 잠겨 있는가 (실행부에서 계산)

  /* =========================================================
     1. 골격 만들기
     ========================================================= */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* --- 타이틀바 (문서 위치를 알려주는 한 줄) --- */
  function buildTitlebar() {
    var bar = document.querySelector('.titlebar');
    bar.innerHTML =
      '<div class="dots"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i></div>' +
      '<button class="iconbtn sb-toggle" data-cmd="sidebar" title="문서 목록 접기/펴기 (Ctrl+B)">' + ICON.layout + '</button>' +
      '<div class="path"><span class="dir">workshop</span><i>/</i><b>' + esc(meta.f) + '</b>' +
        '<span class="ttl hide-sm">— ' + esc(meta.t) + '</span></div>' +
      '<div class="win-actions">' +
        '<button class="iconbtn" data-cmd="palette" title="문서 찾기 (Ctrl+P)">' + ICON.search + '</button>' +
        '<button class="iconbtn" data-cmd="theme" title="테마 전환">' + ICON.theme + '</button>' +
      '</div>';
  }

  /* --- 사이드바 --- */
  function buildSidebar() {
    var sb = document.querySelector('.sidebar');

    var tree = '<div class="tree">';
    FILES.forEach(function (x, i) {
      tree += '<a href="' + x.f + '"' + (x.f === current ? ' class="active"' : '') +
        ' title="' + esc(x.f + (x.d ? ' — ' + x.d : '')) + '">' +
        '<span class="no">' + (i + 1) + '</span>' + esc(x.t) + lockMark(x.f) + '</a>';
    });
    tree += '</div>';

    var demo =
      '<div class="tree">' +
        '<a href="sample/index.html" target="_blank" rel="noopener">' +
        '<span class="no">▸</span>완성본 데모<span class="ext">↗</span></a>' +
      '</div>';

    sb.innerHTML =
      '<div class="sb-head">문서<button class="sb-close" data-cmd="sidebar" title="닫기">✕</button></div>' +
      '<section class="sb-sec">' + tree + '</section>' +
      '<section class="sb-sec">' + demo + '</section>' +
      '<section class="sb-sec" id="outlineSec">' +
        '<button class="sb-sec-head"><span class="caret">▼</span>이 문서 안에서' +
        '<span class="count" id="outlineCount"></span></button>' +
        '<div class="tree outline" id="outline"></div>' +
      '</section>';
  }

  /* --- 상태바 --- */
  function buildStatus() {
    var sb = document.querySelector('.statusbar');
    var gate = isUnlocked()
      ? (hasPass() && !isOpenDay()
          ? '<button class="si" data-cmd="relock" title="참가자 코드 기록을 지우고 다시 잠급니다">🔓 코드 입장 중</button>'
          : '')
      : '<span class="si" title="' + openDayText() + ' 0시 공개 · 참가자 코드로 미리 열기">🔒 D-' + daysLeft() + '</span>';

    sb.innerHTML =
      '<span class="si">⎇ main</span>' +
      gate +
      '<span class="si" id="stProgress"></span>' +
      '<button class="si right" data-cmd="palette" title="문서 찾기 · 명령">Ctrl+P</button>';
    var prog = document.getElementById('stProgress');
    if (pageIndex >= 0) prog.textContent = '문서 ' + (pageIndex + 1) + '/' + FILES.length;
  }

  /* =========================================================
     2. 개요 · 줄번호 · 미니맵
     ========================================================= */

  function slug(text, i) {
    var s = String(text).trim().toLowerCase()
      .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return (s || 'sec') + '-' + i;
  }

  function buildOutline() {
    /* 단계 카드 안의 h3까지 넣으면 개요가 너무 길어져서 훑기 어렵습니다.
       실제 섹션 제목(h2 · 최상위 h3)만 담습니다. */
    headings = [].slice.call(main.querySelectorAll('h2, h3')).filter(function (h) {
      return !h.closest('.steps') && !h.closest('.qa');
    });
    var box = document.getElementById('outline');
    var html = '';
    headings.forEach(function (h, i) {
      if (!h.id) h.id = slug(h.textContent, i);
      var lv3 = h.tagName === 'H3';
      html += '<a href="#' + h.id + '" data-idx="' + i + '" class="' + (lv3 ? 'lv3' : '') + '">' +
        '<span class="ic">' + (lv3 ? '#' : '#') + '</span>' + esc(h.textContent) + '</a>';
    });
    box.innerHTML = html || '<div class="row dim">항목 없음</div>';
    document.getElementById('outlineCount').textContent = String(headings.length);

    box.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      var h = headings[+a.dataset.idx];
      if (h) scrollToEl(h);
      if (window.matchMedia('(max-width:900px)').matches) ide.classList.remove('sidebar-open');
    });
  }

  function scrollToEl(node) {
    scroller.scrollTo({ top: node.offsetTop - 16, behavior: 'smooth' });
  }

  /* 스크롤에 따라 개요에서 지금 읽는 섹션을 강조한다 */
  function onScroll() {
    var top = scroller.scrollTop;
    var links = document.querySelectorAll('#outline a');
    var cur = -1;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].offsetTop - 60 <= top) cur = i; else break;
    }
    links.forEach(function (a, i) { a.classList.toggle('current', i === cur); });
  }

  /* =========================================================
     3. 명령 팔레트
     ========================================================= */

  var COMMANDS = [
    { t: '문서 목록 접기 / 펴기', d: 'Ctrl+B', run: function () { toggleSidebar(); } },
    { t: '테마 전환 (다크 / 라이트)', d: '', run: function () { toggleTheme(); } },
    { t: '완성본 데모 열기', d: '새 탭', run: function () { window.open('sample/index.html', '_blank', 'noopener'); } },
    { t: '맨 위로 이동', d: '', run: function () { scroller.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { t: '체크 전부 풀기', d: 'checklist', run: function () { resetChecks(); } },
    { t: '잠금 다시 걸기 (참가자 코드 기록 지우기)', d: '', run: function () { relock(); } }
  ];

  var pal, palInput, palList, palItems = [], palSel = 0;

  function buildPalette() {
    pal = el('div', 'palette');
    pal.hidden = true;
    pal.innerHTML =
      '<input type="text" id="palInput" placeholder="파일 이름을 입력하세요. &gt; 명령,  @ 문서 내 제목" autocomplete="off" spellcheck="false">' +
      '<div class="pal-list" id="palList"></div>' +
      '<div class="pal-foot"><span>↑↓ 이동</span><span>Enter 열기</span><span>Esc 닫기</span><span class="hide-sm">&gt; 명령 · @ 제목</span></div>';
    var scrim = el('div', 'scrim');
    scrim.hidden = true;
    document.body.appendChild(scrim);
    document.body.appendChild(pal);
    palInput = pal.querySelector('#palInput');
    palList = pal.querySelector('#palList');

    scrim.addEventListener('click', closePalette);
    palInput.addEventListener('input', function () { renderPalette(palInput.value); });
    palInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); accept(); }
      else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    });
    palList.addEventListener('click', function (e) {
      var it = e.target.closest('.pal-item');
      if (!it) return;
      palSel = +it.dataset.i;
      accept();
    });
    pal.scrim = scrim;
  }

  function candidates(q) {
    var list = [];
    if (q.charAt(0) === '>') {
      COMMANDS.forEach(function (c) { list.push({ ic: '⌘', t: c.t, d: c.d, run: c.run }); });
      q = q.slice(1);
    } else if (q.charAt(0) === '@') {
      headings.forEach(function (h, i) {
        list.push({ ic: '#', t: h.textContent, d: h.tagName.toLowerCase(), run: function () { scrollToEl(h); } });
      });
      q = q.slice(1);
    } else {
      FILES.forEach(function (x) {
        var lk = (isGated(x.f) && !isUnlocked()) ? ' 🔒' : '';
        list.push({ ic: '◆', t: x.f, d: x.t + lk, run: function () { location.href = x.f; } });
      });
      list.push({ ic: '◆', t: 'sample/index.html', d: '완성본 데모 ↗', run: function () { window.open('sample/index.html', '_blank', 'noopener'); } });
      headings.forEach(function (h) {
        list.push({ ic: '#', t: h.textContent, d: meta.f, run: function () { scrollToEl(h); } });
      });
      COMMANDS.forEach(function (c) { list.push({ ic: '⌘', t: c.t, d: c.d, run: c.run }); });
    }
    q = q.trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (it) {
      return fuzzy(q, (it.t + ' ' + (it.d || '')).toLowerCase());
    });
  }

  function fuzzy(q, s) {
    if (s.indexOf(q) >= 0) return true;
    var i = 0;
    for (var j = 0; j < s.length && i < q.length; j++) if (s[j] === q[i]) i++;
    return i === q.length;
  }

  function renderPalette(q) {
    palItems = candidates(q || '');
    palSel = 0;
    if (!palItems.length) {
      palList.innerHTML = '<div class="pal-empty">일치하는 항목이 없습니다</div>';
      return;
    }
    palList.innerHTML = palItems.map(function (it, i) {
      return '<div class="pal-item' + (i === 0 ? ' sel' : '') + '" data-i="' + i + '">' +
        '<span class="ic">' + it.ic + '</span><span class="t">' + esc(it.t) + '</span>' +
        (it.d ? '<span class="d">' + esc(it.d) + '</span>' : '') + '</div>';
    }).join('');
  }

  function move(dir) {
    if (!palItems.length) return;
    palSel = (palSel + dir + palItems.length) % palItems.length;
    var nodes = palList.querySelectorAll('.pal-item');
    nodes.forEach(function (n, i) { n.classList.toggle('sel', i === palSel); });
    var sel = nodes[palSel];
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  }

  function accept() {
    var it = palItems[palSel];
    closePalette();
    if (it && it.run) it.run();
  }

  function openPalette(prefix) {
    if (!pal) buildPalette();
    pal.hidden = false;
    pal.scrim.hidden = false;
    palInput.value = prefix || '';
    renderPalette(palInput.value);
    palInput.focus();
    palInput.select();
  }

  function closePalette() {
    if (!pal) return;
    pal.hidden = true;
    pal.scrim.hidden = true;
  }

  /* =========================================================
     4. 토글 · 저장
     ========================================================= */

  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  function toggleSidebar() {
    if (window.matchMedia('(max-width:900px)').matches) {
      ide.classList.toggle('sidebar-open');
    } else {
      ide.classList.toggle('sidebar-hidden');
      LS.set('ide_sidebar', ide.classList.contains('sidebar-hidden') ? 'off' : 'on');
    }
  }

  function toggleTheme() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    if (light) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'light');
    LS.set('ide_theme', light ? 'dark' : 'light');
  }

  function restorePrefs() {
    if (LS.get('ide_theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
    if (LS.get('ide_sidebar') === 'off') ide.classList.add('sidebar-hidden');
  }

  /* --- 프롬프트 복사 --- */
  function wireCopy() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var box = btn.closest('.term');
        var pre = box && box.querySelector('pre');
        if (!pre) return;
        var text = pre.innerText;
        var done = function () {
          btn.textContent = '복사됨 ✓';
          btn.classList.add('done');
          setTimeout(function () { btn.textContent = 'COPY'; btn.classList.remove('done'); }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
    });
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* --- 체크리스트 ---
     체크는 되지만 저장하지 않습니다. 새로고침하면 전부 풀립니다.
     여러 사람이 돌려 보는 문서라, 앞사람이 체크해둔 상태가 남아 있으면
     다음 사람이 "이건 뭐가 된 거지?" 하고 헷갈립니다. */

  function wireChecks() {
    var checks = [].slice.call(document.querySelectorAll('.check'));
    if (!checks.length) return;
    checks.forEach(function (c) {
      c.addEventListener('click', function () {
        c.classList.toggle('done');
        paintProgress(checks);
      });
    });
    paintProgress(checks);
  }

  function paintProgress(checks) {
    /* 상태바 숫자는 참가자에게 보이는 항목만 셉니다.
       진행자용(.hostbox 안)은 접혀 있어서, 총계에 넣으면
       "6개만 보이는데 왜 14개지?"가 됩니다. */
    var mine = checks.filter(function (c) { return !c.closest('.hostbox'); });
    var done = mine.filter(function (c) { return c.classList.contains('done'); }).length;
    var prog = document.getElementById('stProgress');
    if (prog) prog.textContent = '체크리스트 ' + done + '/' + mine.length;
  }

  function resetChecks() {
    var checks = [].slice.call(document.querySelectorAll('.check'));
    checks.forEach(function (c) { c.classList.remove('done'); });
    if (checks.length) paintProgress(checks);
  }

  /* =========================================================
     5. 접근 제한 (워크샵 당일 공개 · 참가자 코드)
     ========================================================= */

  var PASS_KEY = 'ide_pass';

  function isGated(file) { return FREE.indexOf(file) < 0; }
  function isOpenDay() { return Date.now() >= OPEN_AT.getTime(); }
  function hasPass() { return LS.get(PASS_KEY) === PASSCODE; }
  function isUnlocked() { return isOpenDay() || hasPass(); }

  /* 공개일까지 남은 날 (오늘이 공개일이면 0) */
  function daysLeft() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var open = new Date(OPEN_AT.getTime());
    open.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((open - today) / 86400000));
  }

  function openDayText() {
    var days = ['일', '월', '화', '수', '목', '금', '토'];
    return OPEN_AT.getFullYear() + '년 ' + (OPEN_AT.getMonth() + 1) + '월 ' +
      OPEN_AT.getDate() + '일(' + days[OPEN_AT.getDay()] + ')';
  }

  /* 잠긴 문서면 본문을 잠금 화면으로 통째로 바꾼다 */
  function applyLock() {
    locked = isGated(current) && !isUnlocked();
    if (!locked) return;

    document.title = '🔒 잠긴 문서 — 비개발자 웹사이트 워크샵';
    main.innerHTML =
      '<h1>잠긴 문서</h1>' +
      '<p class="subtitle">이 문서는 워크샵 당일에 열립니다</p>' +
      '<div class="lockbox">' +
        '<div class="lock-top">' +
          '<span class="lock-ic">🔒</span>' +
          '<div><div class="lock-file">' + esc(meta.f) + '</div>' +
          '<div class="lock-sub">' + esc(meta.t) + '</div></div>' +
          '<span class="dday">D-' + daysLeft() + '</span>' +
        '</div>' +
        '<p>워크샵 당일인 <strong>' + openDayText() + '</strong> 0시에 자동으로 열립니다. ' +
        '미리 봐야 한다면 아래에 <strong>참가자 코드</strong>를 넣어 주세요.</p>' +
        '<form class="lock-form" autocomplete="off">' +
          '<input class="lock-input" type="password" inputmode="numeric" maxlength="12" ' +
          'placeholder="참가자 코드" aria-label="참가자 코드">' +
          '<button class="lock-btn" type="submit">입장</button>' +
        '</form>' +
        '<p class="lock-msg" role="status"></p>' +
        '<p class="lock-free">지금 볼 수 있는 문서 — ' +
          '<a href="index.html">README · 준비 체크리스트</a></p>' +
      '</div>';

    var form = main.querySelector('.lock-form');
    var input = main.querySelector('.lock-input');
    var msg = main.querySelector('.lock-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value.trim() === PASSCODE) {
        LS.set(PASS_KEY, PASSCODE);
        msg.className = 'lock-msg ok';
        msg.textContent = '확인됐습니다. 문서를 여는 중…';
        setTimeout(function () { location.reload(); }, 400);
      } else {
        msg.className = 'lock-msg bad';
        msg.textContent = '코드가 맞지 않습니다. 진행자에게 물어보세요.';
        input.select();
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
      }
    });
    setTimeout(function () { input.focus(); }, 80);
  }

  /* 열려 있는 문서(index · checklist)에는 "나머지는 당일 공개" 안내를 붙인다 */
  function lockNotice() {
    if (locked || isUnlocked()) return;
    var box = el('div', 'callout warn',
      '<div class="title">🔒 나머지 문서는 워크샵 당일에 열립니다</div>' +
      '<p>템플릿 · STEP 1~3 · 여유 과제 · 에러 해결법은 <strong>' + openDayText() +
      '</strong> 0시에 자동으로 열립니다. 남은 기간 <strong>' + daysLeft() + '일</strong>. ' +
      '먼저 봐야 한다면 잠긴 문서에서 <strong>참가자 코드</strong>를 넣으면 바로 열립니다.</p>');
    var nav = main.querySelector('.pagenav');
    if (nav) main.insertBefore(box, nav); else main.appendChild(box);
  }

  /* 코드로 미리 열어둔 상태라는 걸 본문 맨 위에 알려준다.
     이게 없으면 진행자가 "왜 안 잠겨 있지?" 하고 헷갈립니다 —
     참가자 화면에서는 여전히 잠겨 있는데 내 브라우저에만 코드가 남아 있는 것. */
  function passNotice() {
    if (!hasPass() || isOpenDay()) return;
    var box = el('div', 'callout warn',
      '<div class="title">🔓 참가자 코드로 열어 둔 상태입니다</div>' +
      '<p>이 문서는 원래 <strong>' + openDayText() + ' 0시</strong>에 열립니다(D-' + daysLeft() + '). ' +
      '지금 보이는 건 <strong>이 브라우저에 코드가 저장돼 있기 때문</strong>이고, ' +
      '참가자 화면에서는 아직 잠겨 있습니다. ' +
      '참가자와 같은 화면을 보려면 <button class="inlinebtn" data-cmd="relock">잠금 다시 걸기</button></p>');
    main.insertBefore(box, main.firstChild);
  }

  function relock() {
    LS.del(PASS_KEY);
    location.reload();
  }

  /* 잠금 상태에 따라 문서 목록·팔레트에 붙일 자물쇠 표시 */
  function lockMark(file) {
    return (isGated(file) && !isUnlocked()) ? '<span class="lk" title="워크샵 당일 공개">🔒</span>' : '';
  }

  /* =========================================================
     6. 이벤트 연결
     ========================================================= */

  function wireGlobal() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cmd]');
      if (t) {
        var cmd = t.dataset.cmd;
        if (cmd === 'palette') { e.preventDefault(); openPalette(''); }
        else if (cmd === 'sidebar') { e.preventDefault(); toggleSidebar(); }
        else if (cmd === 'theme') { e.preventDefault(); toggleTheme(); }
        else if (cmd === 'relock') { e.preventDefault(); relock(); }
        return;
      }
      var sh = e.target.closest('.sb-sec-head');
      if (sh) { sh.parentNode.classList.toggle('collapsed'); return; }

      /* 모바일: 서랍 밖을 누르면 문서 목록이 닫힌다 */
      if (ide.classList.contains('sidebar-open') &&
          !e.target.closest('.sidebar') && !e.target.closest('.titlebar')) {
        ide.classList.remove('sidebar-open');
      }
    });

    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); openPalette(''); }
      else if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openPalette('>'); }
      else if (mod && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); toggleSidebar(); }
      else if (e.key === 'Escape') {
        closePalette();
        ide.classList.remove('sidebar-open');
      }
    });

    scroller.addEventListener('scroll', function () {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function () { scrollRaf = 0; onScroll(); });
    }, { passive: true });

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(onScroll, 150);
    });
  }
  var scrollRaf = 0;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 실행 ---------- */
  restorePrefs();
  applyLock();          /* 잠긴 문서면 여기서 본문이 잠금 화면으로 바뀐다 */
  lockNotice();         /* 열린 문서에는 공개 예정 안내를 붙인다 */
  passNotice();         /* 코드로 미리 열어둔 상태면 그 사실을 알려준다 */
  buildTitlebar();
  buildSidebar();
  buildStatus();
  buildOutline();
  wireCopy();
  wireChecks();
  wireGlobal();
  onScroll();

  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { scrollToEl(target); }, 60);
  }

  window.addEventListener('load', onScroll);
})();
