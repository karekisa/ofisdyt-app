'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Trash2 } from 'lucide-react'

type Client = {
  id: string
  name: string
  phone: string | null
  age: number | null
  height: number | null
  gender: string | null
  notes: string | null
}

type EditClientDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onDelete: () => void
  client: Client
}

export default function EditClientDialog({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  client,
}: EditClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    height: '',
    gender: '',
    notes: '',
  })

  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        age: client.age?.toString() || '',
        height: client.height?.toString() || '',
        gender: client.gender || '',
        notes: client.notes || '',
      })
    }
  }, [client, isOpen])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('clients')
      .update({
        name: formData.name,
        phone: formData.phone || null,
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        gender: formData.gender || null,
        notes: formData.notes || null,
      })
      .eq('id', client.id)

    if (error) {
      alert('Güncellenirken hata: ' + error.message)
      setLoading(false)
      return
    }

    alert('Bilgiler güncellendi')
    setLoading(false)
    onSuccess()
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      'DİKKAT: Bu danışanı silerseniz tüm randevuları, ölçümleri ve diyet listeleri de silinecektir. Emin misiniz?'
    )
    if (!confirmed) {
      return
    }

    onDelete()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Danışan Bilgilerini Düzenle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-6">
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Danışan hakkında ek notlar"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sil</span>
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}





