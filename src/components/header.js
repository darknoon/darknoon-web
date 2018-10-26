import React from 'react'
import { Link } from 'gatsby'

const Header = ({ siteTitle }) => (
  <div>
    <Link
      to="/"
      style={{
        textDecoration: 'none',
      }}
    >
      <h3>{siteTitle}</h3>
    </Link>
  </div>
)

export default Header
