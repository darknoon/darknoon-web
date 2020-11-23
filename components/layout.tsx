import Head from 'next/head'
import { FC } from 'react'
import Header from './header'

const defaultTitle = 'Andrew Pouliot'
const titleTemplate = '%s — Andrew Pouliot'

const Layout: FC<{ title?: string }> = ({ title = defaultTitle, children }) => (
  <>
    <Head>
      <title>{title}</title>
      <meta name="description" content="Personal page for Andrew Pouliot" />
      <meta
        name="keywords"
        content="machine learning, AI, ML, React, node, iOS, UI"
      />
      <html lang="en" />
    </Head>
    <div
      style={{
        margin: '0 auto',
        padding: '1rem',
        maxWidth: 780,
      }}
    >
      <Header siteTitle={defaultTitle} />
      {children}
    </div>
  </>
)

export default Layout
