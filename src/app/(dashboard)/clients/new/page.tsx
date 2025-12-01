'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    height: '',
    gender: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('clients').insert({
      dietitian_id: user.id,
      name: formData.name,
      phone: formData.phone || null,
      age: formData.age ? parseInt(formData.age) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      gender: formData.gender || null,
      notes: formData.notes || null,
    })

    if (error) {
      alert('Danışan oluşturulurken hata: ' + error.message)
    } else {
      router.push('/clients')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Danışanlara Dön</span>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Yeni Danışan Ekle</h1>
        <p className="text-gray-600 mt-1">Danışan bilgilerini girin</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ad <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="Danışan adı"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yaş
            </label>
            <input
              type="number"
              min="0"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Yaş"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boy (cm)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Boy (cm)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cinsiyet
          </label>
          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="">Cinsiyet seçin</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
            <option value="other">Diğer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notlar
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="Danışan hakkında ek notlar"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Link
            href="/clients"
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95"
          >
            {loading ? 'Oluşturuluyor...' : 'Danışan Oluştur'}
          </button>
        </div>
      </form>
    </div>
  )
}

