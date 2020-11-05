import { format, parseISO } from 'date-fns'
import fs from 'fs'
import matter from 'gray-matter'
import { join } from 'path'

export function isDefined<T>(a: T | undefined): a is T {
  return typeof a !== 'undefined'
}
// Add markdown files in `/_posts`
const postsDirectory = join(process.cwd(), '_posts')

export interface Post {
  slug: string
  frontmatter: { date: string }
  content: string
}

interface ProcessedPost extends Post {
  contentHTML: string
}

export function getAllPosts(_fs: typeof fs): Post[] {
  const slugs = _fs.readdirSync(postsDirectory, 'utf8')
  const posts = slugs.map(slug => getPostBySlug(_fs, slug)).filter(isDefined)

  return posts
}

export function getPostBySlug(_fs: typeof fs, slug: string): Post | undefined {
  const slm = slug.match(/([0-9]*)\-([0-9][0-9])\-([0-9][0-9])\-(.*)\.md$/)
  if (slm === null) {
    return undefined
  }
  const [_, year, month, day] = slm
  const realSlug = slug.replace(/\.md$/, '')
  const fullPath = join(postsDirectory, `${realSlug}.md`)
  const fileContents = _fs.readFileSync(fullPath, 'utf8')
  let { data, content } = matter(fileContents)

  let isoDate = data.date
  if (typeof isoDate !== 'string') {
    isoDate = `${year}-${pad2(parseInt(month, 10))}-${pad2(parseInt(day, 10))}`
  }
  const date = format(parseISO(isoDate), 'MMMM dd, yyyy')

  return { slug: realSlug, frontmatter: { ...data, date }, content }
}
