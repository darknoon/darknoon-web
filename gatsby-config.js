module.exports = {
  siteMetadata: {
    defaultTitle: 'Andrew Pouliot',
    titleTemplate: '%s — Andrew Pouliot',
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/pages`,
        name: 'pages',
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `posts`,
        path: `${__dirname}/src/_posts`,
      },
    },
    'gatsby-plugin-mdx',
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.mdx`, `.md`],
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              // It's important to specify the maxWidth (in pixels) of
              // the content container as this plugin uses this as the
              // base for generating different widths of each image.
              maxWidth: 960,
            },
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'darknoon-gatsby',
        short_name: 'darknoon',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
        // icon: 'simages/gatsby-icon.png', // This path is relative to the root of the site.
      },
    },
    // This has caused issues in Safari, but removing it causes more issues. Filing a bug with gatsby.
    'gatsby-plugin-offline',
  ],
}
