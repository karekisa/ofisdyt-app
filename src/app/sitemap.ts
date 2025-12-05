import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Ensure base URL uses HTTPS and www to match GSC verified domain
  const baseUrl = 'https://www.diyetlik.com.tr'

  // Helper function to ensure valid URL format
  const ensureValidUrl = (path: string): string => {
    // Remove any leading/trailing slashes and ensure proper format
    const cleanPath = path.replace(/^\/+|\/+$/g, '')
    // Ensure base URL doesn't have trailing slash
    const cleanBase = baseUrl.replace(/\/+$/, '')
    return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase
  }

  // Static routes - ensure URLs are properly formatted
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: ensureValidUrl(''),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: ensureValidUrl('login'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: ensureValidUrl('subscription'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Dynamic routes: Fetch profiles with public_slug
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('public_slug, created_at')
      .not('public_slug', 'is', null)
      .limit(100) // Top 100 profiles
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profiles for sitemap:', error)
      // Return static routes even if dynamic fetch fails - prevents sitemap from being empty
      return staticRoutes
    }

    // Generate dynamic routes for dietitian booking pages
    // Filter out any invalid slugs and ensure URL safety
    const dynamicRoutes: MetadataRoute.Sitemap = (profiles || [])
      .filter((profile) => {
        // Validate public_slug exists and is a valid string
        return (
          profile.public_slug &&
          typeof profile.public_slug === 'string' &&
          profile.public_slug.trim().length > 0 &&
          // Basic URL safety: no special characters that could break URLs
          /^[a-z0-9-]+$/.test(profile.public_slug.toLowerCase())
        )
      })
      .map((profile) => {
        const slug = profile.public_slug!.toLowerCase().trim()
        return {
          url: ensureValidUrl(`randevu/${slug}`),
          lastModified: profile.created_at ? new Date(profile.created_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }
      })

    const allRoutes = [...staticRoutes, ...dynamicRoutes]

    // Log success for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[sitemap] Generated sitemap with ${allRoutes.length} URLs (${staticRoutes.length} static, ${dynamicRoutes.length} dynamic)`)
    }

    return allRoutes
  } catch (error) {
    // Critical error handling - ensure we always return at least static routes
    console.error('Exception fetching profiles for sitemap:', error)
    // Return static routes to prevent empty sitemap
    return staticRoutes
  }
}

