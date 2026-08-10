# AnyoneCanCode — 비개발자 웹사이트 워크샵

한 저장소에 **정적 HTML 사이트 2개**가 들어 있습니다. 프레임워크·빌드 도구·백엔드 없이 순수 HTML/CSS/JS로만 되어 있습니다.

| 경로 | 정체 | 성격 |
|---|---|---|
| `/` | 워크샵 진행용 가이드 문서 사이트 | VSCode 다크테마 |
| `/sample/` | 참가자에게 보여줄 "완성본 예시" 데모 | 버건디+크림 따뜻한 톤 |

저장소 루트를 그대로 GitHub Pages / Vercel에 올리면 `/`가 가이드, `/sample/`이 데모가 됩니다. 빌드 설정 없음.

> **이 문서의 용도** — 이 저장소를 이어서 작업하는 사람(또는 Claude)이 읽는 사양서 겸 프롬프트입니다. 왜 이렇게 만들었는지와, 고칠 때 깨뜨리면 안 되는 것들을 담았습니다.

---

## 폴더 구조

```
저장소 루트/
├── index.html          ← 가이드 메인 (README)
├── checklist.html      ← 준비 체크리스트
├── templates.html      ← 범용 프롬프트 템플릿
├── step1.html          ← 화면(UI) 만들기
├── step2.html          ← Google Sheets 연동
├── step3.html          ← GitHub + Vercel 배포
├── extra.html          ← 여유 시 도전 과제
├── errors.html         ← 에러 해결법
├── style.css           ← 가이드 전용 스타일시트
├── README.md           ← 이 파일
└── sample/
    ├── index.html      ← 완성본 데모 메인 (타임라인 목록)
    ├── write.html      ← 후기 쓰기
    ├── detail.html     ← 상세보기
    └── style.css       ← 데모 전용 스타일시트
```

두 사이트의 `style.css`는 **완전히 별개**입니다. 같은 폴더의 것을 `<link rel="stylesheet" href="style.css">`로 참조합니다.

---

## 공통 규칙 (깨뜨리지 말 것)

- **인라인 스타일 금지.** 모든 CSS는 `style.css` 파일로 분리. `<style>` 블록도 쓰지 않음
- **프레임워크 금지.** React·번들러·npm 없음. 브라우저에서 파일을 바로 열어도 동작해야 함
- **전 페이지 한국어**, 반응형 (모바일에서 사이드바·그리드가 스택)
- 구글 폰트는 각 `style.css` 최상단 `@import`로 로드
- **localStorage는 `sample/`에서만** 사용. 가이드 사이트는 저장 기능 없음
- JS는 각 HTML 하단 `<script>`에 인라인 (별도 .js 파일 없음)
- 프롬프트 복사는 `navigator.clipboard.writeText()` + textarea 폴백

---

## 사이트 1 — 워크샵 가이드 (루트)

### 컨셉

VSCode 같은 코드 에디터 화면을 흉내낸 다크테마. 좌측 파일 탐색기(Explorer), 상단 탭바, 각 프롬프트는 터미널 창(맥 신호등 도트 + 파일명 + COPY 버튼) 스타일.

### 디자인 토큰 (`style.css`)

```css
--bg:#0b0d10;        --panel:#111317;    --panel-2:#14171c;
--sidebar:#0d0f13;   --border:#22262c;
--text:#d4d8dd;      --text-dim:#7d8590; --text-faint:#565d68;
--blue:#569cd6;      --green:#6a9955;    --green-bright:#3ddc84;
--orange:#ce9178;    --purple:#c586c0;   --yellow:#dcdcaa;
--red:#f14c4c;       --cyan:#4ec9b0;
```

폰트: 헤딩/코드/라벨 `JetBrains Mono`, 본문 `IBM Plex Sans KR`.

### 페이지 공통 구조

모든 페이지가 아래 뼈대를 그대로 반복합니다. 페이지를 추가할 때도 이 순서를 지킵니다.

```
.titlebar   맥 신호등 도트 3개 + 파일 경로
.tabbar     README.md 탭 + 현재 파일 탭(.active)
.shell      grid 236px + 1fr
 ├ .sidebar  Explorer 파일 목록, 현재 페이지에 .active (파란 강조)
 └ .main     본문 (max-width 900px)
.statusbar  화면 하단 고정, 파란 배경, "⎇ main" · 파일명 · 워크샵명
```

