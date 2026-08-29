/* =========================================================
   완성본 데모 — 데이터 저장소

   Google Apps Script 웹앱을 통해 스프레드시트를 읽고 씁니다.
   세 화면(index · write · detail)이 이 파일 하나를 함께 씁니다.

   ⚠ 웹앱이 응답하지 않아도 화면은 뜹니다.
      시연 도중 인터넷이나 배포가 말썽이면 예시 데이터로 대신 채우고
      위쪽에 안내 띠를 보여줍니다. 데모가 멈추는 것보다 낫습니다.
   ========================================================= */

/* 내 Apps Script 웹앱 주소 — 여기만 바꾸면 세 화면이 다 따라옵니다 */
var API_URL = 'https://script.google.com/macros/s/AKfycbwrBuG9EZ__DHTjWvoh4RaSEHlRi_1kpU-WtPlHKVET_6ttJM0kk9tgp6XX3x_2wFx4JA/exec';

/* 웹앱이 막혔을 때 보여줄 예시 데이터 */
var SEED = [
  { id: 3, title: "아몬드 — 다시 읽어도 좋은 책", author: "정하늘", date: "2026-08-08", content: "두 번째로 읽었는데 처음 읽을 때랑 느낌이 또 다르더라고요.\n\n윤재가 감정을 배워가는 과정을 곱씹으면서 읽으니, 우리가 당연하게 여기는 '공감'이라는 게 사실 얼마나 배워야 하는 건지 새삼 느꼈어요.\n\n다음에 만나면 이 책으로 한참 얘기할 수 있을 것 같습니다." },
  { id: 2, title: "불편한 편의점, 생각보다 뭉클했어요", author: "김서준", date: "2026-08-03", content: "가볍게 읽을 수 있는 책일 줄 알았는데 마지막 장 덮고 나서 한참 여운이 남았어요.\n\n특히 독고 아저씨가 사람들을 바라보는 시선이 좋았습니다. 편의점이라는 공간이 이렇게 따뜻하게 그려질 수 있구나 싶었어요." },
  { id: 1, title: "소설가의 여행법, 절반 읽고 남기는 중간 후기", author: "모임지기", date: "2026-07-28", content: "아직 다 못 읽었는데 문장이 너무 좋아서 먼저 남겨봅니다.\n\n여행지 묘사보다 작가가 그 안에서 스쳐가는 생각들을 붙잡아두는 방식이 인상적이에요. 완독하면 후기 다시 남길게요!" }
];

/* ---------- 공통 도구 ---------- */

function escapeHtml(s) {
  var d = document.createElement('div');
  d.innerText = s == null ? '' : String(s);
  return d.innerHTML;
}

function fmtDate(v) {
  if (!v) return '';
  var s = String(v);

  /* 이미 YYYY-MM-DD 면 그대로 */
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  /* 시트가 ISO(2026-08-29T15:00:00.000Z)로 돌려주는 경우.
     글자만 잘라 쓰면 한국 시간 기준으로 하루 전 날짜가 나옵니다
     (한국의 8월 30일 0시 = UTC 8월 29일 15시). 그래서 현지 시각으로 바꿔서 씁니다. */
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    var mm = String(d.getMonth() + 1);
    var dd = String(d.getDate());
    return d.getFullYear() + '-' +
      (mm.length < 2 ? '0' + mm : mm) + '-' +
      (dd.length < 2 ? '0' + dd : dd);
  }
  return s;
}

/* 응답 생김새가 조금씩 달라도 같은 모양으로 맞춥니다.
   {ok, posts:[...]} / [{...}] / [[제목,작성자,작성일,내용], ...] 모두 받습니다. */
function normalize(raw) {
  var arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && Array.isArray(raw.posts)) arr = raw.posts;
  else if (raw && Array.isArray(raw.data)) arr = raw.data;
  else return [];

  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var r = arr[i], p;
    if (Array.isArray(r)) {
      p = { title: r[0], author: r[1], date: r[2], content: r[3] };
    } else if (r && typeof r === 'object') {
      p = {
        id: r.id,
        title: r.title != null ? r.title : r['제목'],
        author: r.author != null ? r.author : r['작성자'],
        date: r.date != null ? r.date : (r['작성일'] != null ? r['작성일'] : r['날짜']),
        content: r.content != null ? r.content : r['내용']
      };
    } else {
      continue;
    }
    if (!p.title) continue;                 /* 빈 줄 건너뛰기 */
    if (p.id == null) p.id = i + 1;         /* id가 없으면 순번으로 */
    p.date = fmtDate(p.date);
    out.push(p);
  }
  return out;
}

/* ---------- 불러오기 ---------- */

/* 성공하면 {posts, offline:false}, 실패하면 {posts:예시, offline:true, reason} */
function loadPosts() {
  return fetch(API_URL, { method: 'GET' })
    .then(function (r) { return r.text(); })
    .then(function (text) {
      var raw;
      try {
        raw = JSON.parse(text);
      } catch (e) {
        /* 로그인 페이지(HTML)가 돌아온 경우 — 배포 접근 권한이 "모든 사용자"가 아닙니다 */
        throw new Error('웹앱이 JSON 대신 다른 응답을 보냈습니다. 배포 접근 권한을 확인하세요.');
      }
      if (raw && raw.ok === false) throw new Error(raw.error || '웹앱이 실패를 알려왔습니다.');
      var posts = normalize(raw);
      return { posts: posts, offline: false };
    })
    .catch(function (err) {
      return { posts: SEED.slice(), offline: true, reason: String(err.message || err) };
    });
}

function findPost(id) {
  return loadPosts().then(function (res) {
    var hit = null;
    for (var i = 0; i < res.posts.length; i++) {
      if (String(res.posts[i].id) === String(id)) { hit = res.posts[i]; break; }
    }
    return { post: hit, offline: res.offline };
  });
}

/* ---------- 저장하기 ---------- */

/* Content-Type을 text/plain으로 보냅니다.
   application/json이면 브라우저가 미리 허락을 구하는 요청(OPTIONS)을 보내는데,
   Apps Script 웹앱은 거기에 답하지 못해 CORS 오류로 막힙니다. */
function savePost(data) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data)
  })
    .then(function (r) { return r.text(); })
    .then(function (text) {
      var raw;
      try {
        raw = JSON.parse(text);
      } catch (e) {
        throw new Error('웹앱이 JSON 대신 다른 응답을 보냈습니다. 배포 접근 권한을 확인하세요.');
      }
      if (raw && raw.ok === false) throw new Error(raw.error || '저장에 실패했습니다.');
      return { ok: true };
    });
}

/* ---------- 예시 데이터로 대신 채웠을 때 띄우는 안내 띠 ---------- */

function showOfflineBanner(reason) {
  if (document.querySelector('.offline-note')) return;
  var box = document.createElement('div');
  box.className = 'offline-note';
  box.innerHTML =
    '<strong>지금은 예시 데이터를 보여주는 중이에요.</strong> ' +
    '스프레드시트에 연결하지 못했습니다. 글을 남겨도 저장되지 않습니다.' +
    (reason ? '<span class="why">' + escapeHtml(reason) + '</span>' : '');
  var header = document.querySelector('.site-header');
  if (header && header.parentNode) header.parentNode.insertBefore(box, header.nextSibling);
  else document.body.insertBefore(box, document.body.firstChild);
}
