import Link from 'next/link'
import React from 'react'
import Layout from '../components/layout'

const CVPage = () => (
  <Layout title="CV">
    <h1>CV</h1>
    <h3>Freelance 2018-</h3>
    <p>I'm currently working on:</p>
    <ul>
      <li>Machine Learning (generative models, images)</li>
      <li>Creative Tools</li>
      <li>Realtime Graphics (Metal / ARKit)</li>
      <li>Collaborations with Artists</li>
    </ul>

    <p>
      <Link href="/projects">Recent projects</Link> involve the use of GANs for
      image generation and image processing, with clients in Art and Video
      production.
    </p>

    <h3>
      <a href="https://lobe.ai">Lobe.ai</a> 2017-2018
    </h3>
    <p>
      I built UI for doing machine learning in the browser in React and backend
      in node.js / PostgreSQL. Also worked a bit on a React Native app and
      machine learning code in Python.
    </p>

    <h3>Facebook Design Tools 2014-2016</h3>
    <p>
      Tech lead on <a href="https://origami.design">Origami Studio</a> project.
      Built from scratch a native macOS visual programming app in Obj-C++.
      Through collaboration with designers, other engineers, and persistence,
      grew app over 2 years to be the #1 design prototyping tool within
      facebook.{' '}
      <a href="https://developers.facebook.com/videos/f8-2016/rapid-prototyping-made-easy-with-origami-studio/">
        Presented the tool at F8
      </a>{' '}
      developer conference.
    </p>
    <p>
      I ported the React-style UI framework from the facebook iOS app (
      <a href="https://componentkit.org">ComponentKit</a>) to Mac &amp;
      contributed performance enhancements to the library.
    </p>

    <h3>
      <a href="https://www.youtube.com/watch?v=Zq6-b9_V9lA">Facebook Paper</a>{' '}
      2013-2014
    </h3>
    <p>
      We pushed the boundaries on what is possible in an iOS app with gestures
      and animations. The app was widely acclaimed for feeling smooth, mostly
      because we worked really hard on it with an amazing team.
    </p>
    <p>
      My job was to make the animations smoother. I worked on improving{' '}
      <del>AsyncViewNode</del> {'->'} <del>AsyncDisplayKit</del> {'-> '}
      <a href="https://texturegroup.org">Texture</a>, an asynchronous UI
      framework designed by{' '}
      <a href="https://twitter.com/scottgoodson">Scott Goodson</a>. To address
      content-specific UI stalls, I made a performance-analysis tool that
      correlated on-device data with a capture of the screen.
    </p>

    <h3>iOS Apps 2008-2013</h3>
    <p>
      Built the initial version of Starbucks' iOS app, eBay selling UI, Chegg
      app, and various weird apps in OpenGL ES.
    </p>
  </Layout>
)

export default CVPage
