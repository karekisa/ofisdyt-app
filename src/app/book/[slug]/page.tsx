'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Phone, MessageSquare, CheckCircle, X } from 'lucide-react'
import { format, addDays, isPast, setHours, setMinutes, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { generateTimeSlots } from '@/app/(dashboard)/calendar/utils'
import { Profile, Appointment } from '@/lib/types'
import { getInitials } from '@/lib/utils'

export default function BookingPage({ params }: { params: { slug: string } }) {
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
  }, [params.slug])

  useEffect(() => {
    if (selectedDate && profile) {
      loadBookedSlots()
    }
  }, [selectedDate, profile])

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('public_slug', params.slug)
      .single()

    if (error || !data) {
      setLoading(false)
      return
    }

    setProfile(data as unknown as Profile)

    setLoading(false)
  }

  const loadBookedSlots = async () => {
    if (!selectedDate || !profile) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('appointments')
      .select('start_time, status')
      .eq('dietitian_id', profile.id)
      .in('status', ['pending', 'approved'])
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())

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
    return generateTimeSlots(
      profile.work_start_hour || 9,
      profile.work_end_hour || 17,
      profile.session_duration || 60
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
    if (isPast(date) && format(date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) {
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
      alert('Lütfen tarih ve saat seçin')
      return
    }

    if (!formData.guest_name || !formData.guest_phone) {
      alert('Lütfen ad ve telefon bilgilerinizi girin')
      return
    }

    setSubmitting(true)

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const appointmentDateTime = new Date(selectedDate)
    appointmentDateTime.setHours(hours, minutes, 0, 0)

    const { error } = await supabase.from('appointments').insert({
      dietitian_id: profile.id,
      guest_name: formData.guest_name,
      guest_phone: formData.guest_phone,
      start_time: appointmentDateTime.toISOString(),
      status: 'pending',
    })

    if (error) {
      alert('Randevu oluşturulurken hata: ' + error.message)
      setSubmitting(false)
      return
    }

    setBookingSuccess(true)
    setShowWhatsAppModal(true)
    setSubmitting(false)
  }

  const getWhatsAppUrl = () => {
    if (!profile?.phone || !formData.guest_phone) return ''
    const message = `Merhaba, ${profile.full_name || 'Diyetisyen'} ile randevu talebim oluşturuldu. Randevu detayları: ${format(selectedDate!, 'd MMMM yyyy', { locale: tr })} ${selectedTime}`
    const phone = profile.phone.replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <X className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Diyetisyen Bulunamadı
          </h1>
          <p className="text-gray-600">
            Aradığınız diyetisyen bulunamadı veya randevu sayfası mevcut değil.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="text-center mb-6">
                {/* Text-Based Avatar with Initials */}
                <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl font-bold">
                    {getInitials(profile.full_name)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.full_name || 'Diyetisyen'}
                </h1>
                {profile.clinic_name && (
                  <p className="text-lg text-gray-600 mb-4 font-medium">
                    {profile.clinic_name}
                  </p>
                )}
              </div>

              {profile.bio && (
                <div className="mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}

              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    Çalışma Saatleri: {profile.work_start_hour}:00 -{' '}
                    {profile.work_end_hour}:00
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Seans Süresi: {profile.session_duration} dakika</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Randevu Oluştur
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tarih Seçin <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                    {availableDates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr
                      const isPastDate = isPast(date) && dateStr !== format(new Date(), 'yyyy-MM-dd')

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          disabled={isPastDate}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                            isSelected
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : isPastDate
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700'
                          }`}
                        >
                          <div>{format(date, 'EEE', { locale: tr })}</div>
                          <div className="text-lg font-bold">
                            {format(date, 'd')}
                          </div>
                          <div className="text-xs">
                            {format(date, 'MMM', { locale: tr })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Saat Seçin <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {timeSlots.map((time) => {
                        const isBooked = bookedSlots.has(time)
                        const isSelected = selectedTime === time

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleTimeSelect(time)}
                            disabled={isBooked}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                              isSelected
                                ? 'border-green-600 bg-green-50 text-green-700'
                                : isBooked
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                    {timeSlots.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Bu tarih için uygun saat bulunmuyor.
                      </p>
                    )}
                  </div>
                )}

                {/* Guest Information */}
                <div className="space-y-4">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Eklemek istediğiniz notlar..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedDate || !selectedTime}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  {submitting ? 'Gönderiliyor...' : 'Randevu Oluştur'}
                </button>
              </form>
            </div>
          </div>
        </div>
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
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
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
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
