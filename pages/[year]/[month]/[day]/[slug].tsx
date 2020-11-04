// Install gray-matter and date-fns
import fs from 'fs'
import remark from 'remark'
import html from 'remark-html'
import { getAllPosts, getPostBySlug, Post } from '../../../../helpers/posts'

export async function getStaticPaths() {
  const posts = getAllPosts(fs)

  return {
    paths: posts.map(post => {
      return {
        params: {
          slug: post.slug,
        },
      }
    }),
    fallback: false,
  }
}

interface Props {
  year: number
  month: number
  day: number
  slug: string
}

const pad2 = (n: number) =>
  Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 }).format(n)

export async function getStaticProps({ params }: { params: Props }) {
  const { year, month, day } = params
  const slug = `${year}-${pad2(month)}-${pad2(day)}-${params.slug}`
  const post = getPostBySlug(fs, slug)
  if (post === undefined) throw Error('Could not find post')
  const markdown = await remark()
    .use(html)
    .process(post.content || '')
  const content = markdown.toString()

  return {
    props: {
      ...post,
      content,
    },
  }
}

const BlogPost = ({ props }: { props: Post }) => (
  <p>
    test
    {JSON.stringify(props)}
  </p>
)

export default BlogPost
