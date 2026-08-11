# System Instructions

본 프로젝트를 위한 AI 에이전트 통합 가이드라인

## 답변 스타일

- 모든 답변은 한국어로 작성합니다.
- 명령어 사용 결과도 한국어로 출력합니다.
- 답변 시 불필요한 리액션을 금지합니다.
- 답변은 요점 위주로 간결하게 작성합니다.

## 깃 명령어 규칙

- **[MANDATORY]** `git add`, `git commit`, `git push` 등 깃 관련 쓰기/전송 명령어는 사용자가 채팅창에 명시적으로 실행을 지시하기 전에는 절대로 터미널 명령(`run_command`)으로 제출(Propose)하거나 실행하지 마십시오. 작업 완료 보고 후 사용자의 명시적 확인이 있을 때만 실행해야 합니다. 예외는 없습니다.
- 최대한 간결한 말투로 작업의 목적과 변경 사항을 요약하여 기재합니다. 장황한 설명이나 불필요한 수식어 사용을 금지합니다.
- 커밋 메시지에는 작업을 수행한 에이전트 이름과 사용된 모델 정보를 기재합니다.

## 깃허브 작업 지침

- 하위 이슈(Sub-issue) 관리가 필요한 경우 `yahsan2/gh-sub-issue` 확장을 사용합니다.
- 상위 이슈에 연결 시 `gh sub-issue add <상위-번호> <하위-번호>`를 실행합니다.
- PR 생성 시 본문에 `Resolves #<이슈-번호>` 또는 `Closes #<이슈-번호>`를 포함하여 이슈를 자동으로 연결하고 닫히도록 합니다.
- 최초 PR을 생성할 때에는 `gh pr create --draft`를 사용하여 Draft PR로 생성합니다.
- PR 본문 하단에는 작업을 수행한 에이전트 이름과 사용된 모델 정보를 기재합니다.
- 이슈와 PR 에 관련된 사람을 @으로 멘션하세요.

## 명령어

- `pnpm install` — 의존성 설치 (이 프로젝트의 패키지 매니저는 pnpm 입니다. CI는 pnpm 9, Node 24.x를 사용합니다).
- `pnpm l` / `pnpm dev` — VitePress 개발 서버 실행 (`vitepress dev --host`). `--host` 플래그가 붙어 있어 같은 네트워크의 외부 디바이스에서도 접근할 수 있습니다.
- `pnpm build` / `npm run build` — 프로덕션 빌드 명령어입니다. **(주의: 글 작성 및 수정 도중에 로컬 검증 등의 목적으로 이 명령어를 실행하는 것은 금지되어 있습니다. 절대 실행하지 마십시오.)**
- 테스트, 린터, 타입 체크 스크립트는 별도로 연결되어 있지 않습니다. `tsc`도 실행되지 않으며, [tsconfig.json](tsconfig.json)은 에디터/Vue 툴링이 타입을 해석하는 방식만 정의합니다.

## 아키텍처

VitePress 기반의 한국어 기술 블로그("Mambo Blog" / `kdevkr.github.io`)이며 GitHub Pages로 배포됩니다. 콘텐츠 중심 사이트로, 작업 대부분은 [posts/](posts/) 아래에 글을 작성하는 일이고, 소규모 커스텀 테마가 목록·사이드바·메타 정보 렌더링을 담당합니다.

### 콘텐츠 파이프라인

