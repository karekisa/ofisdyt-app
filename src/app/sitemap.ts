import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.diyetlik.com.tr'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/subscription`,
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
      return staticRoutes
    }

    // Generate dynamic routes for dietitian booking pages
    const dynamicRoutes: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
      url: `${baseUrl}/randevu/${profile.public_slug}`,
      lastModified: profile.created_at ? new Date(profile.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticRoutes, ...dynamicRoutes]
  } catch (error) {
    console.error('Exception fetching profiles for sitemap:', error)
    return staticRoutes
  }
}

