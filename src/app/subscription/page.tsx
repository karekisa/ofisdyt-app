'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Check, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{
    subscription_status: string | null
    subscription_ends_at: string | null
  } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }

    setLoading(false)
  }

  const getWhatsAppUrl = (plan: 'monthly' | 'yearly') => {
    const planName = plan === 'monthly' ? 'Aylık' : 'Yıllık'
    const message = `Merhaba, ${planName} abonelik paketi hakkında bilgi almak istiyorum.`
    // Replace with your WhatsApp business number
    const phone = '905551234567' // This should be your support WhatsApp number
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const isActive = profile?.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Panele Dön</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Abonelik Paketleri
          </h1>
          <p className="text-gray-600">
            İhtiyacınıza uygun paketi seçin ve WhatsApp üzerinden iletişime geçin
          </p>
        </div>

        {/* Current Status */}
        {isActive && profile?.subscription_ends_at && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Aktif Abonelik</p>
                <p className="text-sm text-green-700">
                  Aboneliğiniz{' '}
                  {new Date(profile.subscription_ends_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  tarihine kadar geçerlidir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Plan */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-8 hover:border-green-500 transition-all">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aylık Paket</h2>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">₺299</span>
                <span className="text-gray-600 ml-2">/ay</span>
              </div>
              <p className="text-gray-600 text-sm">
                Aylık ödeme ile esnek abonelik
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Sınırsız danışan yönetimi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Randevu takvimi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Finansal takip</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Ölçüm ve gelişim takibi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Diyet listesi yönetimi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Herkese açık randevu sayfası</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">7/24 destek</span>
              </li>
            </ul>

            <a
              href={getWhatsAppUrl('monthly')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
            >
              <MessageSquare className="w-5 h-5" />
              <span>WhatsApp ile İletişime Geç</span>
            </a>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-500 p-8 relative">
            <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-medium">
              Popüler
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Yıllık Paket</h2>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">₺2,990</span>
                <span className="text-gray-600 ml-2">/yıl</span>
              </div>
              <div className="mb-2">
                <span className="text-lg text-gray-500 line-through">₺3,588</span>
                <span className="text-green-600 font-semibold ml-2">
                  %17 tasarruf
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                Yıllık ödeme ile en iyi değer
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Sınırsız danışan yönetimi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Randevu takvimi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Finansal takip</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Ölçüm ve gelişim takibi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Diyet listesi yönetimi</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Herkese açık randevu sayfası</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">7/24 destek</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-semibold">
                  Öncelikli teknik destek
                </span>
              </li>
            </ul>

            <a
              href={getWhatsAppUrl('yearly')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
            >
              <MessageSquare className="w-5 h-5" />
              <span>WhatsApp ile İletişime Geç</span>
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sıkça Sorulan Sorular
          </h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                Ödeme nasıl yapılır?
              </p>
              <p>
                WhatsApp üzerinden iletişime geçtiğinizde, ödeme seçenekleri hakkında
                detaylı bilgi alacaksınız.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                Aboneliğimi iptal edebilir miyim?
              </p>
              <p>
                Evet, aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal
                işlemi sonrasında aboneliğiniz mevcut dönem sonuna kadar devam eder.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                Deneme süresi var mı?
              </p>
              <p>
                Yeni kullanıcılar için 15 günlük ücretsiz deneme süresi
                sunulmaktadır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
