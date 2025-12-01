'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type Client = {
  id: string
  name: string
}

type AppointmentDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialDate?: Date
  initialTime?: string
}

export default function AppointmentDialog({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTime,
}: AppointmentDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: initialTime || '09:00',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadClients()
      if (initialDate) {
        setFormData((prev) => ({
          ...prev,
          date: format(initialDate, 'yyyy-MM-dd'),
        }))
      }
      if (initialTime) {
        setFormData((prev) => ({
          ...prev,
          time: initialTime,
        }))
      }
    } else {
      // Reset form when closing
      setFormData({
        client_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        notes: '',
      })
    }
  }, [isOpen, initialDate, initialTime])

  const loadClients = async () => {
    setLoadingClients(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('dietitian_id', user.id)
      .order('name', { ascending: true })

    if (!error && data) {
      setClients(data as Client[])
    }
    setLoadingClients(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Combine date and time
    const [hours, minutes] = formData.time.split(':').map(Number)
    const appointmentDate = new Date(formData.date)
    appointmentDate.setHours(hours, minutes, 0, 0)

    const { error } = await supabase.from('appointments').insert({
      dietitian_id: user.id,
      client_id: formData.client_id || null,
      start_time: appointmentDate.toISOString(),
      status: 'approved', // Manual entries are auto-confirmed
      guest_name: null,
      guest_phone: null,
    })

    if (error) {
      alert('Randevu oluşturulurken hata: ' + error.message)
    } else {
      // Show success message
      alert('Randevu oluşturuldu')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] md:max-w-md max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Yeni Randevu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danışan Seçin <span className="text-red-500">*</span>
            </label>
            {loadingClients ? (
              <div className="text-sm text-gray-500">Yükleniyor...</div>
            ) : (
              <select
                value={formData.client_id}
                onChange={(e) =>
                  setFormData({ ...formData, client_id: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="">Danışan seçin</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saat <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Ek notlar (opsiyonel)"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}





