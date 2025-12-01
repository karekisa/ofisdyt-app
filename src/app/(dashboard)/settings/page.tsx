'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, Copy, Check, User, Calendar } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingBooking, setSavingBooking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [profileData, setProfileData] = useState({
    full_name: '',
    clinic_name: '',
    phone: '',
    bio: '',
  })

  const [bookingConfig, setBookingConfig] = useState({
    public_slug: '',
    work_start_hour: 9,
    work_end_hour: 17,
    session_duration: 60,
  })

  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfileData({
        full_name: data.full_name || '',
        clinic_name: data.clinic_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
      })

      setBookingConfig({
        public_slug: data.public_slug || '',
        work_start_hour: data.work_start_hour || 9,
        work_end_hour: data.work_end_hour || 17,
        session_duration: data.session_duration || 60,
      })
    }
    setLoading(false)
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.full_name || null,
        clinic_name: profileData.clinic_name || null,
        phone: profileData.phone || null,
        bio: profileData.bio || null,
      })
      .eq('id', user.id)

    if (error) {
      showToast('Profil güncellenirken hata: ' + error.message, 'error')
    } else {
      showToast('Profil güncellendi', 'success')
    }
    setSavingProfile(false)
  }

  const updateBookingConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBooking(true)

    // Check if slug is taken (if changed)
    if (bookingConfig.public_slug) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('public_slug', bookingConfig.public_slug)
        .neq('id', user.id)
        .single()

      if (existing) {
        showToast('Bu uzantı zaten kullanılıyor. Lütfen başka bir uzantı seçin.', 'error')
        setSavingBooking(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        public_slug: bookingConfig.public_slug || null,
        work_start_hour: bookingConfig.work_start_hour || 9,
        work_end_hour: bookingConfig.work_end_hour || 17,
        session_duration: bookingConfig.session_duration || 60,
      })
      .eq('id', user.id)

    if (error) {
      showToast('Randevu ayarları kaydedilirken hata: ' + error.message, 'error')
    } else {
      showToast('Randevu ayarları kaydedildi', 'success')
    }
    setSavingBooking(false)
  }

  const copyBookingLink = () => {
    if (bookingConfig.public_slug) {
      const link = `${window.location.origin}/book/${bookingConfig.public_slug}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Profilinizi ve randevu ayarlarınızı yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Profil Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Profil Bilgileri</h2>
          </div>

          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) =>
                  setProfileData({ ...profileData, full_name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="Adınız Soyadınız"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Klinik Adı
              </label>
              <input
                type="text"
                value={profileData.clinic_name}
                onChange={(e) =>
                  setProfileData({ ...profileData, clinic_name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="Klinik adınız"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Numarası
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Randevu sayfasında görünecek telefon numaranız
              </p>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="0532 123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hakkımda / Bio
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Kısa bir açıklama (randevu sayfasında görünecek)
              </p>
              <textarea
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Kendiniz ve hizmetleriniz hakkında kısa bir açıklama..."
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95"
            >
              <Save className="w-5 h-5" />
              <span>{savingProfile ? 'Kaydediliyor...' : 'Profili Güncelle'}</span>
            </button>
          </form>
        </div>

        {/* Card 2: Randevu Ayarları */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Randevu Ayarları</h2>
          </div>

          <form onSubmit={updateBookingConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Randevu Linki Uzantısı
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Halka açık randevu sayfanız için benzersiz bir URL oluşturun
              </p>
              <input
                type="text"
                value={bookingConfig.public_slug}
                onChange={(e) =>
                  setBookingConfig({
                    ...bookingConfig,
                    public_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="dr-ahmet-yilmaz"
              />
              {bookingConfig.public_slug && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-gray-700 mb-2">Randevu linkiniz:</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-sm text-green-700 bg-white px-3 py-2 rounded border border-green-200">
                      {typeof window !== 'undefined' &&
                        `${window.location.origin}/book/${bookingConfig.public_slug}`}
                    </code>
                    <button
                      type="button"
                      onClick={copyBookingLink}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors active:scale-95"
                      title="Linki Kopyala"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İş Başlangıç Saati
                </label>
                <select
                  value={bookingConfig.work_start_hour}
                  onChange={(e) =>
                    setBookingConfig({
                      ...bookingConfig,
                      work_start_hour: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 6).map((hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İş Bitiş Saati
                </label>
                <select
                  value={bookingConfig.work_end_hour}
                  onChange={(e) =>
                    setBookingConfig({
                      ...bookingConfig,
                      work_end_hour: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 9).map((hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Randevu Süresi
              </label>
              <select
                value={bookingConfig.session_duration}
                onChange={(e) =>
                  setBookingConfig({
                    ...bookingConfig,
                    session_duration: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              >
                <option value={15}>15 dakika</option>
                <option value={30}>30 dakika</option>
                <option value={45}>45 dakika</option>
                <option value={60}>60 dakika</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingBooking}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95"
            >
              <Save className="w-5 h-5" />
              <span>{savingBooking ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
