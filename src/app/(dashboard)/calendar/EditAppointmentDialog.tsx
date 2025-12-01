'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Appointment } from './types'

type EditAppointmentDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onDelete?: () => void
  appointment: Appointment | null
}

export default function EditAppointmentDialog({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  appointment,
}: EditAppointmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    status: 'pending',
    notes: '',
  })

  useEffect(() => {
    if (appointment && isOpen) {
      const aptDate = parseISO(appointment.start_time)
      setFormData({
        date: format(aptDate, 'yyyy-MM-dd'),
        time: format(aptDate, 'HH:mm'),
        status: appointment.status,
        notes: '', // Notes field if added to schema
      })
    }
  }, [appointment, isOpen])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return

    setLoading(true)

    const [hours, minutes] = formData.time.split(':').map(Number)
    const appointmentDate = new Date(formData.date)
    appointmentDate.setHours(hours, minutes, 0, 0)

    const { error } = await supabase
      .from('appointments')
      .update({
        start_time: appointmentDate.toISOString(),
        status: formData.status,
      })
      .eq('id', appointment.id)

    if (error) {
      alert('Randevu güncellenirken hata: ' + error.message)
    } else {
      alert('Randevu güncellendi')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  const handleDeleteClick = () => {
    const confirmed = window.confirm('Randevuyu silmek istediğinize emin misiniz?')
    if (confirmed) {
      handleDelete()
    }
  }

  const handleDelete = async () => {
    if (!appointment) return

    setLoading(true)

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)

    if (error) {
      alert('Randevu silinirken hata: ' + error.message)
      setLoading(false)
    } else {
      alert('Randevu silindi')
      if (onDelete) {
        onDelete()
      } else {
        onSuccess()
      }
      onClose()
      setLoading(false)
    }
  }

  if (!isOpen || !appointment) return null

  const clientName = appointment.clients?.name || appointment.guest_name || 'Misafir'

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı'
      case 'pending':
        return 'Beklemede'
      case 'rejected':
        return 'Reddedildi'
      case 'completed':
        return 'Tamamlandı'
      default:
        return status
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] md:max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Randevu Detayları</h2>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">{clientName}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                  appointment.status
                )}`}
              >
                {getStatusLabel(appointment.status)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="pending">Beklemede</option>
                <option value="approved">Onaylandı</option>
                <option value="rejected">Reddedildi</option>
                <option value="completed">Tamamlandı</option>
              </select>
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
                onClick={handleDeleteClick}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sil</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Kaydediliyor...' : 'Güncelle'}
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}

