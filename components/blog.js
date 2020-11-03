// import { graphql, Link } from 'gatsby'
import { MDXRenderer } from 'gatsby-plugin-mdx'
import Link from 'next/link'
import React from 'react'
import Layout from '../components/layout'

const BlogPost = props => {
  const { data } = props
  const { post } = data
  const { fields, body } = post
  const { title, date, slug } = fields
  return (
    <Layout title={title}>
      <h1>{title}</h1>
      <p className="post-date">
        <Link href={slug}>{date}</Link>
      </p>
      <MDXRenderer>{body}</MDXRenderer>
      <p>
        <Link href="/old">More old posts</Link>
      </p>
    </Layout>
  )
}

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    post: mdx(fields: { slug: { eq: $slug } }) {
      body
      fields {
        title
        date
        slug
      }
    }
  }
`

export default BlogPost
