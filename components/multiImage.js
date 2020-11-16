import Image from 'next/image'
import React, { useState } from 'react'
import styles from './multiImage.module.css'
// import { Link } from 'gatsby'

const Scrubber = ({ children }) => {
  return <div className={styles.scrubber}>{children}</div>
}

// Find the description and a srcSet we can use for the preview. Extreme hack, ew!
const findSrcSet = elem => {
  if (elem === undefined || elem === null || typeof elem === 'string') {
    return undefined
  }
  const { props } = elem
  const { srcSet, children = [] } = props
  if (Array.isArray(srcSet)) {
    return srcSet
  }
  for (let child of children) {
    const found = findSrcSet(child)
    if (found) {
      return found
    }
  }
  return undefined
}

const findSrc = elem => {
  if (elem === undefined || elem === null || typeof elem === 'string') {
    return undefined
  }
  const { props } = elem
  const { src, children = [] } = props
  if (typeof src === 'string') {
    return src
  }
  for (let child of children) {
    const found = findSrc(child)
    if (found) {
      return found
    }
  }
  return undefined
}

const MultiImage = ({ children, select = 0, ...props }) => {
  const [selectedIndex, selectIndex] = useState(select)
  const [hoveredIndex, setHoveredIndex] = useState(undefined)

  const index = hoveredIndex !== undefined ? hoveredIndex : selectedIndex
  return (
    <figure className={styles.multiImage}>
      <p>
        <em>Click or hover to change the image</em>
      </p>
      <Scrubber>
        {React.Children.map(children, (child, i) => (
          <a
            className={[
              styles.preview,
              selectedIndex == i ? styles.selected : '',
            ].join(' ')}
            onClick={() => selectIndex(i)}
            onMouseOver={() => setHoveredIndex(i)}
            onMouseOut={() => setHoveredIndex(undefined)}
          >
            <Image width={300} height={300} src={findSrc(child)} />
            {/* {<img srcSet={findSrcSet(child)} />} */}
          </a>
        ))}
      </Scrubber>
      {React.Children.map(children, (child, i) => (
        <div
          className={[
            styles.multiImageChild,
            index === i ? styles.show : styles.hide,
          ].join(' ')}
        >
          {child}
        </div>
      ))}
    </figure>
  )
}

export default MultiImage
