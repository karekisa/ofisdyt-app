'use client'

import { useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { Appointment } from '@/lib/types'
import { appointmentStatusMap } from '@/lib/constants'
import { Calendar as CalendarIcon } from 'lucide-react'

type MonthViewProps = {
  month: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onDateClick: (date: Date) => void
}

export default function MonthView({
  month,
  appointments,
  onAppointmentClick,
  onDateClick,
}: MonthViewProps) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [calendarStart, calendarEnd])

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.start_time)
      return isSameDay(aptDate, day)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'rejected':
        return 'bg-red-500'
      case 'completed':
        return 'bg-blue-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    return appointmentStatusMap[status] || status
  }

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  return (
    <div className="p-4 md:p-6">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = isSameMonth(day, month)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] md:min-h-[120px] border border-gray-200 rounded-lg p-2 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-green-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => onDateClick(day)}
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                      : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </button>
                {dayAppointments.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {dayAppointments.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(appointment)
                    }}
                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-90 transition-opacity truncate ${getStatusColor(
                      appointment.status
                    )} text-white`}
                    title={`${appointment.clients?.name || appointment.guest_name || 'Misafir'} - ${format(
                      parseISO(appointment.start_time),
                      'HH:mm'
                    )}`}
                  >
                    <span className="truncate block">
                      {format(parseISO(appointment.start_time), 'HH:mm')}{' '}
                      {appointment.clients?.name || appointment.guest_name || 'Misafir'}
                    </span>
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 p-1">
                    +{dayAppointments.length - 3} daha
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {appointments.length === 0 && (
        <div className="text-center py-12 mt-4">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Bu ay için randevu bulunmuyor</p>
        </div>
      )}
    </div>
  )
}
