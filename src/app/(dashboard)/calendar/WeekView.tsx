'use client'

import { useMemo } from 'react'
import { format, parseISO, isSameDay, addDays, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { generateTimeSlots } from './utils'
import { Appointment } from '@/lib/types'
import { Clock } from 'lucide-react'

type WeekViewProps = {
  weekStart: Date
  appointments: Appointment[]
  profile: { work_start_hour: number; work_end_hour: number; session_duration: number } | null
  onAppointmentClick: (appointment: Appointment) => void
  onDateClick: (date: Date) => void
}

export default function WeekView({
  weekStart,
  appointments,
  profile,
  onAppointmentClick,
  onDateClick,
}: WeekViewProps) {
  const workStartHour = profile?.work_start_hour || 9
  const workEndHour = profile?.work_end_hour || 17
  const sessionDuration = profile?.session_duration || 60

  const timeSlots = useMemo(() => {
    return generateTimeSlots(workStartHour, workEndHour, sessionDuration)
  }, [workStartHour, workEndHour, sessionDuration])

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }, [weekStart])

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.start_time)
      return isSameDay(aptDate, day)
    })
  }

  const getAppointmentForSlot = (day: Date, timeSlot: string) => {
    const dayAppointments = getAppointmentsForDay(day)
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
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900'
    }
  }

  return (
    <div className="p-4 md:p-6 overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header: Days */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-2 text-sm font-medium text-gray-600"></div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="p-2 text-center border-l border-gray-200 last:border-r-0"
            >
              <div className="text-xs text-gray-500 mb-1">
                {format(day, 'EEE', { locale: tr })}
              </div>
              <div
                className={`text-lg font-semibold ${
                  isSameDay(day, new Date()) ? 'text-green-600' : 'text-gray-900'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="max-h-[60vh] overflow-y-auto">
          {timeSlots.map((timeSlot) => (
            <div
              key={timeSlot}
              className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 text-xs font-medium text-gray-600 flex items-center justify-end pr-4">
                {timeSlot}
              </div>
              {weekDays.map((day) => {
                const appointment = getAppointmentForSlot(day, timeSlot)
                const slotDate = new Date(day)
                const [hours, minutes] = timeSlot.split(':').map(Number)
                slotDate.setHours(hours, minutes, 0, 0)

                return (
                  <div
                    key={day.toISOString()}
                    className="p-1 border-l border-gray-200 last:border-r-0 min-h-[60px]"
                  >
                    {appointment ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick(appointment)
                        }}
                        className={`p-2 rounded border-2 cursor-pointer hover:shadow-md hover:opacity-90 transition-all text-xs ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        <p className="font-semibold truncate">
                          {appointment.clients?.name || appointment.guest_name || 'Misafir'}
                        </p>
                        <p className="text-xs mt-1 opacity-80">
                          {format(parseISO(appointment.start_time), 'HH:mm')}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => onDateClick(slotDate)}
                        className="w-full h-full p-2 rounded border-2 border-dashed border-transparent hover:border-green-300 hover:bg-green-50 transition-colors"
                        aria-label={`${format(day, 'd MMMM')} ${timeSlot} - Randevu ekle`}
                      >
                        <span className="sr-only">Boş</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {timeSlots.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Çalışma saati tanımlanmamış</p>
        </div>
      )}
    </div>
  )
}
