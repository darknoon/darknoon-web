import Image from 'next/image'
import React, { FunctionComponent, useState } from 'react'
import styles from './multiImage.module.css'

const Scrubber: FunctionComponent = ({ children }) => {
  return <div className={styles.scrubber}>{children}</div>
}

const findSrc = (elem: React.ReactNode): string | undefined => {
  if (!React.isValidElement(elem)) {
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

interface MultiImageProps {
  select: number
}
const MultiImage: FunctionComponent<MultiImageProps> = ({
  children,
  select = 0,
}) => {
  const [selectedIndex, selectIndex] = useState(select)
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(
    undefined
  )

  const index = hoveredIndex !== undefined ? hoveredIndex : selectedIndex
  return (
    <figure className={styles.multiImage}>
      <small>
        <em>Click or hover to change the image</em>
      </small>
      <Scrubber>
        {React.Children.map(children, (child, i) => {
          const src = findSrc(child)
          if (src === undefined) {
            return undefined
          }
          return (
            <a
              className={[
                styles.preview,
                selectedIndex == i ? styles.selected : '',
              ].join(' ')}
              onClick={() => selectIndex(i)}
              onMouseOver={() => setHoveredIndex(i)}
              onMouseOut={() => setHoveredIndex(undefined)}
            >
              <Image layout="intrinsic" width={100} height={100} src={src} />
            </a>
          )
        })}
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
