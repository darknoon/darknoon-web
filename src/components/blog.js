import React from 'react'
import { graphql, Link } from 'gatsby'
import Layout from '../components/layout'

const BlogPost = props => {
  const { data } = props
  const { post } = data
  const { fields, html } = post
  const { title, date, slug } = fields
  return (
    <Layout title={title}>
      <h1>{title}</h1>
      <p className="post-date">
        <Link to={slug}>{date}</Link>
      </p>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <p>
        <Link to="/old">More old posts</Link>
      </p>
    </Layout>
  )
}

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    post: markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      fields {
        title
        date
        slug
      }
    }
  }
`

export default BlogPost
