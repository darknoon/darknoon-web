import Link from 'next/link'
import React from 'react'

function a({
  href,
  children,
  ...rest
}: {
  href?: string
  children: React.ReactChildren
}): any {
  if (href !== undefined) {
    return (
      <Link href={href}>
        <a {...rest}>{children}</a>
      </Link>
    )
  } else {
    return <a {...rest}> {children}</a>
  }
}

const components = {
  a,
  img: 'img',
  // img: props => {
  //   console.log('img props:', props)
  //   return <Image {...props} />
  // },
  div: 'div',
  code: 'code',
}

export default components
