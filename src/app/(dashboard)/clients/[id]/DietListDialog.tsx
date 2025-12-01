'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Send, Save } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatPhoneForWhatsapp } from '@/lib/utils'

type DietList = {
  id: string
  client_id: string
  title: string
  content: string
  created_at: string
}

type DietListDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clientId: string
  clientName: string
  clientPhone: string | null
  editingList?: DietList | null
}

const DIET_TEMPLATE = `KAHVALTI:
• 
• 
• 

ÖĞLE:
• 
• 
• 

ARA ÖĞÜN:
• 
• 

AKŞAM:
• 
• 
• 

NOTLAR:
• `

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
      // Default title to current date
      const defaultTitle = format(new Date(), 'd MMMM yyyy', { locale: tr })
      setFormData({
        title: defaultTitle,
        content: DIET_TEMPLATE,
      })
    }
  }, [editingList, isOpen])

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Lütfen başlık ve içerik alanlarını doldurun')
      return
    }

    setLoading(true)

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
        setLoading(false)
        return
      }
    } else {
      // Create new list
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Oturum süresi dolmuş, lütfen tekrar giriş yapın.')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('diet_lists').insert({
        dietitian_id: user.id,
        client_id: clientId,
        title: formData.title,
        content: formData.content,
      })

      if (error) {
        alert('Oluşturulurken hata: ' + error.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSuccess()
  }

  const handleSendWhatsApp = async () => {
    if (!clientPhone) {
      alert('Danışanın telefon numarası bulunamadı')
      return
    }

    if (!formData.content.trim()) {
      alert('Lütfen diyet listesi içeriğini doldurun')
      return
    }

    // Format phone number for WhatsApp
    const formattedPhone = formatPhoneForWhatsapp(clientPhone)
    if (!formattedPhone) {
      alert('Geçersiz telefon numarası formatı.')
      return
    }

    // If it's a new list, save it first
    if (!editingList) {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Oturum süresi dolmuş, lütfen tekrar giriş yapın.')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('diet_lists').insert({
        dietitian_id: user.id,
        client_id: clientId,
        title: formData.title,
        content: formData.content,
      })

      if (error) {
        alert('Kaydedilirken hata: ' + error.message)
        setLoading(false)
        return
      }
      setLoading(false)
    }

    // Construct formatted message
    const message = `Merhaba Sayın ${clientName}, 🥗 İşte yeni diyet listeniz:\n\n${formData.content}\n\nSorularınız için buradayım! 👋`

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message)

    // Construct WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    // Open in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingList ? 'Diyet Listesini Düzenle' : 'Yeni Diyet Listesi'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Örn: 1. Hafta Listesi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder={DIET_TEMPLATE}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {clientPhone ? (
              <span>WhatsApp: {clientPhone}</span>
            ) : (
              <span className="text-yellow-600">
                ⚠️ Danışanın telefon numarası yok
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              İptal
            </button>
            {clientPhone && (
              <button
                onClick={handleSendWhatsApp}
                disabled={loading || !formData.content.trim()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp'a Gönder</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

