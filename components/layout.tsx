import { MDXProvider } from '@mdx-js/react'
import Head from 'next/head'
import * as React from 'react'
import Header from './header'
import MultiImage from './multiImage'

const defaultTitle = 'Andrew Pouliot'
const titleTemplate = '%s — Andrew Pouliot'

const Layout = ({ title = defaultTitle, children }: {title?: string, children: React.ReactNode}) => 
  <>
    <Head>
      <title>{title}</title>
      <meta name="description" content='Personal page for Andrew Pouliot' />
      <meta name="keywords" content='machine learning, AI, ML, React, node, iOS, UI' />
      <html lang="en" />
    </Head>
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

export default Layout
