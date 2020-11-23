import Link from 'next/link'
import React from 'react'

const Header = ({ siteTitle }: { siteTitle: string }) => (
  <div>
    <Link href="/">
      <a>
        <h3>{siteTitle}</h3>
      </a>
    </Link>
  </div>
)

export default Header
