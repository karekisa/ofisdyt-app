'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Calendar, Clock, User, Phone, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Appointment } from '@/lib/types'
import { Button } from '@/components/ui/button'

type AppointmentsListDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onEdit?: (appointment: Appointment) => void
}

export default function AppointmentsListDialog({
  isOpen,
  onClose,
  onSuccess,
  onEdit,
}: AppointmentsListDialogProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadAppointments()
    }
  }, [isOpen])

  const loadAppointments = async () => {
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Kullanıcı bulunamadı')
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('appointments')
      .select(
        `
        *,
        clients:client_id (
          id,
          name,
          phone
        )
      `
      )
      .eq('dietitian_id', user.id)
      .order('start_time', { ascending: false })

    if (fetchError) {
      setError('Randevular yüklenirken hata: ' + fetchError.message)
      setLoading(false)
      return
    }

    if (data) {
      setAppointments((data as Appointment[]) || [])
    }

    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: {
        label: 'Onaylandı',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      pending: {
        label: 'Beklemede',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      rejected: {
        label: 'Reddedildi',
        className: 'bg-red-100 text-red-700 border-red-200',
      },
      completed: {
        label: 'Tamamlandı',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    }

    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full border ${config.className}`}
      >
        {config.label}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Randevu Listesi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadAppointments} variant="outline">
                Tekrar Dene
              </Button>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                Henüz kayıtlı randevu yok
              </p>
              <p className="text-gray-500 text-sm">
                Yeni randevu oluşturmak için "Yeni Randevu" butonunu kullanın.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left: Appointment Info */}
                    <div className="flex-1 space-y-3">
                      {/* Date & Time */}
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">
                          {format(new Date(appointment.start_time), 'd MMMM yyyy', {
                            locale: tr,
                          })}
                        </span>
                        <Clock className="w-4 h-4 text-gray-500 ml-2" />
                        <span className="font-semibold">
                          {format(new Date(appointment.start_time), 'HH:mm', {
                            locale: tr,
                          })}
                        </span>
                      </div>

                      {/* Client Info */}
                      <div className="space-y-2">
                        {appointment.clients?.name ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900 font-medium">
                              {appointment.clients.name}
                            </span>
                          </div>
                        ) : appointment.guest_name ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900 font-medium">
                              {appointment.guest_name} (Misafir)
                            </span>
                          </div>
                        ) : null}

                        {(appointment.clients?.phone || appointment.guest_phone) && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              {appointment.clients?.phone || appointment.guest_phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div>{getStatusBadge(appointment.status)}</div>
                    </div>

                    {/* Right: Actions */}
                    {onEdit && (
                      <div className="flex items-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onEdit(appointment)
                            onClose()
                          }}
                          className="text-base h-10"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Düzenle
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <Button onClick={onClose} variant="outline" className="w-full h-12 text-base">
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )
}
