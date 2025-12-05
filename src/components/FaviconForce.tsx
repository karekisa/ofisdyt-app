'use client'

import { useEffect } from 'react'

export default function FaviconForce() {
  useEffect(() => {
    // Force set favicon to override browser caching
    const setFavicon = (href: string) => {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']")
      existingLinks.forEach((link) => link.remove())

      // Create and add new favicon link
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      link.href = `${href}?v=${Date.now()}` // Cache busting
      document.head.appendChild(link)

      // Also set shortcut icon for older browsers
      const shortcutLink = document.createElement('link')
      shortcutLink.rel = 'shortcut icon'
      shortcutLink.type = 'image/png'
      shortcutLink.href = `${href}?v=${Date.now()}`
      document.head.appendChild(shortcutLink)
    }

    // Set the favicon
    setFavicon('/icon.png')
  }, [])

  return null
}


