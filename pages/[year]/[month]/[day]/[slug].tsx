// Install gray-matter and date-fns
import fs from 'fs/promises'
import hydrate from 'next-mdx-remote/hydrate'
import Link from 'next/link'
import base from '../../../../components/base'
import Layout from '../../../../components/layout'
import MultiImage from '../../../../components/multiImage'
import {
  fileNamesFor,
  getAllPosts,
  getPostByFileNames,
  pad2,
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

export async function getStaticProps({
  params,
}: {
  params: Params
}): Promise<{ props: StaticProps }> {
  const { year, month, day } = params
  const filenames = fileNamesFor(year, month, day, params.slug)
  const file = await getPostByFileNames(fs, filenames)
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

const BlogPost = (data: StaticProps) => {
  const { post } = data
  const { frontmatter, fields, body } = post
  const { link } = fields
  const { contentHTML } = body
  const { title, date } = frontmatter
  const components = { ...base, MultiImage }
  const content = hydrate(contentHTML, { components })
  return (
    <Layout>
      <h1>{title}</h1>
      <p className="post-date">
        <Link href={link}>
          <a>{date}</a>
        </Link>
      </p>
      {content}
    </Layout>
  )
}

export default BlogPost
