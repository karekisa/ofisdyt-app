'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  full_name: string | null
  clinic_name: string | null
  phone: string | null
  bio: string | null
  website: string | null
  public_slug: string | null
  work_start_hour: number | null
  work_end_hour: number | null
  session_duration: number | null
  profession: 'dietitian' | 'psychologist' | 'pt' | 'consultant' | null
}

const professionLabels: Record<string, string> = {
  dietitian: 'Diyetisyen',
  psychologist: 'Psikolog / Terapist',
  pt: 'Spor Eğitmeni / PT',
  consultant: 'Diğer / Danışman',
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    clinic_name: '',
    phone: '',
    bio: '',
    website: '',
    public_slug: '',
    work_start_hour: 9,
    work_end_hour: 17,
    session_duration: 60,
  })

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

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      alert('Profil yüklenirken hata: ' + error.message)
      return
    }

    if (data) {
      setProfile(data as Profile)
      setFormData({
        full_name: data.full_name || '',
        clinic_name: data.clinic_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        website: data.website || '',
        public_slug: data.public_slug || '',
        work_start_hour: data.work_start_hour || 9,
        work_end_hour: data.work_end_hour || 17,
        session_duration: data.session_duration || 60,
      })
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name || null,
        clinic_name: formData.clinic_name || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
        website: formData.website || null,
        public_slug: formData.public_slug || null,
        work_start_hour: formData.work_start_hour,
        work_end_hour: formData.work_end_hour,
        session_duration: formData.session_duration,
      })
      .eq('id', user.id)

    if (error) {
      alert('Güncellenirken hata: ' + error.message)
    } else {
      alert('Profil başarıyla güncellendi!')
      loadProfile()
    }

    setSaving(false)
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Profil bilgilerinizi yönetin</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6"
      >
        {/* Profession (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meslek
          </label>
          <input
            type="text"
            value={
              profile?.profession
                ? professionLabels[profile.profession] || profile.profession
                : 'Belirtilmemiş'
            }
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Meslek bilgisi kayıt sırasında belirlenir ve değiştirilemez.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ad Soyad
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="Adınız ve soyadınız"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Klinik / Kurum Adı
          </label>
          <input
            type="text"
            value={formData.clinic_name}
            onChange={(e) =>
              setFormData({ ...formData, clinic_name: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="Klinik veya kurum adı"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefon
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="+90 555 123 4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Web Sitesi
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hakkımda
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) =>
              setFormData({ ...formData, bio: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="Kendiniz hakkında kısa bir açıklama"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Public Slug (Randevu Sayfası URL'i)
          </label>
          <input
            type="text"
            value={formData.public_slug}
            onChange={(e) =>
              setFormData({ ...formData, public_slug: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="ornek-klinik"
          />
          <p className="mt-1 text-xs text-gray-500">
            Randevu sayfanız: /book/{formData.public_slug || 'slug'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Çalışma Başlangıç Saati
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={formData.work_start_hour}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  work_start_hour: parseInt(e.target.value) || 9,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Çalışma Bitiş Saati
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={formData.work_end_hour}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  work_end_hour: parseInt(e.target.value) || 17,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seans Süresi (dakika)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              value={formData.session_duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  session_duration: parseInt(e.target.value) || 60,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
