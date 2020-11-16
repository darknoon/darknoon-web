import { format, parseISO } from 'date-fns'
import fs from 'fs'
import matter from 'gray-matter'
import { join } from 'path'
import remark from 'remark'
import excerpt from 'remark-excerpt'
import html from 'remark-html'

export function isDefined<T>(a: T | undefined): a is T {
  return typeof a !== 'undefined'
}
// Add markdown files in `/_posts`
const postsDirectory = join(process.cwd(), '_posts')

export interface Post {
  frontmatter: { title: string; date: string }
  fields: { link: string; slug: string; slugComponents: SlugComponents }
  content: string
}

interface SlugComponents {
  year: number
  month: number
  day: number
  slug: string
}

export interface ProcessedPost extends Post {
  body: {
    contentHTML: string
    excerptHTML: string
  }
}

// 2020-01-02-test.md -> {year: 2020, month: 1, day: 2, slug: "test"}
function componentsFromFileName(fileName: string): SlugComponents | undefined {
  const slm = fileName.match(
    /([0-9][0-9][0-9][0-9])\-([0-9][0-9])\-([0-9][0-9])\-(.*)\.md$/
  )
  if (slm === null) {
    return undefined
  }
  type result = [any, string, string, string, string]
  const [_, yearStr, monthStr, dayStr, slug] = slm as result
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  return { year, month, day, slug }
}

export async function processPost(post: Post): Promise<ProcessedPost> {
  const markdown = await remark()
    .use(html)
    .use(excerpt)
    .process(post.content || '')
  return {
    ...post,
    body: {
      contentHTML: markdown.contents,
      excerptHTML: markdown.contents,
    },
  } as ProcessedPost
}

export async function getAllPosts(_fs: typeof fs): Promise<ProcessedPost[]> {
  const fileNames = _fs.readdirSync(postsDirectory, 'utf8')
  const posts = fileNames
    .map(fileName => getPostByFileName(_fs, fileName))
    .filter(isDefined)
  const processed = await Promise.all(posts.map(processPost))

  return processed
}

export const pad2 = (n: number) =>
  Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 }).format(n)

export function fileNameFor(
  year: number,
  month: number,
  day: number,
  slug: string
) {
  return `${year}-${pad2(month)}-${pad2(day)}-${slug}.md`
}

export function urlPathFor({ year, month, day, slug }: SlugComponents) {
  return `/${year}/${pad2(month)}/${pad2(day)}/${slug}/`
}

export function getPostByFileName(
  _fs: typeof fs,
  fileName: string
): Post | undefined {
  const c = componentsFromFileName(fileName)
  if (c === undefined) {
    return undefined
  }
  const { year, month, day, slug } = c
  const fullPath = join(postsDirectory, fileName)
  const fileContents = _fs.readFileSync(fullPath, 'utf8')
  let { data, content } = matter(fileContents)

  const { date: overrideDate, title = slug } = data

  let date: Date
  if (typeof overrideDate === 'string') {
    date = parseISO(overrideDate)
  } else {
    date = new Date(year, month, day, 0, 0, 0, 0)
  }

  const dateStr = format(date, 'MMMM dd, yyyy')

  const link = urlPathFor(c)
  return {
    fields: { link, slug, slugComponents: c },
    frontmatter: { ...data, title, date: dateStr },
    content,
  }
}
