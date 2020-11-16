// import { graphql, Link } from 'gatsby'
import fs from 'fs'
import Link from 'next/link'
import React from 'react'
import Layout from '../components/layout'
import { getAllPosts, ProcessedPost } from '../helpers/posts'

export async function getStaticProps() {
  const posts = await getAllPosts(fs)
  // console.log('posts: ', posts[0])
  return { props: { posts } }
}

const OldPosts = ({ posts }: { posts: ProcessedPost[] }) => {
  return (
    <Layout title="Blog">
      {posts.map((node, idx) => (
        <div className="post" key={idx}>
          <Link href={node.fields.link}>
            <a>
              <h3 className="post-title">
                {node.frontmatter.title} ({node.fields.slugComponents.year})
              </h3>
            </a>
          </Link>
          <span className="post-date">{node.frontmatter.date}</span>
          {/* For some reason, the excerpt is not HTML with mdx. Oh well. */}
          <p dangerouslySetInnerHTML={{ __html: node.excerptHTML }}></p>
        </div>
      ))}
      <p>
        Conversion of old Jekyll posts was based on{' '}
        <a href="https://web.archive.org/web/20171212143144/http://unlikenesses.com/2017-11-06-migrating-blog-to-gatsby/">
          this tutorial
        </a>
      </p>
    </Layout>
  )
}

export default OldPosts
