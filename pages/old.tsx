// import { graphql, Link } from 'gatsby'
import fs from 'fs/promises'
import Link from 'next/link'
import React from 'react'
import Layout from '../components/layout'
import { getAllPosts, Post } from '../helpers/posts'

export async function getStaticProps() {
  const posts = await getAllPosts(fs)
  return { props: { posts } }
}

const OldPosts = ({ posts }: { posts: Post[] }) => {
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
