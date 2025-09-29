import { createContentLoader } from 'vitepress'

interface Post {
  title: string
  url: string
  date: {
    time: number
    string: string
  }
  excerpt: string | undefined
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform(raw): Post[] {
    return raw
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title,
        url: url.replace('.html', '/'),
        excerpt,
        date: formatDate(frontmatter.date)
      }))
      .sort((a, b) => {
        console.log( b.date, a.date, a.title)
        return isNaN(b.date.time) ? -1 : b.date.time - a.date.time
      })
  }
})

function formatDate(raw: string): Post['date'] {
  const date = new Date(raw)
  // date.setUTCHours(12)
  return {
    time: +date,
    string: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}