### 주요 CSS 클래스

| 클래스 | 용도 |
|---|---|
| `.term` | 프롬프트 박스. `.term-bar`(신호등+파일명+`.copy-btn`) + `<pre>` |
| `.copy-btn` | 클릭 시 텍스트 복사, "복사됨 ✓"로 1.5초 변경 후 원복 |
| `.callout` | 기본(파랑) / `.warn`(노랑) / `.danger`(빨강) / `.tip`(초록) |
| `.steps` > `.step` | 번호 원형 아이콘 + 세로 연결선이 있는 단계별 가이드 |
| `.check` | 체크리스트 항목. 클릭하면 `.done` 토글 → 취소선 |
| `.cta` | 완성본 데모로 보내는 파란 강조 카드 (index 전용) |
| `.meta-grid` / `.meta-card` | 대상·시간·장소·비용 요약 |
| `.pagenav` | 페이지 하단 이전/다음 문서 이동 |
| `.badge` | `.blue` / `.green` / `.purple` 변형 |

`h1`은 `#`, `h2`는 `##`, `.subtitle`은 `//` 접두사를 CSS `::before`로 붙입니다. 마크다운 문서를 보는 느낌을 내기 위한 장치라 HTML에 직접 쓰지 마세요.

### 페이지별 내용

**index.html** — 히어로("오늘, 우리 동네 게시판을 함께 설계하고 붙입니다" 톤) / 대상·시간·장소·비용 / 오늘의 흐름 표 / 완성본 데모 CTA / "세 단어만 기억하세요"(프론트엔드·백엔드·배포)

오늘의 흐름:

| 시간 | 내용 |
|---|---|
| 15분 | 완성본 시연 + 개념 설명 (프론트/백/배포란?) |
| 20분 | 계정 생성 (Replit, GitHub, Vercel) |
| 45분 | AI 프롬프트로 목록 · 글쓰기 · 상세보기 화면 만들기 |
| 30분 | Google Sheets 연동 (저장 / 불러오기) |
| 20분 | GitHub + Vercel 배포 → 실제 URL 접속 |
| 나머지 | 자유 커스터마이징 · Q&A · (여유 시) 답변달기, 도메인 연결 |

**checklist.html** — 클릭 시 취소선이 그어지는 체크박스 4그룹(총 22개): ① 진행자 사전 준비 7 ② 참가자 사전 공지 6 ③ 당일 계정 세팅 순서 4 ④ 당일 준비물 5. 하단에 체크포인트 타이밍 콜아웃(계정생성→화면완료→Sheets연동→배포 4회 확인).

**templates.html** — 역할·상황/맥락·요청·형식 4단계 빈칸 템플릿 + 각 칸의 의미 표 + 채워 넣은 예시.

**step1.html / step2.html / extra.html / errors.html** — 아래 프롬프트 원문이 `.term` 박스에 들어갑니다. **한 글자도 바꾸지 마세요.** 워크샵에서 참가자가 그대로 복붙하는 자산입니다.

**step3.html** — 유일하게 AI 프롬프트가 아닌 페이지. "🎤 진행자가 직접 설명" 뱃지 + 번호 단계 5개(GitHub 저장소 생성 → Replit에서 Push → Vercel 로그인 → New Project/Deploy → `프로젝트명.vercel.app` 확인) + GitHub 권한 승인 팝업 경고.

**errors.html** — 콘솔 여는 법(맥 `Cmd+Option+I` / 윈도우 `F12`·`Ctrl+Shift+I`) → Console 탭, "빨간 글씨 = 에러" 원칙, 에러 해결 프롬프트, 진행자용 패턴 매칭표:

| 콘솔 증상 | 원인 |
|---|---|
| Failed to fetch / CORS 에러 | Apps Script 웹앱 URL 오류 또는 액세스 권한 미설정 |
| 데이터 안 불러와지는데 에러도 없음 | Sheets 컬럼 순서와 코드 참조 순서 불일치 |
| Uncaught SyntaxError | 코드 복붙 중 일부 누락 |
| 배포됐는데 화면 하얗게 뜸 | 파일 경로(html/js/css) 오류 |

### 프롬프트 원문 (수정 금지)

