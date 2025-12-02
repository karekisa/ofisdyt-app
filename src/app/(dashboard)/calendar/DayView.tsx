'use client'

import { useMemo } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { generateTimeSlots } from './utils'
import { Appointment } from '@/lib/types'
import { appointmentStatusMap } from '@/lib/constants'
import { Clock } from 'lucide-react'

type DayViewProps = {
  date: Date
  appointments: Appointment[]
  profile: { work_start_hour: number; work_end_hour: number } | null
  onAppointmentClick: (appointment: Appointment) => void
  onDateClick: (date: Date) => void
}

export default function DayView({
  date,
  appointments,
  profile,
  onAppointmentClick,
  onDateClick,
}: DayViewProps) {
  const workStartHour = profile?.work_start_hour || 9
  const workEndHour = profile?.work_end_hour || 17
  // Fixed 30-minute session duration globally
  const sessionDuration = 30

  const timeSlots = useMemo(() => {
    return generateTimeSlots(workStartHour, workEndHour, sessionDuration)
  }, [workStartHour, workEndHour])

  const dayAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.start_time)
      return isSameDay(aptDate, date)
    })
  }, [appointments, date])

  const getAppointmentForSlot = (timeSlot: string) => {
    return dayAppointments.find((apt) => {
      const aptTime = format(parseISO(apt.start_time), 'HH:mm')
      return aptTime === timeSlot
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 border-green-300 text-green-900'
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900'
      case 'rejected':
        return 'bg-red-100 border-red-300 text-red-900'
      case 'completed':
        return 'bg-blue-100 border-blue-300 text-blue-900'
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-900'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900'
    }
  }

  const getStatusLabel = (status: string) => {
    return appointmentStatusMap[status] || status
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(date, 'd MMMM yyyy, EEEE', { locale: tr })}
        </h2>
      </div>

      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {timeSlots.map((timeSlot) => {
          const appointment = getAppointmentForSlot(timeSlot)
          const slotDate = new Date(date)
          const [hours, minutes] = timeSlot.split(':').map(Number)
          slotDate.setHours(hours, minutes, 0, 0)

          return (
            <div
              key={timeSlot}
              className="flex items-start border-b border-gray-200 pb-2 last:border-b-0"
            >
              <div className="w-20 flex-shrink-0 text-sm font-medium text-gray-600 pt-2">
                {timeSlot}
              </div>
              <div className="flex-1 min-w-0">
                {appointment ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(appointment)
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md hover:opacity-90 transition-all ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {appointment.clients?.name || appointment.guest_name || 'Misafir'}
                        </p>
                        {appointment.clients?.phone || appointment.guest_phone ? (
                          <p className="text-sm mt-1 opacity-80">
                            {appointment.clients?.phone || appointment.guest_phone}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs font-medium ml-2 flex-shrink-0">
                        {format(parseISO(appointment.start_time), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onDateClick(slotDate)}
                    className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors text-left text-gray-500 hover:text-gray-700"
                  >
                    <span className="text-sm">Boş - Tıklayarak randevu ekle</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {timeSlots.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Bu gün için çalışma saati tanımlanmamış</p>
        </div>
      )}
    </div>
  )
}
