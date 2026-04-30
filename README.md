# Mambo Blog

Mambo의 기술 블로그입니다. 운영 중인 사이트는 <https://kdev.ing> 에서 볼 수 있습니다.

## 로컬 실행

```sh
pnpm install
pnpm dev      # 또는 pnpm l
```

빌드는 `pnpm build`, 빌드 결과물 미리보기는 `pnpm preview` 입니다.

## 글 작성

포스트는 [posts/](posts/) 아래에 한 파일이 한 글이 되도록 작성합니다. 작성 규칙과 컨벤션은 [CLAUDE.md](CLAUDE.md)와 [.claude/skills/blog-writer/resources/style-guide.md](.claude/skills/blog-writer/resources/style-guide.md)를 참고하세요.

## 배포

`local` 브랜치에 푸시하면 [GitHub Actions](.github/workflows/deploy.yml)가 빌드 후 `gh-pages` 브랜치로 배포합니다.
