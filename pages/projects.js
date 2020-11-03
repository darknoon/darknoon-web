import Img from 'next/image'
import React from 'react'
import Layout from '../components/layout'
import { EmbedVimeo, EmbedYoutube } from '../components/responsiveIFrame'
import './projects.module.css'

const pompAndClout = {
  name: 'Pomp & Clout',
  href: 'https://pompandclout.com',
}

let recent = [
  {
    key: 'gan-hacks',
    link: '/2020/03/03/gan-hacking/',
    title: 'Fake Vacation',
    what: 'BigGAN Hacks',
    mediaURL: 'projects/gan-hacking/fake_vacation_2.png',
  },
  {
    key: 'ar-project',
    title: 'Statue of Liberty official app',
    with: {
      name: 'Yap Studios',
      href: 'https://yapstudios.com',
    },
    link: 'https://apps.apple.com/us/story/id1464767766',
    what: 'Realtime shader effects, asset workflow, and AR optimization',
    mediaURL: 'projects/liberty/screenshot.png',
  },
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

const ProjectImage = ({ mediaURL, link }) => {
  const elem = <Img src={mediaURL} className="project-image" />
  return typeof link === 'string' ? <a href={link}>{elem}</a> : elem
}

const findImage = (images, relativePath) => {
  if (!Array.isArray(images)) return null
  return images.find(image => image.relativePath === relativePath)
}

const Project = ({ project: p }) => (
  <section key={p.key} className="project">
    <a href={p.link}>
      <h3>{p.title}</h3>
    </a>
    <p>{p.what}</p>
    {p.with ? (
      <p>
        with <a href={p.with.href}>{p.with.name}</a>
      </p>
    ) : null}
    {<ProjectImage mediaURL={p.mediaURL} link={p.link} />}
    {p.videoURL ? <Video src={p.videoURL} /> : null}
  </section>
)

const Projects = ({ data }) => {
  return (
    <Layout title="Projects">
      <h1>Recent projects</h1>
      {recent.map(p => (
        <Project project={p} key={p.key} />
      ))}
      <p />
      <h1>In progress</h1>
      {inProgress.map(p => (
        <Project project={p} key={p.key} />
      ))}
    </Layout>
  )
}

export default Projects
