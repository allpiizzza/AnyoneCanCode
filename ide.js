/* =========================================================
   비개발자 웹샵 가이드 사이트 — 에디터 워크벤치 런타임
   모든 문서 페이지가 이 파일 하나를 공유합니다.

   하는 일
   1) 탭바 / 파일 트리 / 개요(아웃라인) / 상태바 생성
   2) 줄번호 거터 · 미니맵 · 빵부스러기(breadcrumb) 스크롤 추적
   3) 명령 팔레트 (Ctrl+P / Ctrl+K) 와 단축키
   4) 하단 패널 (터미널 / 문제 / 출력)
   5) 프롬프트 COPY 버튼, 체크리스트 저장, 테마 전환
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 문서 목록 (사이드바·탭·팔레트 공통 소스) ---------- */
  var FILES = [
    { f: 'index.html',     t: 'README',                  d: '워크샵 개요와 오늘의 흐름' },
    { f: 'checklist.html', t: '준비 체크리스트',          d: '진행자·참가자 사전 준비' },
    { f: 'templates.html', t: '범용 프롬프트 템플릿',     d: '역할·맥락·요청·형식 4칸' },
    { f: 'step1.html',     t: 'STEP 1 · 화면(UI) 만들기', d: '목록·글쓰기·상세보기' },
    { f: 'step2.html',     t: 'STEP 2 · Google Sheets 연동', d: '저장과 불러오기' },
    { f: 'step3.html',     t: 'STEP 3 · GitHub + Vercel 배포', d: '인터넷 주소 만들기' },
    { f: 'extra.html',     t: '여유 시 도전 과제',        d: '답변달기 · 도메인' },
    { f: 'errors.html',    t: '에러 해결법',              d: '콘솔 읽는 법과 패턴표' }
  ];

  /* ---------- 공개 설정 ----------
     index.html · checklist.html 을 뺀 나머지 문서는 워크샵 당일에 열립니다.
     날짜가 지났거나 참가자 코드를 넣으면 열립니다.

     ⚠️ 이건 "커튼"이지 보안이 아닙니다. 정적 사이트라 잠긴 문서의 HTML은
        브라우저 소스 보기나 GitHub 저장소에서 그대로 읽을 수 있습니다.
        워크샵 전에 미리 열어보지 않게 하는 용도로만 쓰세요.        */
  var OPEN_AT = new Date(2026, 7, 30, 0, 0, 0);   // 2026년 8월 30일(일) 0시, 보는 사람의 시간대 기준
  var PASSCODE = '1021';
  var FREE = ['index.html', 'checklist.html'];    // 언제나 열려 있는 문서

  var SCHEDULE = [
    ['15분', '완성본 시연 + 개념 설명', 'index.html'],
    ['20분', '계정 생성 (Replit · GitHub · Vercel)', 'checklist.html'],
    ['45분', 'AI 프롬프트로 화면 만들기', 'step1.html'],
    ['30분', 'Google Sheets 연동', 'step2.html'],
    ['20분', 'GitHub + Vercel 배포', 'step3.html'],
    ['나머지', '자유 커스터마이징 · Q&A', 'extra.html']
  ];

  var ICON = {
    explorer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h7A1.5 1.5 0 0 1 19 9v8.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5z"/></svg>',
    search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.6 14.6 20 20"/></svg>',
    run:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 4.5 18 12 6 19.5z"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.5 9 12l-5 5.5"/><path d="M12 18h8"/></svg>',
    theme:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15" /><path d="M12 6.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none"/></svg>',
    layout:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M9.5 5v14"/></svg>',
    panel:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 14.5h17"/></svg>'
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

  /* --- 타이틀바 --- */
  function buildTitlebar() {
    var bar = document.querySelector('.titlebar');
    bar.innerHTML =
      '<div class="dots"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i></div>' +
      '<nav class="menu"><span>파일</span><span>편집</span><span>선택</span><span>보기</span><span>이동</span><span>도움말</span></nav>' +
      '<button class="qopen" data-cmd="palette">workshop — ' + esc(meta.t) + ' <kbd>Ctrl</kbd><kbd>P</kbd></button>' +
      '<div class="win-actions">' +
        '<button class="iconbtn" data-cmd="sidebar" title="사이드바 토글 (Ctrl+B)">' + ICON.layout + '</button>' +
        '<button class="iconbtn" data-cmd="panel" title="패널 토글 (Ctrl+J)">' + ICON.panel + '</button>' +
        '<button class="iconbtn" data-cmd="theme" title="테마 전환">' + ICON.theme + '</button>' +
      '</div>';
  }

  /* --- 액티비티바 --- */
  function buildActivitybar() {
    var bar = document.querySelector('.activitybar');
    var explorerOn = !ide.classList.contains('sidebar-hidden');
    bar.innerHTML =
      '<button class="act' + (explorerOn ? ' active' : '') + '" data-cmd="sidebar" title="탐색기 (Ctrl+B)">' + ICON.explorer + '</button>' +
      '<button class="act" data-cmd="palette" title="파일 검색 (Ctrl+P)">' + ICON.search + '</button>' +
      '<button class="act" data-cmd="panel" title="터미널 (Ctrl+J)">' + ICON.terminal + '</button>' +
      '<a class="act" href="sample/index.html" target="_blank" rel="noopener" title="완성본 데모 실행">' + ICON.run + '<span class="dotmark"></span></a>' +
      '<span class="spacer"></span>' +
      '<button class="act" data-cmd="theme" title="테마 전환">' + ICON.theme + '</button>';
  }

  /* --- 사이드바 --- */
  function buildSidebar() {
    var sb = document.querySelector('.sidebar');
    var open =
      '<div class="tree">' +
        row(meta.f, meta.f, true, false) +
        '<a href="sample/index.html" target="_blank" rel="noopener"><span class="ic">◆</span>완성본 데모<span class="ext">↗</span></a>' +
      '</div>';

    var tree = '<div class="tree">';
    FILES.forEach(function (x) {
      tree += row(x.f, x.f, x.f === current, false);
    });
    tree += row('style.css', 'style.css', false, true);
    tree += row('ide.js', 'ide.js', false, true);
    tree += '</div>';

    var demo =
      '<div class="tree">' +
        '<a href="sample/index.html" target="_blank" rel="noopener"><span class="ic">◆</span>index.html<span class="ext">↗</span></a>' +
        '<a href="sample/write.html" target="_blank" rel="noopener"><span class="ic">◆</span>write.html<span class="ext">↗</span></a>' +
        '<a href="sample/detail.html" target="_blank" rel="noopener"><span class="ic">◆</span>detail.html<span class="ext">↗</span></a>' +
      '</div>';

    sb.innerHTML =
      '<div class="sb-head">탐색기<button class="sb-close" data-cmd="sidebar" title="닫기">✕</button></div>' +
      sec('열린 편집기', open, false, '2') +
      sec('WORKSHOP', tree, false, String(FILES.length + 2)) +
      sec('SAMPLE', demo, true, '3') +
      '<section class="sb-sec" id="outlineSec">' +
        '<button class="sb-sec-head"><span class="caret">▼</span>개요<span class="count" id="outlineCount"></span></button>' +
        '<div class="tree outline" id="outline"></div>' +
      '</section>';

    function sec(name, body, collapsed, count) {
      return '<section class="sb-sec' + (collapsed ? ' collapsed' : '') + '">' +
        '<button class="sb-sec-head"><span class="caret">▼</span>' + name +
        '<span class="count">' + count + '</span></button>' + body + '</section>';
    }
    function row(href, label, active, isAsset) {
      var cls = /\.css$/.test(label) ? ' css' : '';
      return '<a href="' + href + '"' + (active ? ' class="active"' : '') + '>' +
        '<span class="ic' + cls + '">◆</span>' + esc(label) + (isAsset ? '' : lockMark(href)) +
        (isAsset ? '<span class="ext">' + (/\.css$/.test(label) ? 'CSS' : 'JS') + '</span>' : '') +
        '</a>';
    }
  }

  /* --- 탭바 --- */
  function buildTabs() {
    var tb = document.querySelector('.tabbar');
    var html = '';
    FILES.forEach(function (x) {
      html += '<a class="tab' + (x.f === current ? ' active' : '') + '" href="' + x.f + '" title="' + esc(x.t) + '">' +
        '<span class="ic">◆</span>' + x.f + lockMark(x.f) + '<span class="x">✕</span></a>';
    });
    tb.innerHTML = html;
    var active = tb.querySelector('.tab.active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* --- 빵부스러기 --- */
  function buildCrumbs() {
    var bc = document.querySelector('.breadcrumb');
    bc.innerHTML =
      '<span>workshop</span><i>›</i>' +
      '<span class="path">' + esc(meta.f) + '</span><i>›</i>' +
      '<span class="cur" id="crumbSection">' + esc(meta.t) + '</span>';
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
      '<button class="si" data-cmd="problems" title="문제 패널 열기">⊗ 0 &nbsp;⚠ 0</button>' +
      gate +
      '<span class="si hide-sm" id="stProgress"></span>' +
      '<span class="si right" id="stCursor">Ln 1, Col 1</span>' +
      '<span class="si hide-sm">UTF-8</span>' +
      '<span class="si hide-sm">LF</span>' +
      '<span class="si hide-sm">Markdown</span>' +
      '<button class="si" data-cmd="theme" title="테마 전환">◐</button>' +
      '<button class="si" data-cmd="palette" title="명령 팔레트">⌘ Ctrl+P</button>';
    var prog = document.getElementById('stProgress');
    if (pageIndex >= 0) prog.textContent = '문서 ' + (pageIndex + 1) + '/' + FILES.length;
  }

  /* --- 하단 패널 --- */
  function buildPanel() {
    var dock = document.querySelector('.panel-dock');
    var termLines =
      line('workshop', 'npx serve .', true) +
      '<div class="ln"><span class="ok">✔</span> <span class="dim">가이드 사이트 실행 중 · http://localhost:8899/</span></div>' +
      line('workshop', 'open ' + meta.f, true) +
      (locked
        ? '<div class="ln"><span class="warnc">✖</span> permission denied — ' +
          '<span class="dim">' + openDayText() + ' 0시 공개 (D-' + daysLeft() + ')</span></div>' +
          line('workshop', 'unlock --code ••••', true)
        : '<div class="ln"><span class="path">▸</span> ' + esc(meta.t) +
          (meta.d ? ' <span class="dim">— ' + esc(meta.d) + '</span>' : '') + '</div>') +
      '<div class="ln"><span class="pr">workshop</span> <span class="dim">$</span> <span class="caret-blink"></span></div>';

    var problems = locked
      ? '<div class="ln"><span class="warnc">🔒</span> 이 문서는 아직 잠겨 있습니다 — ' +
        openDayText() + ' 0시 공개, 남은 기간 <strong>' + daysLeft() + '일</strong>.</div>' +
        '<div class="ln dim">지금 볼 수 있는 문서 — <a href="index.html">index.html</a> · ' +
        '<a href="checklist.html">checklist.html</a></div>'
      : '<div class="ln"><span class="ok">✔</span> 이 문서에서 발견된 문제 <strong>0개</strong>.</div>' +
        '<div class="ln dim">화면에 에러가 났다면 브라우저 콘솔부터 보세요 — ' +
        '<a href="errors.html">errors.html</a> 에 콘솔 여는 법과 증상별 원인표가 있습니다.</div>';

    var out = '<div class="ln dim">[워크샵 타임라인]</div>';
    SCHEDULE.forEach(function (s) {
      var hit = s[2] === current;
      out += '<div class="ln' + (hit ? '' : ' dim') + '">' +
        (hit ? '<span class="ok">▸</span> ' : '<span class="dim">·</span> ') +
        '<span class="warnc">' + s[0] + '</span>  ' + esc(s[1]) +
        (hit ? '  <span class="ok">← 지금 이 문서</span>' : '') + '</div>';
    });

    dock.innerHTML =
      '<div class="panel-tabs">' +
        '<button class="ptab active" data-p="terminal">터미널</button>' +
        '<button class="ptab" data-p="problems">문제 <span class="cnt">0</span></button>' +
        '<button class="ptab" data-p="output">출력</button>' +
        '<span class="sp"></span>' +
        '<button class="iconbtn" data-cmd="panel" title="패널 닫기 (Ctrl+J)">✕</button>' +
      '</div>' +
      '<div class="panel-body">' +
        '<div class="pview active" data-p="terminal">' + termLines + '</div>' +
        '<div class="pview" data-p="problems">' + problems + '</div>' +
        '<div class="pview" data-p="output">' + out + '</div>' +
      '</div>';

    function line(prompt, cmd) {
      return '<div class="ln"><span class="pr">' + prompt + '</span> <span class="dim">$</span> <span class="cm">' + esc(cmd) + '</span></div>';
    }
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

  function buildGutter() {
    var g = document.querySelector('.gutter');
    if (!g) return;
    var lineH = 26;
    var n = Math.ceil(main.scrollHeight / lineH) + 2;
    var buf = [];
    for (var i = 1; i <= n; i++) buf.push(i);
    g.textContent = buf.join('\n');
  }

  var mmScale = 0.1;
  function buildMinimap() {
    var mm = document.querySelector('.minimap');
    var inner = document.querySelector('.mm-inner');
    if (!mm || !inner || !mm.offsetHeight) return;
    var contentH = main.scrollHeight;
    var viewH = scroller.clientHeight;
    mmScale = Math.min((mm.clientHeight - 14) / contentH, 0.16);
    var html = '';
    [].slice.call(main.children).forEach(function (node) {
      var tag = node.tagName.toLowerCase();
      var cls = 'p', w = 100;
      if (tag === 'h1') { cls = 'h1'; w = 62; }
      else if (tag === 'h2') { cls = 'h2'; w = 74; }
      else if (tag === 'h3') { cls = 'h3'; w = 56; }
      else if (node.querySelector('pre') || tag === 'pre') { cls = 'code'; w = 92; }
      var top = node.offsetTop * mmScale;
      var h = Math.max(2, node.offsetHeight * mmScale - 1);
      html += '<div class="mm-row ' + cls + '" style="position:absolute;top:' + top.toFixed(1) +
        'px;height:' + h.toFixed(1) + 'px;width:' + w + '%"></div>';
    });
    inner.innerHTML = html;
    var view = document.querySelector('.mm-view');
    view.style.height = Math.max(14, viewH * mmScale) + 'px';
    syncMinimap();

    mm.onclick = function (e) {
      var r = mm.getBoundingClientRect();
      var y = e.clientY - r.top - 6;
      scroller.scrollTo({ top: Math.max(0, y / mmScale - viewH / 2), behavior: 'smooth' });
    };
  }

  function syncMinimap() {
    var view = document.querySelector('.mm-view');
    if (view) view.style.top = (6 + scroller.scrollTop * mmScale) + 'px';
  }

  /* 스크롤에 따라 개요 강조 · 빵부스러기 · Ln 갱신 */
  function onScroll() {
    var top = scroller.scrollTop;
    var crumb = document.getElementById('crumbSection');
    var links = document.querySelectorAll('#outline a');
    var cur = -1;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].offsetTop - 60 <= top) cur = i; else break;
    }
    links.forEach(function (a, i) { a.classList.toggle('current', i === cur); });
    if (crumb) crumb.textContent = cur >= 0 ? headings[cur].textContent : meta.t;
    var cursor = document.getElementById('stCursor');
    if (cursor) cursor.textContent = 'Ln ' + (Math.floor(top / 26) + 1) + ', Col 1';
    syncMinimap();
  }

  /* =========================================================
     3. 명령 팔레트
     ========================================================= */

  var COMMANDS = [
    { t: '사이드바 토글', d: 'Ctrl+B', run: function () { toggleSidebar(); } },
    { t: '패널 토글 (터미널)', d: 'Ctrl+J', run: function () { togglePanel(); } },
    { t: '테마 전환 (다크 / 라이트)', d: '', run: function () { toggleTheme(); } },
    { t: '완성본 데모 열기', d: '새 탭', run: function () { window.open('sample/index.html', '_blank', 'noopener'); } },
    { t: '맨 위로 이동', d: '', run: function () { scroller.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { t: '체크리스트 기록 초기화', d: 'checklist', run: function () { resetChecks(); } },
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
      requestAnimationFrame(buildMinimap);
    }
    var explorer = document.querySelector('.activitybar .act[data-cmd="sidebar"]');
    if (explorer) explorer.classList.toggle('active', !ide.classList.contains('sidebar-hidden'));
  }

  function togglePanel() {
    ide.classList.toggle('panel-hidden');
    LS.set('ide_panel', ide.classList.contains('panel-hidden') ? 'off' : 'on');
    requestAnimationFrame(function () { buildMinimap(); onScroll(); });
  }

  function showPanel(which) {
    ide.classList.remove('panel-hidden');
    LS.set('ide_panel', 'on');
    document.querySelectorAll('.ptab').forEach(function (b) { b.classList.toggle('active', b.dataset.p === which); });
    document.querySelectorAll('.pview').forEach(function (v) { v.classList.toggle('active', v.dataset.p === which); });
  }

  function toggleTheme() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    if (light) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'light');
    LS.set('ide_theme', light ? 'dark' : 'light');
    requestAnimationFrame(buildMinimap);
  }

  function restorePrefs() {
    if (LS.get('ide_theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
    if (LS.get('ide_sidebar') === 'off') ide.classList.add('sidebar-hidden');
    if (LS.get('ide_panel') === 'off') ide.classList.add('panel-hidden');
  }

  /* --- 프롬프트 복사 --- */
  function wireCopy() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pre = btn.closest('.term').querySelector('pre');
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

  /* --- 체크리스트 (진행 상태를 브라우저에 저장) --- */
  var CHECK_KEY = 'ide_checks_' + current;

  function wireChecks() {
    var checks = [].slice.call(document.querySelectorAll('.check'));
    if (!checks.length) return;
    var saved = (LS.get(CHECK_KEY) || '').split(',');
    checks.forEach(function (c, i) {
      if (saved.indexOf(String(i)) >= 0) c.classList.add('done');
      c.addEventListener('click', function () {
        c.classList.toggle('done');
        saveChecks(checks);
        paintProgress(checks);
      });
    });
    paintProgress(checks);
  }

  function saveChecks(checks) {
    var on = [];
    checks.forEach(function (c, i) { if (c.classList.contains('done')) on.push(i); });
    LS.set(CHECK_KEY, on.join(','));
  }

  function paintProgress(checks) {
    var done = document.querySelectorAll('.check.done').length;
    var prog = document.getElementById('stProgress');
    if (prog) prog.textContent = '체크리스트 ' + done + '/' + checks.length;
    var pv = document.querySelector('.pview[data-p="problems"]');
    if (pv) {
      var left = checks.length - done;
      pv.innerHTML = left
        ? '<div class="ln"><span class="warnc">⚠</span> 아직 체크하지 않은 항목 <strong>' + left + '개</strong>가 남아 있습니다.</div>' +
          '<div class="ln dim">항목을 클릭하면 취소선이 그어지고, 이 브라우저에 기록이 남습니다.</div>'
        : '<div class="ln"><span class="ok">✔</span> 준비 완료 — 모든 항목을 체크했습니다.</div>';
    }
    var cnt = document.querySelector('.ptab[data-p="problems"] .cnt');
    if (cnt) cnt.textContent = String(checks.length - done);
    var stp = document.querySelector('.statusbar [data-cmd="problems"]');
    if (stp) stp.innerHTML = '⊗ 0 &nbsp;⚠ ' + (checks.length - done);
  }

  function resetChecks() {
    LS.del(CHECK_KEY);
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
          '<a href="index.html">README</a> · <a href="checklist.html">준비 체크리스트</a></p>' +
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

  function relock() {
    LS.del(PASS_KEY);
    location.reload();
  }

  /* 잠금 상태에 따라 탭·트리·팔레트에 붙일 자물쇠 표시 */
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
        else if (cmd === 'panel') { e.preventDefault(); togglePanel(); }
        else if (cmd === 'theme') { e.preventDefault(); toggleTheme(); }
        else if (cmd === 'problems') { e.preventDefault(); showPanel('problems'); }
        else if (cmd === 'relock') { e.preventDefault(); relock(); }
        return;
      }
      var pt = e.target.closest('.ptab');
      if (pt) { showPanel(pt.dataset.p); return; }
      var sh = e.target.closest('.sb-sec-head');
      if (sh) { sh.parentNode.classList.toggle('collapsed'); return; }

      /* 모바일: 서랍 밖을 누르면 탐색기가 닫힌다 */
      if (ide.classList.contains('sidebar-open') &&
          !e.target.closest('.sidebar') && !e.target.closest('.activitybar')) {
        ide.classList.remove('sidebar-open');
      }
    });

    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); openPalette(''); }
      else if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openPalette('>'); }
      else if (mod && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); toggleSidebar(); }
      else if (mod && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); togglePanel(); }
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
      t = setTimeout(function () { buildGutter(); buildMinimap(); onScroll(); }, 150);
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
  buildTitlebar();
  buildActivitybar();
  buildSidebar();
  buildTabs();
  buildCrumbs();
  buildStatus();
  buildPanel();
  buildOutline();
  wireCopy();
  wireChecks();
  wireGlobal();
  buildGutter();
  buildMinimap();
  onScroll();

  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { scrollToEl(target); }, 60);
  }

  window.addEventListener('load', function () {
    buildGutter();
    buildMinimap();
    onScroll();
  });
})();
