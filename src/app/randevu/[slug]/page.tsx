import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'
import BookingClient from './BookingClient'

// Robust query function to fetch profile by slug
async function fetchProfileBySlug(slug: string) {
  // Normalize slug: lowercase and trim
  const normalizedSlug = slug.toLowerCase().trim()
  
  // Robust query: Select explicit fields only, use ILIKE for case-insensitive matching
  // DO NOT join auth.users - this causes permission errors for public users
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, clinic_name, bio, public_slug, work_start_hour, work_end_hour, session_duration')
    .ilike('public_slug', normalizedSlug) // Case-insensitive match
    .maybeSingle()

  return { profile, error, normalizedSlug }
}

// Dynamic metadata generation for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { profile, error } = await fetchProfileBySlug(params.slug)
  
  // Server-side debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[generateMetadata] Searching for slug:', params.slug)
    console.log('[generateMetadata] Found profile:', profile ? 'Yes' : 'No')
    if (error) {
      console.error('[generateMetadata] Supabase error:', error)
    }
  }

  if (!profile || error) {
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

// Error Debug Component (temporary for debugging)
function DebugErrorComponent({ slug, error, normalizedSlug }: { slug: string; error: any; normalizedSlug: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-6">Diyetisyen Bulunamadı</h1>
        
        <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Debug Bilgileri:</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Aranan Slug (Orijinal):</span>
                <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-gray-900">{slug}</code>
              </div>
              <div>
                <span className="font-medium text-gray-700">Aranan Slug (Normalize):</span>
                <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-gray-900">{normalizedSlug}</code>
              </div>
              {error && (
                <div>
                  <span className="font-medium text-red-700">Supabase Hatası:</span>
                  <div className="mt-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-red-900">
                    <strong>Code:</strong> {error.code || 'N/A'}<br />
                    <strong>Message:</strong> {error.message || 'N/A'}<br />
                    <strong>Details:</strong> {error.details || 'N/A'}<br />
                    <strong>Hint:</strong> {error.hint || 'N/A'}
                  </div>
                </div>
              )}
              <div>
                <span className="font-medium text-yellow-700">RLS Durumu:</span>
                <span className="ml-2 text-yellow-900">Kontrol Edilmeli - Public Read Access policy aktif olmalı</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Olası Çözümler:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Supabase SQL Editor'de <code>supabase-fix-rls.sql</code> dosyasını çalıştırın</li>
            <li>RLS politikalarının aktif olduğunu kontrol edin</li>
            <li>Slug'ın veritabanında mevcut olduğunu doğrulayın</li>
            <li>Slug formatının doğru olduğunu kontrol edin (küçük harf, tire/alt çizgi)</li>
          </ul>
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  )
}

export default async function BookingPage({ params }: { params: { slug: string } }) {
  // Fetch profile data on server-side
  const { profile, error, normalizedSlug } = await fetchProfileBySlug(params.slug)
  
  // Server-side debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[BookingPage] Server-side fetch - Slug:', params.slug)
    console.log('[BookingPage] Normalized slug:', normalizedSlug)
    console.log('[BookingPage] Profile found:', profile ? 'Yes' : 'No')
    if (error) {
      console.error('[BookingPage] Supabase error:', error)
    }
  }

  // If profile not found, show debug error component
  if (!profile) {
    return <DebugErrorComponent slug={params.slug} error={error} normalizedSlug={normalizedSlug} />
  }

  // Pass normalized slug to client component
  return <BookingClient slug={normalizedSlug} />
}

