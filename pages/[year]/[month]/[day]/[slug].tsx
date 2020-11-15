// Install gray-matter and date-fns
import fs from 'fs'
import remark from 'remark'
import html from 'remark-html'
import {
  fileNameFor,
  getAllPosts,
  getPostByFileName,
  Post,
} from '../../../../helpers/posts'

export async function getStaticPaths() {
  const posts = await getAllPosts(fs)
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

export async function getStaticProps({ params }: { params: Props }) {
  const { year, month, day } = params
  const filename = fileNameFor(year, month, day, params.slug)
  const post = getPostByFileName(fs, filename)
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
