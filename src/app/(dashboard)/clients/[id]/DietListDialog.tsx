'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

type DietList = {
  id: string
  title: string
  content: string
}

type DietListDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clientId: string
  clientName: string
  clientPhone: string | null
  editingList: DietList | null
}

export default function DietListDialog({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientName,
  clientPhone,
  editingList,
}: DietListDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })

  useEffect(() => {
    if (editingList) {
      setFormData({
        title: editingList.title,
        content: editingList.content,
      })
    } else {
      setFormData({
        title: '',
        content: '',
      })
    }
  }, [editingList, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Oturum açmanız gerekiyor')
      setLoading(false)
      return
    }

    if (editingList) {
      // Update existing list
      const { error } = await supabase
        .from('diet_lists')
        .update({
          title: formData.title,
          content: formData.content,
        })
        .eq('id', editingList.id)

      if (error) {
        alert('Güncellenirken hata: ' + error.message)
      } else {
        onSuccess()
      }
    } else {
      // Create new list
      const { error } = await supabase.from('diet_lists').insert({
        dietitian_id: user.id,
        client_id: clientId,
        title: formData.title,
        content: formData.content,
      })

      if (error) {
        alert('Oluşturulurken hata: ' + error.message)
      } else {
        onSuccess()
      }
    }

    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingList ? 'Listeyi Düzenle' : 'Yeni Liste Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Liste başlığı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder="Liste içeriğini buraya yazın..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading
                ? 'Kaydediliyor...'
                : editingList
                  ? 'Güncelle'
                  : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