<details>
<summary><b>templates.html — 빈칸 템플릿</b></summary>

```
[역할] 너는 ○○ 전문가야.

[상황/맥락] 나는 지금 ○○을 만들고 있어. 현재 상태는 이래:
(있으면 코드 / 에러 / 화면 상태 붙여넣기)

[요청] 내가 원하는 건 ○○이야. 구체적으로는 (기능/조건)을 해줘.

[형식] 결과는 ○○ 형태로 줘. (예: 전체 코드 파일로 / 단계별 설명으로 / 표로)
```
</details>

<details>
<summary><b>step1.html — 화면(UI) 만들기</b></summary>

```
HTML, CSS, JavaScript로 간단한 게시판 웹사이트를 만들어줘.

기능은 다음과 같아:

1. 목록 페이지 (index.html)
   - 게시글 제목, 작성자, 작성일을 카드 형태로 나열
   - 각 카드를 클릭하면 상세 페이지로 이동

2. 글쓰기 페이지 (write.html)
   - 제목, 작성자, 내용을 입력하는 폼
   - "등록" 버튼

3. 상세보기 페이지 (detail.html)
   - 선택한 글의 제목, 작성자, 작성일, 내용을 보여줌

디자인은 깔끔하고 따뜻한 느낌으로, 파스텔톤 색상을 사용해줘.

지금은 데이터 저장 없이 화면 디자인만 먼저 만들어줘.
더미 데이터(예시 글 2~3개)를 넣어서 화면이 어떻게 보이는지 확인할 수 있게 해줘.
```
</details>

<details>
<summary><b>step2.html — Google Sheets 연동</b></summary>

```
방금 만든 게시판 웹사이트에 Google Sheets를 데이터베이스처럼 연결하고 싶어.

Google Apps Script로 웹앱을 배포해서 API처럼 사용할 방법을 알려주고,
아래 기능이 동작하도록 코드를 수정해줘:

1. 글쓰기 페이지에서 "등록" 버튼을 누르면
   → Google Sheets에 새로운 행으로 데이터(제목, 작성자, 작성일, 내용)가 저장되게 해줘

2. 목록 페이지를 열면
   → Google Sheets에 저장된 모든 글을 불러와서 카드 형태로 보여줘

3. 상세보기 페이지에서
   → 선택한 글의 전체 내용을 Sheets에서 불러와서 보여줘

시트 컬럼 구조는 [제목, 작성자, 작성일, 내용] 순서로 만들 거야.

Apps Script 코드와, 프론트엔드에서 그 API를 호출하는 코드를 각각 알려줘.
```
</details>

<details>
<summary><b>extra.html — 답변달기(1:1)</b></summary>

```
게시판에 "답변달기" 기능을 추가하고 싶어. 댓글처럼 여러 개가 아니라
글 하나에 답변 하나만 달리는 1:1 방식이야 (Q&A 게시판처럼).

Google Sheets 컬럼에 "답변"을 하나 추가할 거야.

상세보기 페이지에 답변 입력창과 "답변 등록" 버튼을 추가해서,
등록하면 해당 글이 있는 행의 "답변" 컬럼에 저장되게 해줘.

이미 답변이 있으면 상세보기 페이지에 답변 내용도 함께 보여줘.
```
</details>

<details>
<summary><b>extra.html — 한글 도메인 연결</b></summary>

```
Vercel에 배포한 사이트에 내도메인.한국에서 발급받은 한글 도메인을 연결하고 싶어.

Vercel 프로젝트 설정에서 커스텀 도메인을 추가하는 방법과,
내도메인.한국에서 DNS 설정을 어떻게 해야 하는지
단계별로 아주 쉽게 설명해줘.
```
</details>

<details>
<summary><b>errors.html — 에러 해결</b></summary>

```
[상황/맥락] 나는 (무엇을 하려고 했는지)를 하고 있었는데 이런 에러가 떴어:

(콘솔에서 복사한 에러 메시지 붙여넣기)

내 코드는 이거야:

(관련 코드 파일 내용 붙여넣기)

[요청] 원인이 뭔지 알려주고, 어떻게 고쳐야 할지 알려줘.

[형식] 수정된 전체 코드로 다시 줘. 어디를 왜 고쳤는지도 짧게 설명해줘.
```
</details>

---

## 사이트 2 — 완성본 데모 "책후기 게시판" (`sample/`)

