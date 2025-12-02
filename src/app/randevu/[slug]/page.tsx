import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'
import BookingClient from './BookingClient'

// Dynamic metadata generation for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // CRITICAL: Convert slug to lowercase for case-insensitive matching
  const lowerCaseSlug = params.slug.toLowerCase()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, clinic_name, bio')
    .ilike('public_slug', lowerCaseSlug) // Use ilike for case-insensitive matching
    .maybeSingle()

  if (!profile) {
    return {
      title: 'Diyetisyen Bulunamadı',
      description: 'Aradığınız diyetisyen bulunamadı.',
    }
  }

  const name = profile.full_name || 'Diyetisyen'
  const title = `Dyt. ${name} - Online Randevu`
  const description = profile.bio 
    ? `${profile.bio.substring(0, 150)}... Dyt. ${name} ile sağlıklı yaşam için hemen randevu oluşturun.`
    : `Dyt. ${name} ile sağlıklı yaşam için hemen randevu oluşturun.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://diyetlik.com.tr/randevu/${params.slug}`,
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: `Dyt. ${name} - Diyetlik`,
        },
      ],
    },
  }
}

export default function BookingPage({ params }: { params: { slug: string } }) {
  // CRITICAL: Convert slug to lowercase for case-insensitive matching
  const lowerCaseSlug = params.slug.toLowerCase()
  return <BookingClient slug={lowerCaseSlug} />
}

