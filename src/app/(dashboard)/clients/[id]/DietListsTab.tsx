'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Calendar, Send, Trash2, MessageCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import DietListDialog from './DietListDialog'
import { formatPhoneForWhatsapp } from '@/lib/utils'
import { toast } from 'sonner'

type DietList = {
  id: string
  client_id: string
  title: string
  content: string
  created_at: string
}

type DietListsTabProps = {
  clientId: string
  clientName: string
  clientPhone: string | null
}

export default function DietListsTab({
  clientId,
  clientName,
  clientPhone,
}: DietListsTabProps) {
  const listLabel = 'Diyet Listesi'
  const listLabelPlural = 'Diyet Listeleri'
  const [dietLists, setDietLists] = useState<DietList[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<DietList | null>(null)

  useEffect(() => {
    loadDietLists()
  }, [clientId])

  const loadDietLists = async () => {
    const { data, error } = await supabase
      .from('diet_lists')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDietLists(data as DietList[])
    }
    setLoading(false)
  }

  const handleAddNew = () => {
    setEditingList(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (list: DietList) => {
    setEditingList(list)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingList(null)
  }

  const handleSuccess = () => {
    loadDietLists()
    handleCloseDialog()
  }

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    // Stop event propagation to prevent triggering edit
    e.stopPropagation()

    // Confirmation dialog
    const confirmed = window.confirm('Bu diyet listesini silmek istediğinize emin misiniz?')
    if (!confirmed) {
      return
    }

    // Delete from database
    const { error } = await supabase.from('diet_lists').delete().eq('id', listId)

    if (error) {
      alert('Silinirken hata: ' + error.message)
      return
    }

    // Show success message
    alert('Liste silindi.')

    // Refresh the list
    loadDietLists()
  }

  const handleSendViaWhatsApp = (list: DietList, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering edit

    if (!clientPhone) {
      toast.error('Geçersiz telefon numarası.')
      return
    }

    const normalizedPhone = formatPhoneForWhatsapp(clientPhone)
    if (!normalizedPhone) {
      toast.error('Geçersiz telefon numarası.')
      return
    }

    const dateStr = format(parseISO(list.created_at), 'd MMMM yyyy', { locale: tr })
    const message = `Merhaba ${clientName}, 🥗 İşte ${dateStr} tarihli diyet listeniz:%0A%0A${encodeURIComponent(list.content)}%0A%0ASorularınız için buradayım! 👋`
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${message}`

    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{listLabelPlural}</h3>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni {listLabel} Ekle</span>
        </button>
      </div>

      {/* Diet Lists */}
      {dietLists.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">Henüz {listLabel.toLowerCase()} eklenmemiş.</p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>İlk {listLabel} Oluştur</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {dietLists.map((list) => (
            <div
              key={list.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEdit(list)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {list.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {format(parseISO(list.created_at), 'd MMMM yyyy', {
                        locale: tr,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                    {list.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {clientPhone && (
                    <button
                      onClick={(e) => handleSendViaWhatsApp(list, e)}
                      className="bg-[#25D366] text-white hover:bg-[#20BA5A] p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="WhatsApp ile gönder"
                      title="WhatsApp ile gönder"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteList(list.id, e)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Listeyi sil"
                    title="Listeyi sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <DietListDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        clientId={clientId}
        clientName={clientName}
        clientPhone={clientPhone}
        editingList={editingList}
      />
    </div>
  )
}

