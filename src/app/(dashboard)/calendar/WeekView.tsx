'use client'

import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, addMinutes } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bell } from 'lucide-react'
import { generateTimeSlots, findClosestSlotIndex } from './utils'
import { formatPhoneForWhatsapp } from '@/lib/utils'

type Appointment = {
  id: string
  start_time: string
  status: string
  guest_name: string | null
  guest_phone: string | null
  client_id: string | null
  clients?: { name: string; phone: string | null } | null
}

type WeekViewProps = {
  currentDate: Date
  appointments: Appointment[]
  onSlotClick?: (date: Date, time: string) => void
  onAppointmentClick?: (appointment: Appointment) => void
  workStartHour?: number | null
  workEndHour?: number | null
  sessionDuration?: number | null
}

// Pixel-based coordinate system constants
const SLOT_HEIGHT = 64 // Fixed pixels per slot (ensures enough clickable space even for 15-min slots)

export default function WeekView({
  currentDate,
  appointments,
  onSlotClick,
  onAppointmentClick,
  workStartHour = 9,
  workEndHour = 18,
  sessionDuration = 60,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: tr })
  const weekEnd = endOfWeek(currentDate, { locale: tr })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Generate time slots based on profile settings
  const timeSlots = generateTimeSlots(workStartHour || 9, workEndHour || 18, sessionDuration || 45)

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.start_time)
      return isSameDay(aptDate, day)
    })
  }

  // Calculate appointment position based on slot index
  const getAppointmentTop = (startTime: string): number => {
    const date = parseISO(startTime)
    const timeString = format(date, 'HH:mm')
    
    // Find the slot index for this appointment
    const slotIndex = findClosestSlotIndex(timeString, timeSlots)
    
    // Calculate top position: slotIndex * SLOT_HEIGHT + 1px gap
    const top = slotIndex * SLOT_HEIGHT + 1
    return Math.max(1, top)
  }

  // Calculate appointment height based on duration
  const getAppointmentHeight = (startTime: string, sessionDurationMinutes: number = sessionDuration || 45): number => {
    // Calculate height: (appointmentDuration / sessionDuration) * SLOT_HEIGHT - 2px for gaps
    const duration = sessionDuration || 45
    const slotCount = sessionDurationMinutes / duration
    return slotCount * SLOT_HEIGHT - 2
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/90 border-l-4 border-green-600'
      case 'pending':
        return 'bg-yellow-500/90 border-l-4 border-yellow-600'
      case 'rejected':
        return 'bg-red-500/90 border-l-4 border-red-600'
      case 'completed':
        return 'bg-blue-500/90 border-l-4 border-blue-600'
      default:
        return 'bg-gray-500/90 border-l-4 border-gray-600'
    }
  }

  const handleRemind = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // Get phone number (from client or guest)
    const phone = apt.clients?.phone || apt.guest_phone

    if (!phone) {
      alert('Bu danışanın telefon numarası kayıtlı değil.')
      return
    }

    // Format phone number for WhatsApp
    const formattedPhone = formatPhoneForWhatsapp(phone)
    if (!formattedPhone) {
      alert('Geçersiz telefon numarası formatı.')
      return
    }

    // Get client name
    const clientName = apt.clients?.name || apt.guest_name || 'Danışan'

    // Format date and time
    const aptDate = parseISO(apt.start_time)
    const dateStr = format(aptDate, 'd MMMM EEEE', { locale: tr })
    const timeStr = format(aptDate, 'HH:mm', { locale: tr })

    // Construct message
    const message = `Merhaba Sayın ${clientName}, 📅 ${dateStr}, Saat ${timeStr} tarihindeki randevunuzu hatırlatmak isteriz. Görüşmek üzere.`

    // Encode message
    const encodedMessage = encodeURIComponent(message)

    // Construct WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    // Open in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  // Calculate total grid height
  const totalHeight = timeSlots.length * SLOT_HEIGHT

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header: Day Names */}
        <div className="grid grid-cols-8 border-b-2 border-gray-300">
          <div className="p-3 border-r-2 border-gray-300"></div>
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div
                key={idx}
                className={`p-3 text-center border-r-2 border-gray-300 last:border-r-0 ${
                  isToday ? 'bg-green-50' : ''
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {format(day, 'EEE', { locale: tr })}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday ? 'text-green-600' : 'text-gray-900'
                  }`}
                >
                  {format(day, 'd', { locale: tr })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-8">
          {/* Time Column */}
          <div className="border-r-2 border-gray-300">
            {timeSlots.map((slotTime, slotIdx) => (
              <div
                key={slotTime}
                className={`pr-2 text-right border-b border-gray-300 ${
                  slotIdx % 2 === 0 ? 'bg-gray-50/50' : ''
                }`}
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                <span className="text-xs text-gray-500 mt-1 block">
                  {slotTime}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day, dayIdx) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={dayIdx}
                className={`relative border-r-2 border-gray-300 last:border-r-0 ${
                  isToday ? 'bg-green-50/30' : ''
                }`}
              >
                {/* Grid Background - Time Slots */}
                <div className="relative" style={{ height: `${totalHeight}px` }}>
                  {timeSlots.map((slotTime, slotIdx) => {
                    const [hours, minutes] = slotTime.split(':').map(Number)
                    const slotDate = new Date(day)
                    slotDate.setHours(hours, minutes, 0, 0)
                    return (
                      <button
                        key={slotTime}
                        type="button"
                        onClick={() => {
                          if (onSlotClick) {
                            onSlotClick(slotDate, slotTime)
                          }
                        }}
                        className={`relative w-full border-b border-gray-300 hover:bg-green-50/50 transition-colors cursor-pointer z-0 ${
                          slotIdx % 2 === 0 ? 'bg-gray-50/50' : ''
                        }`}
                        style={{ height: `${SLOT_HEIGHT}px` }}
                        title={`${format(day, 'd MMMM', { locale: tr })} ${slotTime} - Randevu eklemek için tıklayın`}
                      />
                    )
                  })}

                  {/* Appointments - Absolutely positioned */}
                  {dayAppointments.map((apt) => {
                    const top = getAppointmentTop(apt.start_time)
                    // Default to session duration, but could be extended for longer appointments
                    const height = getAppointmentHeight(apt.start_time, sessionDuration || 45)

                    return (
                      <div
                        key={apt.id}
                        className={`absolute inset-x-1 rounded overflow-hidden text-xs z-10 ${getStatusColor(apt.status)} text-white shadow-sm hover:z-20 transition-all`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: '30px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            console.log('Appointment clicked:', apt)
                            if (onAppointmentClick) {
                              onAppointmentClick(apt)
                            }
                          }}
                          className="w-full h-full text-left cursor-pointer"
                        >
                          <div className="px-1.5 py-1 relative">
                            <div className="font-semibold truncate pr-6">
                              {format(parseISO(apt.start_time), 'HH:mm', { locale: tr })}
                            </div>
                            <div className="truncate mt-0.5 line-clamp-1">
                              {apt.clients?.name || apt.guest_name || 'Misafir'}
                            </div>
                            {/* WhatsApp Reminder Button */}
                            {(apt.clients?.phone || apt.guest_phone) && (
                              <button
                                type="button"
                                onClick={(e) => handleRemind(apt, e)}
                                className="absolute top-1 right-1 p-1 rounded-full hover:bg-green-200/30 text-green-100 hover:text-white transition-colors z-30"
                                title="WhatsApp Hatırlatma Gönder"
                                aria-label="WhatsApp hatırlatma gönder"
                              >
                                <Bell className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
