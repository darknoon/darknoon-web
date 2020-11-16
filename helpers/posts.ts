import { format, parseISO } from 'date-fns'
import fs from 'fs/promises'
import matter from 'gray-matter'
import renderToString from 'next-mdx-remote/render-to-string'
import { join } from 'path'
import base from '../components/base'
import MultiImage from '../components/multiImage'

///

export function isDefined<T>(a: T | undefined): a is T {
  return typeof a !== 'undefined'
}
// Add markdown files in `/_posts`
const postsDirectory = join(process.cwd(), '_posts')

export interface Post {
  filename: string
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
  }
}

// 2020-01-02-test.md -> {year: 2020, month: 1, day: 2, slug: "test"}
function componentsFromFileName(fileName: string): SlugComponents | undefined {
  const slm = fileName.match(
    /([0-9][0-9][0-9][0-9])\-([0-9][0-9])\-([0-9][0-9])\-(.*)\.md[x]?$/
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
  const { content, data } = matter(post.content)
  const components = { ...base, MultiImage }
  // console.log(`rendering ${post.filename}`, content.length)
  const mdxSource = await renderToString(content, { components, scope: data })
  // console.log(`rendered ${post.filename}`, mdxSource.length)

  return {
    ...post,
    body: {
      contentHTML: mdxSource,
    },
  } as ProcessedPost
}

function compareDates(as: SlugComponents, bs: SlugComponents): number {
  return (
    30 * (12 * (as.year - bs.year) + (as.month - bs.month)) + (as.day - bs.day)
  )
}

export async function getAllPosts(_fs: typeof fs): Promise<Post[]> {
  const fileNames = await _fs.readdir(postsDirectory, 'utf8')
  const posts = await Promise.all(
    fileNames.map(async fileName => {
      try {
        return await getPostByFileName(_fs, fileName)
      } catch (e) {
        return undefined
      }
    })
  )
  return posts
    .filter(isDefined)
    .sort((a, b) =>
      compareDates(b.fields.slugComponents, a.fields.slugComponents)
    )
}

export const pad2 = (n: number) =>
  Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 }).format(n)

export function fileNamesFor(
  year: number,
  month: number,
  day: number,
  slug: string
) {
  return ['md', 'mdx'].map(
    ext => `${year}-${pad2(month)}-${pad2(day)}-${slug}.${ext}`
  )
}

export function urlPathFor({ year, month, day, slug }: SlugComponents) {
  return `/${year}/${pad2(month)}/${pad2(day)}/${slug}/`
}

export async function getPostByFileName(
  _fs: typeof fs,
  fileName: string
): Promise<Post> {
  const c = componentsFromFileName(fileName)
  if (c === undefined) {
    return Promise.reject("Couldn't parse filename")
  }
  const { year, month, day, slug } = c
  const fullPath = join(postsDirectory, fileName)
  const fileContents = await _fs.readFile(fullPath, 'utf8')
  console.log('read', fileName)
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
    filename: fileName,
    fields: { link, slug, slugComponents: c },
    frontmatter: { ...data, title, date: dateStr },
    content,
  }
}
