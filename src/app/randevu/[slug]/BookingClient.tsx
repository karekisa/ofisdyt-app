'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Phone, MessageSquare, CheckCircle, X, Globe, ArrowLeft } from 'lucide-react'
import { format, addDays, isPast, parseISO, startOfDay, endOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { generateTimeSlotsFromHours } from '@/lib/time-utils'
import { Profile, Appointment } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

type BookingClientProps = {
  slug: string
}

export default function BookingClient({ slug }: BookingClientProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    note: '',
  })

  useEffect(() => {
    loadProfile()
  }, [slug])

  useEffect(() => {
    if (selectedDate && profile) {
      loadBookedSlots()
    }
  }, [selectedDate, profile])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('public_slug', slug)
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }

      setProfile(data as unknown as Profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBookedSlots = async () => {
    if (!selectedDate || !profile) return

    const startOfDayDate = startOfDay(selectedDate)
    const endOfDayDate = endOfDay(selectedDate)

    const { data } = await supabase
      .from('appointments')
      .select('start_time, status')
      .eq('dietitian_id', profile.id)
      .in('status', ['pending', 'approved'])
      .gte('start_time', startOfDayDate.toISOString())
      .lte('start_time', endOfDayDate.toISOString())

    if (data) {
      const booked = new Set<string>()
      ;(data as Appointment[]).forEach((apt) => {
        const time = format(parseISO(apt.start_time), 'HH:mm')
        booked.add(time)
      })
      setBookedSlots(booked)
    }
  }

  const timeSlots = useMemo(() => {
    if (!profile) return []
    // Fixed 30-minute session duration globally
    return generateTimeSlotsFromHours(
      profile.work_start_hour || 9,
      profile.work_end_hour || 17,
      30 // Fixed to 30 minutes
    )
  }, [profile])

  const availableDates = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Generate next 30 days
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i)
      dates.push(date)
    }

    return dates
  }, [])

  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    
    if (isPast(date) && dateStr !== todayStr) {
      return
    }
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleTimeSelect = (time: string) => {
    if (bookedSlots.has(time)) return
    setSelectedTime(time)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime || !profile) {
      toast.error('Lütfen tarih ve saat seçin')
      return
    }

    if (!formData.guest_name.trim() || !formData.guest_phone.trim()) {
      toast.error('Lütfen ad ve telefon bilgilerinizi girin')
      return
    }

    setSubmitting(true)

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const appointmentDateTime = new Date(selectedDate)
    appointmentDateTime.setHours(hours, minutes, 0, 0)
    const startTimeISO = appointmentDateTime.toISOString()

    // Server-side conflict detection: Check if slot is already taken
    const { checkAppointmentConflict } = await import('@/lib/utils')
    const hasConflict = await checkAppointmentConflict(profile.id, startTimeISO)

    if (hasConflict) {
      toast.error('Üzgünüz, bu saat az önce başkası tarafından alındı. Lütfen başka bir saat seçin.')
      setSubmitting(false)
      // Refresh booked slots to show the conflict
      await loadBookedSlots()
      setSelectedTime(null)
      return
    }

    const { error } = await supabase.from('appointments').insert({
      dietitian_id: profile.id,
      guest_name: formData.guest_name.trim(),
      guest_phone: formData.guest_phone.trim(),
      start_time: startTimeISO,
      status: 'pending',
    })

    if (error) {
      console.error('Error creating appointment:', error)
      toast.error('Randevu oluşturulurken hata: ' + error.message)
      setSubmitting(false)
      return
    }

    setBookingSuccess(true)
    setShowWhatsAppModal(true)
    setSubmitting(false)
  }

  const getWhatsAppUrl = () => {
    if (!profile?.phone || !formData.guest_phone || !selectedDate || !selectedTime) return ''
    const message = `Merhaba, ${profile.full_name || 'Diyetisyen'} ile randevu talebim oluşturuldu. Randevu detayları: ${format(selectedDate, 'd MMMM yyyy', { locale: tr })} ${selectedTime}`
    const phone = profile.phone.replace(/\D/g, '')
    if (phone.startsWith('0')) {
      return `https://wa.me/90${phone.substring(1)}?text=${encodeURIComponent(message)}`
    }
    if (!phone.startsWith('90')) {
      return `https://wa.me/90${phone}?text=${encodeURIComponent(message)}`
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-md mx-auto">
          <X className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Diyetisyen Bulunamadı
          </h1>
          <p className="text-gray-600 mb-6">
            Aradığınız diyetisyen bulunamadı veya randevu sayfası mevcut değil.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Profile Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar with Initials */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl md:text-5xl font-bold">
                {getInitials(profile.full_name)}
              </span>
            </div>

            {/* Name */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {profile.full_name || 'Diyetisyen'}
              </h1>
              {profile.clinic_name && (
                <p className="text-lg md:text-xl text-gray-600 font-medium">
                  {profile.clinic_name}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm md:text-base text-gray-700 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {profile.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-700"
                >
                  <Globe className="w-4 h-4" />
                  <span>Web Sitesi</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Calendar Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tarih Seçin
          </h2>
          
          {/* Date Picker - Horizontal Scroll */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex space-x-2 min-w-max">
              {availableDates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const todayStr = format(new Date(), 'yyyy-MM-dd')
                const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr
                const isToday = dateStr === todayStr
                const isPastDate = isPast(date) && dateStr !== todayStr

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isPastDate}
                    className={`flex-shrink-0 w-20 md:w-24 p-3 rounded-lg border-2 text-center transition-colors min-h-[80px] ${
                      isSelected
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : isPastDate
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : isToday
                            ? 'border-green-300 bg-green-50 text-gray-700 hover:border-green-400'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(date, 'EEE', { locale: tr })}
                    </div>
                    <div className="text-2xl font-bold">
                      {format(date, 'd')}
                    </div>
                    <div className="text-xs">
                      {format(date, 'MMM', { locale: tr })}
                    </div>
                    {isToday && (
                      <div className="text-[10px] text-green-600 font-medium mt-1">
                        Bugün
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Time Slots Section */}
        {selectedDate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Saat Seçin
            </h2>
            {timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {timeSlots.map((time) => {
                  const isBooked = bookedSlots.has(time)
                  const isSelected = selectedTime === time

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSelect(time)}
                      disabled={isBooked}
                      className={`p-4 rounded-lg border-2 text-sm font-medium transition-colors min-h-[56px] ${
                        isSelected
                          ? 'border-green-600 bg-green-600 text-white shadow-md'
                          : isBooked
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                            : 'border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 active:scale-95'
                      }`}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Bu tarih için uygun saat bulunmuyor.
              </p>
            )}
          </div>
        )}

        {/* Booking Form */}
        {selectedDate && selectedTime && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Randevu Bilgileri
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.guest_name}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_name: e.target.value })
                  }
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Adınız ve soyadınız"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.guest_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_phone: e.target.value })
                  }
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="+90 555 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  placeholder="Eklemek istediğiniz notlar..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-md active:scale-98"
              >
                {submitting ? 'Gönderiliyor...' : 'Randevu Oluştur'}
              </button>
            </form>
          </div>
        )}

        {/* Empty State */}
        {!selectedDate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Randevu oluşturmak için yukarıdan bir tarih seçin.
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Confirmation Modal */}
      {showWhatsAppModal && bookingSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Randevu Talebi Oluşturuldu!
              </h2>
              <p className="text-gray-600">
                Randevunuz onay bekliyor. Diyetisyen ile WhatsApp üzerinden iletişime geçmek ister misiniz?
              </p>
            </div>

            <div className="space-y-3">
              {profile.phone && (
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-base shadow-md active:scale-98"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>WhatsApp ile İletişime Geç</span>
                </a>
              )}
              <button
                onClick={() => {
                  setShowWhatsAppModal(false)
                  // Reset form
                  setFormData({ guest_name: '', guest_phone: '', note: '' })
                  setSelectedDate(null)
                  setSelectedTime(null)
                  setBookingSuccess(false)
                }}
                className="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base active:scale-98"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

