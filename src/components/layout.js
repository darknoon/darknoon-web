import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import { MDXProvider } from '@mdx-js/react'

import Header from './header'
import MultiImage from './multiImage'
import Image from './image'

import './colors.css'
import './fonts.css'
import './theme.css'
import './layout.css'

const query = graphql`
  query SiteTitleQuery {
    site {
      siteMetadata {
        defaultTitle
        titleTemplate
      }
    }
  }
`

const Layout = ({ title, children }) => (
  <StaticQuery
    query={query}
    render={({
      site: {
        siteMetadata: { defaultTitle, titleTemplate },
      },
    }) => (
      <>
        <Helmet
          defaultTitle={defaultTitle}
          titleTemplate={titleTemplate}
          title={title}
          meta={[
            {
              name: 'description',
              content: 'Personal page for Andrew Pouliot',
            },
            {
              name: 'keywords',
              content: 'machine learning, AI, ML, React, node, iOS, UI',
            },
          ]}
        >
          <html lang="en" />
        </Helmet>
        <div
          style={{
            margin: '0 auto',
            padding: '1rem',
            maxWidth: 960,
          }}
        >
          <Header siteTitle={defaultTitle} />
          <MDXProvider
            components={{
              MultiImage,
            }}
          >
            {children}
          </MDXProvider>
        </div>
      </>
    )}
  />
)

Layout.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default Layout
