import React from 'react'
// TODO: Just switch this to markdown? Can use gatsby-remark-responsive-iframe + gatsby-remark-embed-youtube

const ResponsiveIFrame = ({ width, height, children, src, ...rest }) => (
  <div
    className="gatsby-resp-iframe-wrapper"
    style={{
      paddingBottom: `${(height / width) * 100}%`,
      position: 'relative',
      height: 0,
      overflow: 'hidden',
      background: 'black',
    }}
  >
    <iframe
      {...rest}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
      src={src}
    />
    {children}
  </div>
)

export default ResponsiveIFrame

export const EmbedYoutube = ({ src, title, width, height }) => (
  <ResponsiveIFrame
    title={title}
    width={width}
    height={height}
    src={src}
    frameBorder="0"
    allow="autoplay; encrypted-media"
    allowFullScreen
  />
)

export const EmbedVimeo = ({ src, title, width, height }) => (
  <>
    <ResponsiveIFrame
      title={title}
      width={width}
      height={height}
      src={`${src}?color=fff&title=0&byline=0&portrait=0`}
      frameBorder="0"
      allow="autoplay; encrypted-media"
      allowFullScreen
    />
    <script src="https://player.vimeo.com/api/player.js" />
  </>
)
