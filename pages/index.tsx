import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Layout from '../components/layout'

const imsz = 300
const imageDimensions = {width: 1000, height: 1331}
const imrt = 0.6

const IndexPage = () => (
  <Layout>
    <Image
      src="/resources/wubba-lubba-dub-dub.jpg"
      width={imsz}
      height={imsz * imageDimensions.height / imageDimensions.width}
      loading="eager"
      quality={90}
      layout='fixed'
    />
    <p>
      I am working on machine learning and realtime graphics for creative
      applications.
    </p>
    <p>
      <Link href="/projects/">Recent projects</Link>
    </p>
    <p>
      Old <Link href="/cv/">iOS and Mac projects</Link> and{' '}
      <Link href="/old">blog</Link>.
    </p>
    <p>
      <a href="http://twitter.com/andpoul">twitter</a>{' '}
      <a href="https://github.com/darknoon/">github</a>
    </p>
  </Layout>
)

export default IndexPage
