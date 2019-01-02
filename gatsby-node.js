const { createFilePath } = require('gatsby-source-filesystem')
const path = require('path')
const webpack = require('webpack')

function processMarkdownPage({ node, getNode, actions }) {
  const { createNodeField } = actions
  const slug = createFilePath({ node, getNode, basePath: 'posts' })
  let title = node.frontmatter.title
  let nameArr = slug.replace(/\//g, '').split('-')
  const [year, month, day, ...titleRest] = nameArr
  if (title === '') {
    title = nameArr.join(' ').replace('.md', '')
  }
  const newSlug = `/${year}/${month}/${day}/${titleRest.join('-')}/`
  const date = new Date([year, month, day].join('-'))
  // console.log('creating node..: ', { slug, newSlug })

  createNodeField({
    node,
    name: 'slug',
    value: newSlug,
  })
  createNodeField({
    node,
    name: 'title',
    value: title,
  })
  createNodeField({
    node,
    name: 'year',
    value: year,
  })
  createNodeField({
    node,
    name: 'date',
    value: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  })
}

exports.onCreateNode = ({ node, getNode, actions }) => {
  if (node.internal.type === 'MarkdownRemark') {
    processMarkdownPage({ node, getNode, actions })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const blogPostTemplate = path.resolve(`src/components/blog.js`)
  // Query for markdown nodes to use in creating pages.
  const result = await graphql(`
    {
      allMarkdownRemark(sort: { fields: [fileAbsolutePath], order: DESC }) {
        edges {
          node {
            fields {
              slug
              title
              date
            }
          }
        }
      }
    }
  `)
  if (result.errors) {
    throw result.errors
  }

  // Create blog post pages.
  result.data.allMarkdownRemark.edges.forEach(edge => {
    createPage({
      path: `${edge.node.fields.slug}`, // required
      component: blogPostTemplate,
      context: {
        // Data passed to context is available in page queries as GraphQL variables.
        slug: edge.node.fields.slug,
      },
    })
  })
}

exports.onCreateWebpackConfig = ({
  stage,
  rules,
  loaders,
  plugins,
  actions,
}) => {
  actions.setWebpackConfig({
    plugins: [
      new webpack.ProvidePlugin({
        URL: ['url', 'Url'],
      }),
    ],
  })
}
