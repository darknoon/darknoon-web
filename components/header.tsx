import Link from 'next/link'
import React from 'react'

const Header = ({ siteTitle }) => (
  <div>
    <Link
      href="/"
    >
      <h3>{siteTitle}</h3>
    </Link>
  </div>
)

export default Header
