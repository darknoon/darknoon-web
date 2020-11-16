// Install gray-matter and date-fns
import fs from 'fs'
import Layout from '../../../../components/layout'
import {
  fileNameFor,
  getAllPosts,
  getPostByFileName,
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
  console.log('asked for paths: ', paths)

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
  post: ProcessedPost
}

export async function getStaticProps({
  params,
}: {
  params: Params
}): Promise<{ props: StaticProps }> {
  const { year, month, day } = params
  const filename = fileNameFor(year, month, day, params.slug)
  const post = getPostByFileName(fs, filename)
  if (post === undefined) throw Error('Could not find post')
  const processed = await processPost(post)

  return {
    props: {
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

  return (
    <Layout>
      <h1>{post.frontmatter.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.body.contentHTML }}></div>
    </Layout>
  )
}
export default BlogPost
