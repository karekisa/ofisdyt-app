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
    trial_ends_at: string | null
    is_founding_member: boolean | null
  } | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

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
      .select('subscription_status, subscription_ends_at, trial_ends_at, is_founding_member')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }

    if (user.email) {
      setUserEmail(user.email)
    }

    setLoading(false)
  }

  const getWhatsAppUrl = (plan: 'monthly' | 'yearly') => {
    const planName = plan === 'monthly' ? 'Aylık' : 'Yıllık'
    const message = `Merhaba, Diyetlik ${planName} paketi satın almak istiyorum. Mail: ${userEmail}`
    // Replace with your WhatsApp business number
    const phone = '905555555555' // This should be your support WhatsApp number
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

  const isFoundingMember = profile?.is_founding_member
  const isActive = profile?.subscription_status === 'active' || isFoundingMember

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Panele Dön</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Abonelik Durumu
          </h1>
          <p className="text-gray-600">
            {isFoundingMember 
              ? 'Kurucu Üye statüsü ile ömür boyu ücretsiz erişime sahipsiniz'
              : 'İhtiyacınıza uygun paketi seçin ve WhatsApp üzerinden iletişime geçin'}
          </p>
        </div>

        {/* Current Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mevcut Durum</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Durum:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isFoundingMember
                  ? 'bg-yellow-100 text-yellow-800'
                  : profile?.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
              }`}>
                {isFoundingMember
                  ? '👑 Kurucu Üye'
                  : profile?.subscription_status === 'active'
                    ? 'Aktif'
                    : profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()
                      ? 'Deneme'
                      : 'Süresi Dolmuş'}
              </span>
            </div>
            {isFoundingMember && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <div className="text-sm font-semibold text-yellow-900 mb-1">
                      Kurucu Üye Statüsü
                    </div>
                    <div className="text-xs text-yellow-700">
                      Ömür boyu ücretsiz erişime sahipsiniz. Abonelik gerektirmez.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {profile?.subscription_ends_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bitiş Tarihi:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(profile.subscription_ends_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            {profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date() && !isActive && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deneme Bitiş:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(profile.trial_ends_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Cards - Hide for founding members */}
        {!isFoundingMember && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Plan */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-8 hover:border-green-500 transition-all">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aylık Paket</h2>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">₺499</span>
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
              <span>WhatsApp ile Satın Al</span>
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
                <span className="text-5xl font-bold text-gray-900">₺4,999</span>
                <span className="text-gray-600 ml-2">/yıl</span>
              </div>
              <div className="mb-2">
                <span className="text-lg text-gray-500 line-through">₺5,988</span>
                <span className="text-green-600 font-semibold ml-2">
                  %15 tasarruf
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
              <span>WhatsApp ile Satın Al</span>
            </a>
          </div>
        </div>
        )}

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
