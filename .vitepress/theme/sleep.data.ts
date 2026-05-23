import { createContentLoader } from 'vitepress'

interface Post {
  title: string
  url: string
  date: {
    time: number
    string: string
  }
  description: string
  tags?: string[]
}

declare const data: Post[]
export { data }

export default createContentLoader('sleep/*.md', {
  transform(raw): Post[] {
    return raw
      .filter(({ url }) => !url.endsWith('/sleep/') && !url.endsWith('/sleep/index.html'))
      .map(({ url, frontmatter }) => ({
        title: frontmatter.title,
        url: url.replace('.html', '/'),
        description: frontmatter.description ?? '',
        date: formatDate(frontmatter.date),
        tags: frontmatter.tags ?? []
      }))
      .sort((a, b) => {
        return Number.isNaN(b.date.time) ? -1 : b.date.time - a.date.time
      })
  }
})

function formatDate(raw: string): Post['date'] {
  const date = new Date(raw)
  return {
    time: +date,
    string: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
