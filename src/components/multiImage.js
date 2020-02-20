import React, { useState } from 'react'

import styles from './multiImage.module.css'

// import { Link } from 'gatsby'

const Scrubber = ({ children }) => {
  return <p className="scrubber">{children}</p>
}

const MultiImage = ({ children, select = 0, ...props }) => {
  const [selectedIndex, selectIndex] = useState(select)
  const [hoveredIndex, setHoveredIndex] = useState(undefined)

  const index = hoveredIndex !== undefined ? hoveredIndex : selectedIndex
  return (
    <div className={styles.multiImage}>
      <p>Hover over the numbers to view each image:</p>
      <Scrubber>
        {React.Children.map(children, (child, i) => (
          <a
            className={styles.hoverIndex}
            onClick={() => selectIndex(i)}
            onMouseOver={() => setHoveredIndex(i)}
            onMouseOut={() => setHoveredIndex(undefined)}
          >
            {i}
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
    </div>
  )
}

export default MultiImage