### 컨셉

독서모임의 책후기를 기록하는 게시판. Pinterest 레퍼런스(캔디 카트 브랜드 "Nectar")의 **버건디+크림+핑크 컬러, 스캘럽(물결) 장식, 그리드 종이 배경, 하드섀도우 카드**를 차용. 목록은 카드 그리드가 아니라 **세로선으로 연결된 타임라인 레이아웃**.

브랜드명 "책후기 게시판", 로고 이모지 📚.

### 디자인 토큰 (`sample/style.css`)

```css
--maroon:#7A1E2C;      --maroon-dark:#551420;
--cream:#FCF3E7;       --white:#FFFDF9;
--pink:#F5C9D6;        --pink-dark:#E8A0B8;
--lavender:#D9D4F2;    --peach:#F6D9C0;
--ink:#3B1418;         --ink-soft:#7A4A50;
--line: rgba(122,30,44,0.10);
```

폰트 (2차 수정으로 교체됨 — 아래 "결정 기록" 참고):

```css
--display:'Gowun Batang', serif;      /* 헤드라인·로고·카드 제목, weight 700 */
--label:'IBM Plex Sans KR', sans;     /* 버튼·라벨·메타, weight 500~600 */
--body:'IBM Plex Sans KR', sans;      /* 본문, weight 400 */
```

### 구현 포인트

- **스캘럽 헤더** — `.site-header::after`에 `radial-gradient(circle at 11px 0, var(--cream) 10px, transparent 10.5px)`를 `background-size:22px 15px`로 반복해서 반원 테두리를 만듭니다
- **그리드 종이 히어로** — `linear-gradient` 2개(가로선·세로선)를 `background-size:26px 26px`로 반복. 이모지 장식(🔖💭☕)은 `.deco.d1~.d4`로 절대 배치
- **하드섀도우 카드** — `border:2px solid var(--ink)` + `box-shadow:4px 4px 0 <색>`. 호버 시 `translate(-2px,-2px)` + 그림자 6px
- **타임라인** — `.timeline::before`가 왼쪽 세로 점선, 각 `.tl-item .marker`가 📖 원형 마커
- **카드 색 순환** — `.tl-card.c1/.c2/.c3` = 핑크 / 라벤더 / 피치. JS에서 `'c' + (i % 3 + 1)`로 부여

### 페이지별 내용

**index.html** — 헤더 → 히어로("우리가 읽고 남긴 이야기들" / "이번 달 읽은 책, 어땠나요?") → **"✏️ 새 후기 남기기" 버튼** → 타임라인 → 마무리 문구.

> ⚠️ **글쓰기 버튼은 반드시 타임라인 시작 전(히어로 바로 아래)에 있어야 합니다.** 글이 많아져도 스크롤 없이 글을 쓸 수 있어야 한다는 요구사항입니다. 하단으로 옮기지 마세요.

- 각 카드: 날짜 · 작성자 / 제목 / 내용 요약(64자, 넘으면 `…`)
- 목록 맨 아래: 점선 구분선 + "🍵 여기까지가 지금까지의 기록이에요" (버튼 없이 텍스트만)
- 글이 없을 때: "아직 등록된 후기가 없어요 / 위 버튼으로 첫 책후기를 남겨보세요"

**write.html** — 노트카드 스타일 폼(책 제목·후기 제목 / 이름 / 내용). placeholder 예시는 "예: 아몬드 — 다시 읽어도 좋은 책". 제출 시 localStorage 저장 후 `index.html`로 리다이렉트.

**detail.html** — 큰 따옴표 장식 + 제목 + 작성자·날짜 + 본문 + "← 목록으로 돌아가기". `?id=` 쿼리스트링으로 글을 찾고, 없으면 "후기를 찾을 수 없어요" 표시.

### 데이터 (localStorage, 백엔드 없음)

키: **`bg_posts_v3`**

```js
function getPosts(){
  let posts = JSON.parse(localStorage.getItem('bg_posts_v3') || 'null');
  if(!posts){
    posts = [ /* 시드 3개: id 3,2,1 */ ];
    localStorage.setItem('bg_posts_v3', JSON.stringify(posts));
  }
  return posts.sort((a,b)=> b.id - a.id);   // 최신 글이 위
}

// saveNewPost(title, author, content)
//   → 기존 id 최대값 + 1, 오늘 날짜(YYYY-MM-DD) 자동 부여 후 push
// escapeHtml(s)
//   → div.innerText에 넣고 innerHTML로 꺼내는 방식으로 XSS 방지
```

