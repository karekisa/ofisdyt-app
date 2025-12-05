import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/'], // Keep admin private
    },
    sitemap: 'https://www.diyetlik.com.tr/sitemap.xml',
  }
}

