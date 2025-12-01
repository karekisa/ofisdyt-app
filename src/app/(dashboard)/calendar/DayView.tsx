'use client'

import { format, isSameDay, parseISO, addMinutes } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, ChevronRight, Coffee, Bell } from 'lucide-react'
import { formatPhoneForWhatsapp } from '@/lib/utils'
import { Appointment } from './types'

type DayViewProps = {
  currentDate: Date
  appointments: Appointment[]
  onSlotClick?: (date: Date, time: string) => void
  onAppointmentClick?: (appointment: Appointment) => void
  workStartHour?: number | null
  workEndHour?: number | null
  sessionDuration?: number | null
}

export default function DayView({
  currentDate,
  appointments,
  onSlotClick,
  onAppointmentClick,
  workStartHour = 9,
  workEndHour = 18,
  sessionDuration = 60,
}: DayViewProps) {
  const isToday = isSameDay(currentDate, new Date())

  // Filter appointments for the current date and sort by start_time
  const dayAppointments = appointments
    .filter((apt) => {
      const aptDate = parseISO(apt.start_time)
      return isSameDay(aptDate, currentDate)
    })
    .sort((a, b) => {
      const timeA = parseISO(a.start_time).getTime()
      const timeB = parseISO(b.start_time).getTime()
      return timeA - timeB
    })

  // Calculate end time for appointment
  const getAppointmentEndTime = (startTime: string): string => {
    const start = parseISO(startTime)
    const end = addMinutes(start, sessionDuration || 45) // Use session duration from settings, default to 45 minutes
    return format(end, 'HH:mm', { locale: tr })
  }

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

  const handleAddAppointment = () => {
    if (onSlotClick) {
      const slotDate = new Date(currentDate)
      slotDate.setHours(9, 0, 0, 0) // Default to 9:00 AM
      onSlotClick(slotDate, '09:00')
    }
  }

  // Empty State
  if (dayAppointments.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            Bugün için randevunuz bulunmuyor
          </h3>
          <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md">
            Keyfinize bakın! Yeni bir randevu eklemek için aşağıdaki butona tıklayın.
          </p>
          <button
            onClick={handleAddAppointment}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm md:text-base"
          >
            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            <span>Manuel Randevu Ekle</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs md:text-sm text-gray-500 mb-1">
              {format(currentDate, 'EEEE', { locale: tr })}
            </div>
            <div
              className={`text-xl md:text-2xl font-semibold ${
                isToday ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {format(currentDate, 'd MMMM yyyy', { locale: tr })}
            </div>
          </div>
          {isToday && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs md:text-sm font-medium">
              Bugün
            </span>
          )}
        </div>
      </div>

      {/* Appointment List */}
      <div className="flex flex-col gap-4">
          {dayAppointments.map((apt) => {
            const startTime = format(parseISO(apt.start_time), 'HH:mm', { locale: tr })
            const endTime = getAppointmentEndTime(apt.start_time)
            const clientName = apt.clients?.name || apt.guest_name || 'Misafir'
            const phone = apt.clients?.phone || apt.guest_phone

            return (
              <div
                key={apt.id}
                className="w-full bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left relative"
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
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-4 pr-10">
                    {/* Left: Time */}
                    <div className="flex-shrink-0">
                      <div className="text-2xl md:text-3xl font-bold text-gray-900">
                        {startTime}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 mt-1">
                        {endTime}
                      </div>
                    </div>

                    {/* Center: Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg md:text-xl text-gray-900 mb-1">
                        {clientName}
                      </div>
                      {(apt.clients?.phone || apt.guest_phone) && (
                        <div className="text-sm md:text-base text-gray-500 mb-2">
                          {apt.clients?.phone || apt.guest_phone}
                        </div>
                      )}
                      {/* Note preview placeholder - can be added if notes field exists */}
                      {/* <div className="text-sm text-gray-500 truncate">
                      {apt.notes || 'Not yok'}
                    </div> */}
                    </div>

                    {/* Right: Status Badge & Chevron */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${getStatusBadgeColor(
                          apt.status
                        )}`}
                      >
                        {getStatusLabel(apt.status)}
                      </span>
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </button>
                {/* WhatsApp Reminder Button */}
                {phone && (
                  <button
                    type="button"
                    onClick={(e) => handleRemind(apt, e)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors z-10"
                    title="WhatsApp Hatırlatma Gönder"
                    aria-label="WhatsApp hatırlatma gönder"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
