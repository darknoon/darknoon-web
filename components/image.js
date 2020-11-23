import React from 'react'

// import { StaticQuery, graphql } from 'gatsby'
/*
 * This component is built using `gatsby-image` to automatically serve optimized
 * images with lazy loading and reduced file sizes. The image is loaded using a
 * `StaticQuery`, which allows us to load the image from directly within this
 * component, rather than having to pass the image data down from pages.
 *
 * For more information, see the docs:
 * - `gatsby-image`: https://gatsby.app/gatsby-image
 * - `StaticQuery`: https://gatsby.app/staticquery
 */

export const query = graphql`
  query($src: String, $maxWidth: Int) {
    directory {
      relativePath
    }

    image: file(relativePath: { eq: $src }) {
      childImageSharp {
        fluid(maxWidth: $maxWidth) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`
const Image = props => <p>DATAHERE {JSON.stringify(props)}</p>

export default Image

// const Image = ({ src }) => (
//   <StaticQuery
//     query={query}
//     varibles={{ src, maxWidth: 960 }}
//     render={
//       data => <p>{JSON.stringify({ src, data, query })}</p>
//       // data => <Img fluid={data.image.childImageSharp.fluid} />
//     }
//   />
// )
// export default Image
