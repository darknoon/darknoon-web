import React from 'react'
import { Link, graphql } from 'gatsby'
import Img from 'gatsby-image'
import Layout from '../components/layout'

const imsz = 300
const imrt = 0.6

const highlight = '#fee'

const BoxOverImage = ({ image }) => (
  <div style={{ position: 'relative' }}>
    <Img fixed={image.fixed} style={{ width: imsz }} />
    <div
      style={{
        position: 'absolute',
        top: 0.3 * imsz,
        left: 0.28 * imsz,
        padding: '3px',
        width: imsz * imrt,
        height: imsz * imrt,
        border: `3px solid ${highlight}`,
        backdropFilter: 'invert(100%)',
      }}
    >
      <span style={{ color: highlight }}>Face 95%</span>
    </div>
  </div>
)

const IndexPage = ({ data }) => (
  <Layout>
    <BoxOverImage image={data.image.childImageSharp} />
    <p>
      I am working on machine learning and realtime graphics for creative
      applications.
    </p>
    <p>
      <Link to="/projects/">Recent projects</Link>
    </p>
    <p>
      <Link to="/cv/">Previously, I made a lot of iOS and Mac apps</Link> and{' '}
      <Link to="/old">blogged about it</Link>.
    </p>
    <p>
      <a href="http://twitter.com/andpoul">twitter</a>{' '}
      <a href="https://github.com/darknoon/">github</a>
    </p>
  </Layout>
)

export const query = graphql`
  query {
    image: file(relativePath: { eq: "resources/wubba-lubba-dub-dub.jpg" }) {
      childImageSharp {
        fixed(width: 300) {
          ...GatsbyImageSharpFixed
        }
      }
    }
  }
`

export default IndexPage
