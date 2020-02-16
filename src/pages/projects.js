import React from 'react'
import Layout from '../components/layout'
import Img from 'gatsby-image'
import { graphql } from 'gatsby'
import { EmbedYoutube, EmbedVimeo } from '../components/responsiveIFrame'
import './projects.css'

// This is needed until upgrade to node v10+ on AWS Lambda (limitation of Zeit Now platform V2)
if (typeof URL === 'undefined') {
  global.URL = require('url').URL
}

const pompAndClout = {
  name: 'Pomp & Clout',
  href: 'https://pompandclout.com',
}

let recent = [
  {
    key: 'xcx-1999',
    title: 'Charli XCX & Troye Sivan - 1999',
    what: 'Face swap for post-production',
    with: pompAndClout,
    mediaURL: 'projects/xcx-1999/faceswap.png',
    videoURL: 'https://www.youtube-nocookie.com/embed/6-v1b9waHWY',
  },
  {
    key: 'bas-boca-raton',
    title: 'Bas - Boca Raton',
    what: 'Vintage styling for post-production',
    with: pompAndClout,
    videoURL: 'https://player.vimeo.com/video/284217004',
  },
  {
    key: 'meyohas-petals',
    title: 'Sarah Meyohas - Improved GAN petals',
    what: 'Improved resolution GAN petals with progressive growing',
    with: {
      name: 'Sarah Meyohas',
      href: 'http://www.sarahmeyohas.com',
    },
    mediaURL:
      'projects/meyohas-petals/200-resumed-ok-network-snapshot-resume-003600-000096.png',
    videoURL: 'https://www.youtube-nocookie.com/embed/lqh7K2Uga3g',
  },
]

let inProgress = [
  {
    key: 'ar-project',
    title: 'ARKit project',
    what: 'ARKit + physically-based lighting',
  },
  {
    key: 'potion',
    title: 'Potion App',
    mediaURL: 'projects/colorburst/screenshot.png',
    what: 'DPPN-based image generation',
  },
]

const Video = ({ src }) => {
  let url = new URL(src)
  if (url.host === 'www.youtube-nocookie.com') {
    return (
      <EmbedYoutube
        width={videoSize.width}
        height={videoSize.height}
        src={src}
      />
    )
  } else if (url.host === 'player.vimeo.com') {
    return (
      <EmbedVimeo width={videoSize.width} height={videoSize.height} src={src} />
    )
  } else {
    return null
  }
}

const videoSize = { width: 560, height: 315 }

const ProjectImage = ({ images, mediaURL }) => {
  let im = findImage(images, mediaURL)
  if (im != null) {
    return <Img className="project-image" fluid={im.childImageSharp.fluid} />
  } else {
    return null
  }
}

const findImage = (images, relativePath) => {
  if (!Array.isArray(images)) return null
  return images.find(image => image.relativePath === relativePath)
}

const Project = ({ images, project: p }) => (
  <section key={p.key}>
    <h3>{p.title}</h3>
    <p>{p.what}</p>
    {p.with ? (
      <p>
        with <a href={p.with.href}>{p.with.name}</a>
      </p>
    ) : null}
    {<ProjectImage images={images} mediaURL={p.mediaURL} />}
    {p.videoURL ? <Video src={p.videoURL} /> : null}
  </section>
)

export const query = graphql`
  query ProjectImages {
    images: allFile(filter: { relativePath: { glob: "projects/**/*.png" } }) {
      edges {
        node {
          relativePath
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    }
  }
`

const Projects = ({ data }) => {
  const images = data.images.edges.map(edge => edge.node)
  return (
    <Layout title="Projects">
      <h1>Recent projects</h1>
      {recent.map(p => (
        <Project images={images} project={p} key={p.key} />
      ))}
      <p />
      <h1>In progress</h1>
      {inProgress.map(p => (
        <Project images={images} project={p} key={p.key} />
      ))}
    </Layout>
  )
}

export default Projects
