import React from 'react'
import Layout from '../components/layout'

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
    what: 'DPPN-based image generation',
  },
]

const Video = ({ src }) => {
  let url = new URL(src)
  if (url.host == 'www.youtube-nocookie.com') {
    return <EmbedYoutube src={src} />
  } else if (url.host == 'player.vimeo.com') {
    return <EmbedVimeo src={src} />
  } else {
    return null
  }
}

const videoSize = { width: 560, height: 315 }

const EmbedYoutube = ({ src }) => (
  <iframe
    width={videoSize.width}
    height={videoSize.height}
    src={src}
    frameBorder="0"
    allow="autoplay; encrypted-media"
    allowFullScreen
  />
)

const EmbedVimeo = ({ src }) => (
  <>
    <iframe
      width={videoSize.width}
      height={videoSize.height}
      src={`${src}?color=fff&title=0&byline=0&portrait=0`}
      frameBorder="0"
      allowFullScreen
    />
    <script src="https://player.vimeo.com/api/player.js" />
  </>
)

const Project = ({ project: p }) => (
  <section key={p.key}>
    <h3>{p.title}</h3>
    <p>{p.what}</p>
    {p.with ? (
      <p>
        with <a href={p.with.href}>{p.with.name}</a>
      </p>
    ) : null}
    {p.videoURL ? <Video src={p.videoURL} /> : null}
  </section>
)

const Projects = () => (
  <Layout>
    <h2>Recent projects</h2>
    {recent.map(p => (
      <Project project={p} />
    ))}
    <h2>In progress</h2>
    {inProgress.map(p => (
      <Project project={p} />
    ))}
  </Layout>
)

export default Projects
