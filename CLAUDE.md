# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@.claude/rules/command.md
@.claude/rules/git.md

## Commands

- `pnpm install` — install dependencies (pnpm is the project's package manager; CI uses pnpm 9, Node 18.x).
- `pnpm l` — start the VitePress dev server (alias of `vitepress dev`). Use this to preview posts locally.
- `pnpm build` / `npm run build` — production build to [.vitepress/dist/](.vitepress/dist/).
- There are no tests, linters, or type-check scripts wired up. `tsc` is not configured to run; [tsconfig.json](tsconfig.json) only describes how the editor/Vue tooling should resolve types.

## Architecture

This is a VitePress-powered Korean tech blog ("Mambo Blog" / `kdevkr.github.io`) deployed to GitHub Pages. The site is content-first: nearly all of the work in this repo is authoring posts under [posts/](posts/), and a small custom theme drives listing, sidebar, and metadata rendering.

### Content pipeline

- **Posts live in [posts/](posts/)** as standalone Markdown files (one file = one post, no nested folders). Filename becomes the URL slug (`cleanUrls: true`).
- **[.vitepress/theme/posts.data.ts](.vitepress/theme/posts.data.ts)** is a `createContentLoader` that reads every `posts/*.md`, extracts `title`/`date` from frontmatter, formats the date as `ko-KR`, and sorts descending. It is the single source of truth for post listings used by [index.md](index.md) (top 5) and [posts.md](posts.md) (full archive grouped by year).
- **Sidebar is auto-generated** by `vitepress-sidebar` in [.vitepress/config.mts](.vitepress/config.mts): it scans `posts/`, builds menu entries from frontmatter `title`, and sorts by frontmatter `date` descending. Do not hand-maintain the sidebar — fix the frontmatter instead.
- **`srcExclude` and `excludeByGlobPattern`** keep [archive/](archive/), `.agents/`, and `.claude/` out of both the build and the sidebar. [investment/](investment/) and [posts.md](posts.md) are *not* excluded and ship as part of the site.

### Theme customization

The theme extends VitePress's default theme via [.vitepress/theme/index.ts](.vitepress/theme/index.ts):

- `SidebarFilter` is injected into the `sidebar-nav-before` slot ([SidebarFilter.vue](.vitepress/theme/components/SidebarFilter.vue)).
- `PostDate` is injected into the `doc-before` slot to render the post date from frontmatter ([PostDate.vue](.vitepress/theme/components/PostDate.vue)).
- The default `VPDocFooter.vue` is replaced via a Vite alias with a custom [DocFooter.vue](.vitepress/theme/components/DocFooter.vue) — be aware when debugging footer issues that VitePress's own component is shadowed.
- `enhanceApp` patches `router.onAfterRouteChange` to scroll the active sidebar item into view; this relies on the default theme's CSS classes (`.VPSidebarItem`, `.VPLink`).
- Styling stack: Tailwind CSS v4 (via `@tailwindcss/vite`), SCSS (modern-compiler API), Pretendard + JetBrains Mono / Noto Sans Mono fonts loaded from `@fontsource*` packages in [font.css](.vitepress/theme/font.css).

### Markdown extensions

- `@mdit/plugin-mark` enables `==highlight==` syntax. Note the rendering caveat in the blog-writer style guide: leave a space between the closing `==` (or `**`) and any following Korean particle/punctuation, otherwise the markup may not close.
- `vitepress-plugin-group-icons` renders icons in tabbed code groups; a custom `terminal` icon is registered in [config.mts](.vitepress/config.mts).

## Post authoring conventions

Every post must follow the rules in [.claude/skills/blog-writer/resources/style-guide.md](.claude/skills/blog-writer/resources/style-guide.md). The non-obvious / load-bearing parts:

- **Frontmatter**: `title`, `date` in `YYYY-MM-DD'T'HH:mm+09:00` (no seconds, KST offset is required), and 2–4 `tags`. The date format is what `posts.data.ts` and the sidebar sort on; deviating breaks ordering.
- **H1**: Each post must have exactly one `# 제목` immediately under the frontmatter, even though VitePress would render the frontmatter title automatically.
- **Images**: Store under [public/images/posts/{slug}/](public/images/posts/) using zero-padded `001.png`, `002.png`, …. Reference them as `/images/posts/{slug}/NNN.png` (no `public/` prefix, no `file:///` paths).
- **Tone**: Korean polite forms (`~입니다`, `~해요`, `~해 주세요`). Keep posts terse — no filler.
- **Commit message for a post**: `title: [포스트 제목]` (see prior commits like `4e760fd67d`, `91a0eea421`).

## Deployment

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) triggers on pushes to the **`local`** branch (the default working branch — not `main`). It builds with pnpm, sets the timezone to `Asia/Seoul` so `lastUpdated` and date rendering are consistent, and publishes [.vitepress/dist/](.vitepress/dist/) to the `gh-pages` branch via `peaceiris/actions-gh-pages`. The custom domain is configured by [public/CNAME](public/CNAME).
