'use client'

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  getDay,
} from 'date-fns'
import { tr } from 'date-fns/locale'

type Appointment = {
  id: string
  start_time: string
  status: string
  guest_name: string | null
  client_id: string | null
  clients?: { name: string } | null
}

type MonthViewProps = {
  currentDate: Date
  appointments: Appointment[]
}

export default function MonthView({ currentDate, appointments }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: tr })
  const calendarEnd = endOfWeek(monthEnd, { locale: tr })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time)
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
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="p-4">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={idx}
              className={`min-h-[100px] border border-gray-200 p-2 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-green-500' : ''}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-green-600' : ''}`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className={`${getStatusColor(apt.status)} text-white text-xs px-2 py-1 rounded truncate`}
                    title={`${format(new Date(apt.start_time), 'HH:mm', { locale: tr })} - ${
                      apt.clients?.name || apt.guest_name || 'Misafir'
                    }`}
                  >
                    <span className="font-medium">
                      {format(new Date(apt.start_time), 'HH:mm', { locale: tr })}
                    </span>{' '}
                    {apt.clients?.name || apt.guest_name || 'Misafir'}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{dayAppointments.length - 3} daha
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}