시드 데이터 3건: `아몬드 — 다시 읽어도 좋은 책`(정하늘, 2026-08-08) / `불편한 편의점, 생각보다 뭉클했어요`(김서준, 2026-08-03) / `소설가의 여행법, 절반 읽고 남기는 중간 후기`(모임지기, 2026-07-28)

> ⚠️ **`getPosts()`와 시드 데이터는 `sample/`의 세 HTML에 각각 복사되어 있습니다.** 별도 .js 파일을 두지 않기로 했기 때문입니다. 시드나 저장 로직을 고칠 때는 **세 파일을 모두** 수정해야 합니다.
>
> ⚠️ 화면에 값을 넣을 때는 반드시 `escapeHtml()`을 거칩니다. 사용자가 `<b>태그</b>`를 입력해도 텍스트로 보여야 합니다.

---

## 결정 기록 (왜 이렇게 되어 있는가)

작업 순서대로, 나중에 되돌리지 않도록 이유를 남깁니다.

1. **진행자용 팁 페이지는 만들지 않음** — 초안에 있었으나 불필요하다고 판단해 제외. 진행자용 내용은 각 페이지의 콜아웃(`.callout.tip`)으로 분산시켰습니다.
2. **상세보기 큰따옴표는 세리프 폰트** — 한글 손글씨체(당시 Kirang Haerang)로 두니 `“` 글리프가 66px에서도 작게 그려졌습니다. `.article .quote`만 Georgia 계열로 고정.
3. **모바일에서 Explorer는 가로 스크롤 탭 줄로 변형** — 세로 파일 목록을 그대로 두니 휴대폰에서 첫 화면을 사이드바가 통째로 차지하고 본문까지 한참 스크롤해야 했습니다. `@media (max-width:820px)`에서 `.sidebar`를 `display:flex; overflow-x:auto`로 바꾸고 `.sec`/`.folder`/`hr`을 숨깁니다.
4. **sample 폰트 교체 (Kirang Haerang + Jua → Gowun Batang + IBM Plex Sans KR)** — "더 깔끔한 폰트로" 요청. 명조는 같은 px에서 더 커 보이므로 히어로 40→37px, 카드 제목 23→21px, 상세 제목 30→27px, 모바일 히어로 29→26px로 함께 줄였고, 본문 굵기는 300→400으로 올려 한글 획이 흐려지지 않게 했습니다. **컬러·스캘럽·하드섀도우·타임라인 구조는 유지.**
5. **index.html의 "문서 목록" 카드 그리드 삭제** — 사이드바 Explorer와 하단 pagenav가 이미 같은 이동 경로를 제공해서 중복이었습니다. 안 쓰게 된 `.doc-grid` / `.doc-card` CSS도 함께 제거했습니다. index 흐름은 이제 **소개 → 오늘의 흐름 → 완성본 CTA → 세 단어만 기억하세요**.

---

## 고칠 때 확인할 것

- [ ] 새 페이지를 추가하면 **모든 페이지의 사이드바**에 항목을 추가하고, 해당 페이지에서만 `.active`를 붙였는가
- [ ] `.pagenav`의 이전/다음이 앞뒤 페이지와 맞물리는가 (현재 순서: index → checklist → templates → step1 → step2 → step3 → extra → errors)
- [ ] `.term` 박스를 추가한 페이지에 COPY 스크립트 블록이 들어 있는가 (step3는 프롬프트가 없어 스크립트도 없음)
- [ ] 프롬프트 원문을 임의로 다듬지 않았는가
- [ ] sample을 고쳤다면 `getPosts()` 중복 3곳을 모두 반영했는가
- [ ] 모바일(375px)에서 가로 스크롤이 생기지 않는가

## 로컬에서 보기

```bash
python3 -m http.server 8899
```

`http://localhost:8899/` → 가이드, `http://localhost:8899/sample/` → 데모.

파일을 직접 열어도(`file://`) 동작하지만, 그때는 클립보드 API가 막혀 COPY 버튼이 textarea 폴백으로 넘어갑니다.
