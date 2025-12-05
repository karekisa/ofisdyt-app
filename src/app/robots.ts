import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/', // Allow crawling everything except admin/dashboard
        disallow: ['/admin/', '/dashboard/'], // Keep admin private
      },
    ],
    sitemap: 'https://www.diyetlik.com.tr/sitemap.xml', // Ensure this uses HTTPS and WWW if that's the canonical domain
  }
}

