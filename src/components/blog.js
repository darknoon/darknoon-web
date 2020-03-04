import React from 'react'
import { graphql, Link } from 'gatsby'
import Layout from '../components/layout'
import { MDXRenderer } from 'gatsby-plugin-mdx'

const BlogPost = props => {
  const { data } = props
  const { post } = data
  const { fields, body } = post
  const { title, date, slug } = fields
  return (
    <Layout title={title}>
      <h1>{title}</h1>
      <p className="post-date">
        <Link to={slug}>{date}</Link>
      </p>
      <MDXRenderer>{body}</MDXRenderer>
      <p>
        <Link to="/old">More old posts</Link>
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