- **글은 [posts/](posts/) 아래에** 단일 마크다운 파일로 존재합니다 (한 파일 = 한 글, 하위 폴더 없음). 파일명이 곧 URL 슬러그가 됩니다 (`cleanUrls: true`).
- **[.vitepress/theme/posts.data.ts](.vitepress/theme/posts.data.ts)** 는 `createContentLoader`로 모든 `posts/*.md`를 읽어 frontmatter의 `title`/`date`를 추출하고, 날짜를 `ko-KR` 형식으로 포맷한 뒤 내림차순 정렬합니다. [index.md](index.md)(상위 5개)와 [posts.md](posts.md)(연도별 전체 아카이브)에서 사용되는 글 목록의 단일 진실 공급원입니다.
- **사이드바는 자동 생성** 됩니다. [.vitepress/config.mts](.vitepress/config.mts)의 `vitepress-sidebar`가 `posts/`를 스캔해 frontmatter `title`로 메뉴를 만들고 `date` 내림차순으로 정렬합니다. 사이드바를 직접 손대지 말고 frontmatter를 수정하세요.
- **`srcExclude`와 `excludeByGlobPattern`** 은 [config.mts](.vitepress/config.mts)의 `EXCLUDED_PATTERNS`를 공유합니다. 제외 대상은 [archive/](archive/), `.agents/`, `.claude/`, `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `README.md` 입니다. [investment/](investment/)와 [posts.md](posts.md)는 제외 대상이 *아니며* 사이트의 일부로 배포됩니다.

### 테마 커스터마이즈

[.vitepress/theme/index.ts](.vitepress/theme/index.ts)에서 VitePress 기본 테마를 확장합니다.

- `SidebarFilter`는 `sidebar-nav-before` 슬롯에 주입됩니다 ([SidebarFilter.vue](.vitepress/theme/components/SidebarFilter.vue)).
- `PostDate`는 `doc-before` 슬롯에 주입되어 frontmatter의 날짜를 렌더링합니다 ([PostDate.vue](.vitepress/theme/components/PostDate.vue)).
- 기본 `VPDocFooter.vue`는 Vite alias로 커스텀 [DocFooter.vue](.vitepress/theme/components/DocFooter.vue)로 교체됩니다. 푸터 디버깅 시 VitePress 원본 컴포넌트가 가려져 있다는 점에 유의하세요.
- `enhanceApp`은 `router.onAfterRouteChange` 훅을 패치해 활성 사이드바 항목을 화면에 보이게 스크롤합니다. 기본 테마의 CSS 클래스(`.VPSidebarItem`, `.VPLink`)에 의존합니다.
- 스타일링 스택: Tailwind CSS v4 (`@tailwindcss/vite` 경유), SCSS(modern-compiler API). 폰트는 [font.css](.vitepress/theme/font.css)에서 Pretendard(`@fontsource/pretendard`)와 JetBrains Mono · Noto Sans Mono(`@fontsource-variable/*` 가변 폰트)를 로드합니다.

### 마크다운 확장

- `@mdit/plugin-mark`로 `==highlight==` 문법을 활성화합니다. 닫는 `==`(또는 `**`) 뒤에 한국어 조사·구두점이 붙으면 마크업이 닫히지 않을 수 있으니, blog-writer 스타일 가이드에 따라 한 칸 띄어 쓰세요.
- `vitepress-plugin-group-icons`로 탭형 코드 그룹에 아이콘을 표시합니다. [config.mts](.vitepress/config.mts)에 커스텀 `terminal` 아이콘이 등록되어 있습니다.

## 글 작성 규칙

모든 글은 [.claude/skills/blog-writer/resources/style-guide.md](.claude/skills/blog-writer/resources/style-guide.md)의 규칙을 따릅니다. 자명하지 않거나 핵심이 되는 부분은 다음과 같습니다.

- **Frontmatter**: `title`, `date`는 `YYYY-MM-DD'T'HH:00+09:00` 형식 (정시 단위, 분 단위는 `00` 고정, KST 오프셋 필수), `tags` 2–4개. 이 날짜 포맷은 `posts.data.ts`와 사이드바 정렬의 기준이므로 어기면 정렬이 깨집니다.
- **H1**: VitePress가 frontmatter title을 자동 렌더링하더라도, 모든 글은 frontmatter 바로 아래에 정확히 하나의 `# 제목`을 둡니다.
- **이미지**: [public/images/posts/{slug}/](public/images/posts/) 아래에 0으로 채운 `001.png`, `002.png`, … 형식으로 저장합니다. `/images/posts/{slug}/NNN.png` 형태로 참조합니다(`public/` 접두어 없음, `file:///` 경로 금지).
- **어조**: 한국어 존댓말(`~입니다`, `~해요`, `~해 주세요`)을 사용합니다. 군더더기 없이 간결하게 작성합니다.
- **글 커밋 메시지**: `post: [포스트 제목]` (예: `4e760fd67d`, `91a0eea421` 커밋 참고).

## 배포

[.github/workflows/deploy.yml](.github/workflows/deploy.yml)은 **`local`** 브랜치 푸시에서 트리거됩니다(기본 작업 브랜치는 `main`이 아닌 `local`입니다). pnpm으로 빌드하고, `lastUpdated`와 날짜 렌더링 일관성을 위해 타임존을 `Asia/Seoul`로 설정한 뒤, `peaceiris/actions-gh-pages`를 통해 [.vitepress/dist/](.vitepress/dist/)를 `gh-pages` 브랜치로 배포합니다. 커스텀 도메인은 [public/CNAME](public/CNAME)에 설정되어 있습니다.
