// Install gray-matter and date-fns
import fs from 'fs/promises'
import hydrate from 'next-mdx-remote/hydrate'
import Link from 'next/link'
import base from '../../../../components/base'
import Layout from '../../../../components/layout'
import MULI from '../../../../components/multiImage'
import {
  fileNamesFor,
  getAllPosts,
  getPostByFileName,
  pad2,
  Post,
  ProcessedPost,
  processPost,
} from '../../../../helpers/posts'

export async function getStaticPaths() {
  const posts = await getAllPosts(fs)

  const paths = posts.map(post => {
    const { year, month, day, slug } = post.fields.slugComponents
    return {
      params: {
        year: String(year),
        month: pad2(month),
        day: pad2(day),
        slug,
      },
    }
  })

  return {
    paths,
    fallback: false,
  }
}

interface Params {
  year: number
  month: number
  day: number
  slug: string
}

interface StaticProps {
  filename: string
  post: ProcessedPost
}

// function firstResolved<T>(
//   values: Iterable<T>
// ): Promise<T extends PromiseLike<infer U> ? U : T> {
//   return new Promise((resolve, reject) => {
//     let done = false
//     let pending = Array.from(values)
//     for (let p of pending) {
//       // @ts-ignore
//       p.then((r: U) => {
//         if (!done) {
//           resolve(r)
//         }
//       }).catch(e => {
//         pending = pending.filter(x => p !== x)
//       })
//     }
//   })
// }

async function firstResolved<U>(values: PromiseLike<U>[]): Promise<U> {
  for (let p of Array.from(values)) {
    try {
      return await p
    } catch (e) {
      continue
    }
  }
  throw new Error('nope')
}

export async function getStaticProps({
  params,
}: {
  params: Params
}): Promise<{ props: StaticProps }> {
  const { year, month, day } = params
  const filenames = fileNamesFor(year, month, day, params.slug)

  const file = await firstResolved(
    filenames.map(
      async (filename: string): Promise<[string, Post]> => {
        const post = await getPostByFileName(fs, filename)
        return [filename, post] as [string, Post]
      }
    )
  )
  if (file === undefined) {
    throw Error("Can't find: " + filenames.join(', '))
  }
  const [filename, post] = file
  if (post === undefined) {
    throw Error("Can't find: " + filenames.join(', '))
  }
  const processed = await processPost(post)

  return {
    props: {
      filename,
      post: processed,
    },
  }
}

// const BlogPost = props => {
//   const { data } = props
//   const { post } = data
//   const { fields, body } = post
//   const { title, date, slug } = fields
//   return (
//     <Layout title={title}>
//       <h1>{title}</h1>
//       <p className="post-date">
//         <Link href={slug}>{date}</Link>
//       </p>
//       <MDXRenderer>{body}</MDXRenderer>
//       <p>
//         <Link href="/old">More old posts</Link>
//       </p>
//     </Layout>
//   )
// }

const BlogPost = (data: StaticProps) => {
  const { post } = data
  const { frontmatter, fields, body } = post
  const { title, date } = frontmatter
  const { slug } = fields
  const MultiImage = MULI
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window['MultiImage'] = MULI
  }
  const components = { ...base, MultiImage }

  const content = hydrate(data.post.body.contentHTML, components)
  return (
    <Layout>
      <h1>{post.frontmatter.title}</h1>
      <p className="post-date">
        <Link href={post.fields.link}>
          <a>{date}</a>
        </Link>
      </p>
      {content}
    </Layout>
  )
}

export default BlogPost
