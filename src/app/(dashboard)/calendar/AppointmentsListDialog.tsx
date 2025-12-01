'use client'

import { useEffect, useState } from 'react'
import { X, Edit } from 'lucide-react'
import { format, parseISO, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

type Appointment = {
  id: string
  start_time: string
  status: string
  guest_name: string | null
  guest_phone: string | null
  client_id: string | null
  clients?: { name: string } | null
}

type AppointmentsListDialogProps = {
  isOpen: boolean
  onClose: () => void
  onEdit: (appointment: Appointment) => void
}

export default function AppointmentsListDialog({
  isOpen,
  onClose,
  onEdit,
}: AppointmentsListDialogProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAppointments()
    }
  }, [isOpen])

  const loadAppointments = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const today = startOfDay(new Date())

    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
        *,
        clients:client_id (
          name
        )
      `
      )
      .eq('dietitian_id', user.id)
      .gte('start_time', today.toISOString())
      .order('start_time', { ascending: true })
      .limit(50)

    if (!error && data) {
      setAppointments(data as Appointment[])
    }
    setLoading(false)
  }

  if (!isOpen) return null

  // Appointments are already filtered and sorted by the query
  const upcomingAppointments = appointments.slice(0, 20) // Limit to 20 most recent

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
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Yaklaşan Randevular</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Yükleniyor...</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Yaklaşan randevu bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => {
                const aptDate = parseISO(apt.start_time)
                const clientName = apt.clients?.name || apt.guest_name || 'Misafir'

                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-lg font-semibold text-gray-900">
                          {format(aptDate, 'HH:mm', { locale: tr })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(aptDate, 'd MMMM yyyy', { locale: tr })}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                            apt.status
                          )}`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900">{clientName}</div>
                      {apt.guest_phone && (
                        <div className="text-sm text-gray-500">{apt.guest_phone}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onEdit(apt)
                        onClose()
                      }}
                      className="ml-4 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      aria-label="Düzenle"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

