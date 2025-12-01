'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Crown, Calendar, ArrowLeft, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// TODO: Replace with your actual WhatsApp number
const WHATSAPP_NUMBER = '905555555555'

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleWhatsAppPurchase = (plan: 'monthly' | 'yearly') => {
    if (!user?.email) return

    const planInfo =
      plan === 'monthly'
        ? { name: 'Aylık paket', price: '499 TL' }
        : { name: 'Yıllık paket', price: '4.999 TL' }

    const message = `Merhaba, ${planInfo.name} (${planInfo.price}) satın almak istiyorum. Mail adresim: ${user.email}`

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
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

  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialExpired = trialEndsAt ? trialEndsAt <= new Date() : false
  const isActive = profile?.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back to Dashboard */}
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Panele Dön</span>
            </Link>

            {/* Right: Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Abonelik Paketleri</h1>
            <p className="text-lg text-gray-600">
              Size en uygun paketi seçin ve hizmetlerimizden yararlanmaya devam edin
            </p>
          </div>

          {/* Trial Expired Warning */}
          {isTrialExpired && !isActive && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Deneme süreniz sona erdi. Devam etmek için paket seçiniz.
                </p>
              </div>
            </div>
            </div>
          )}

          {/* Trial Info */}
          {!isTrialExpired && !isActive && trialEndsAt && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Deneme süreniz{' '}
                  {format(trialEndsAt, 'd MMMM yyyy', { locale: tr })} tarihine kadar devam
                  ediyor.
                </p>
              </div>
            </div>
            </div>
          )}

          {/* Active Subscription Info */}
          {isActive && profile?.subscription_ends_at && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Aktif aboneliğiniz{' '}
                  {format(new Date(profile.subscription_ends_at), 'd MMMM yyyy', {
                    locale: tr,
                  })}{' '}
                  tarihine kadar geçerlidir.
                </p>
              </div>
            </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Aylık Paket</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">499</span>
                <span className="text-xl text-gray-600"> TL</span>
                <span className="text-gray-500 block mt-1">/ Ay</span>
              </div>

              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Tüm Özellikler</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Sınırsız Danışan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Sınırsız Randevu</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Finans Yönetimi</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">7/24 Destek</span>
                </li>
              </ul>

              <button
                onClick={() => handleWhatsAppPurchase('monthly')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg active:scale-95"
              >
                WhatsApp ile Satın Al
              </button>
            </div>
          </div>

          {/* Yearly Plan - Best Value */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-500 p-8 hover:shadow-xl transition-shadow relative">
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                <Crown className="w-4 h-4" />
                <span>2 Ay Bedava!</span>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Yıllık Paket</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">4.999</span>
                <span className="text-xl text-gray-600"> TL</span>
                <span className="text-gray-500 block mt-1">/ Yıl</span>
                <p className="text-sm text-green-600 font-medium mt-2">
                  Aylık sadece 416 TL
                </p>
              </div>

              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Tüm Özellikler</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Sınırsız Danışan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Sınırsız Randevu</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Finans Yönetimi</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">7/24 Destek</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">2 Ay Bedava</span>
                </li>
              </ul>

              <button
                onClick={() => handleWhatsAppPurchase('yearly')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg active:scale-95"
              >
                WhatsApp ile Satın Al
              </button>
            </div>
          </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm text-gray-600 mb-4">
            Ödeme işlemi WhatsApp üzerinden manuel olarak gerçekleştirilecektir. Satın alma
            talebinizi gönderdikten sonra, ekibimiz en kısa sürede sizinle iletişime geçecektir.
          </p>
          <p className="text-xs text-gray-500">
            Aboneliğiniz aktif edildikten sonra tüm özelliklere erişebilirsiniz.
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}

