'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle,
  Globe,
  Share2,
  Copy,
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, addMinutes, startOfDay, endOfDay, parseISO, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'

type Profile = {
  id: string
  full_name: string | null
  clinic_name: string | null
  phone: string | null
  bio: string | null
  website: string | null
  avatar_url: string | null
  work_start_hour: number | null
  work_end_hour: number | null
  session_duration: number | null
}

type Appointment = {
  id: string
  start_time: string
  status: string
}

type TimeSlot = {
  time: string
  isBooked: boolean
}

export default function PublicBookingPage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [params.slug])

  useEffect(() => {
    if (profile) {
      const dietitianName = profile.full_name || profile.clinic_name || 'Diyetisyen'
      document.title = `${dietitianName} - Online Randevu | OfisDyt`
    }
  }, [profile])

  useEffect(() => {
    if (selectedDate && profile) {
      generateTimeSlots()
    } else {
      setTimeSlots([])
    }
  }, [selectedDate, profile])

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('public_slug', params.slug)
      .single()

    if (error || !data) {
      setError('Dietitian not found')
      setLoading(false)
      return
    }

    setProfile(data)
    setLoading(false)
  }

  const generateTimeSlots = async () => {
    if (!selectedDate || !profile) return

    setLoadingSlots(true)

    // Get profile settings with fallbacks
    const workStartHour = profile.work_start_hour || 9
    const workEndHour = profile.work_end_hour || 17
    const sessionDuration = profile.session_duration || 60

    // Fetch existing appointments for the selected date
    const inputDate = new Date(selectedDate)
    const targetDateStr = format(inputDate, 'yyyy-MM-dd')

    const dateParts = targetDateStr.split('-')
    const year = parseInt(dateParts[0])
    const month = parseInt(dateParts[1]) - 1
    const day = parseInt(dateParts[2])

    const prevDay = new Date(Date.UTC(year, month, day - 1, 0, 0, 0, 0))
    const nextDay = new Date(Date.UTC(year, month, day + 1, 23, 59, 59, 999))

    const startOfDayISO = prevDay.toISOString()
    const endOfDayISO = nextDay.toISOString()

    const { data: appointments, error: queryError } = await supabase
      .from('appointments')
      .select('start_time, status')
      .eq('dietitian_id', profile.id)
      .gte('start_time', startOfDayISO)
      .lte('start_time', endOfDayISO)
      .in('status', ['pending', 'approved'])

    const allAppointments = (appointments as Appointment[]) || []

    // Filter appointments to only include those on the selected day (in local time)
    const existingAppointments = allAppointments.filter((apt) => {
      const apptDate = new Date(apt.start_time)
      const apptDateStr = format(apptDate, 'yyyy-MM-dd')
      return apptDateStr === targetDateStr
    })

    // Normalization: Create a Set of booked times in "HH:mm" format (local time)
    const bookedTimes = new Set<string>()

    existingAppointments.forEach((apt) => {
      const apptDate = new Date(apt.start_time)
      const localTime = apptDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      bookedTimes.add(localTime)
    })

    // Generate time slots
    const slots: TimeSlot[] = []
    let currentTime = new Date(selectedDate)
    currentTime.setHours(workStartHour, 0, 0, 0)

    const endTime = new Date(selectedDate)
    endTime.setHours(workEndHour, 0, 0, 0)

    while (currentTime < endTime) {
      const slotEndTime = addMinutes(currentTime, sessionDuration)

      if (slotEndTime > endTime) {
        break
      }

      const slotLocalTime = currentTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

      const isBooked = bookedTimes.has(slotLocalTime)

      slots.push({
        time: slotLocalTime,
        isBooked,
      })

      currentTime = addMinutes(currentTime, sessionDuration)
    }

    setTimeSlots(slots)
    setLoadingSlots(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!selectedDate || !selectedTime || !profile) {
      setError('Lütfen bir tarih ve saat seçin')
      setSubmitting(false)
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const appointmentDate = new Date(selectedDate)
    appointmentDate.setHours(hours, minutes, 0, 0)

    const { error: insertError } = await supabase
      .from('appointments')
      .insert({
        dietitian_id: profile.id,
        guest_name: formData.name,
        guest_phone: formData.phone,
        start_time: appointmentDate.toISOString(),
        status: 'pending',
      })

    if (insertError) {
      setError('Randevu oluşturulurken hata: ' + insertError.message)
    } else {
      setSuccess(true)
      setFormData({ name: '', phone: '' })
      setSelectedDate(undefined)
      setSelectedTime('')
      setTimeSlots([])
    }
    setSubmitting(false)
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulunamadı</h1>
          <p className="text-gray-600">
            {error === 'Dietitian not found' ? 'Diyetisyen bulunamadı' : error}
          </p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const disabledDays = { before: new Date() }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {success ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Randevu Talebi Gönderildi!
            </h2>
            <p className="text-gray-600 mb-6">
              Randevu talebiniz gönderildi. Diyetisyen talebinizi inceleyip onaylayacaktır.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Yeni Randevu Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile Card (30% on desktop) */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Share Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Linki Paylaş"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Paylaş</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Clinic Name */}
                {profile.clinic_name && (
                  <h1 className="text-2xl font-bold text-green-600 mb-2">
                    {profile.clinic_name}
                  </h1>
                )}

                {/* Dietitian Name */}
                {profile.full_name && (
                  <p className="text-lg text-gray-700 mb-4">
                    {profile.full_name.startsWith('Dyt.') || profile.full_name.startsWith('Dr.')
                      ? profile.full_name
                      : `Dyt. ${profile.full_name}`}
                  </p>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Hakkımda</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Contact Details */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center space-x-3 text-gray-700 hover:text-green-600 transition-colors"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-sm">{profile.phone}</span>
                    </a>
                  )}

                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-gray-700 hover:text-green-600 transition-colors"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-sm truncate">{profile.website}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Calendar & Booking Form (70% on desktop) */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8"
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Randevu Oluştur</h2>
                  <p className="text-gray-600">Tarih ve saat seçerek randevu talebi oluşturun</p>
                </div>

                {/* Calendar */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Tarih Seçin</h3>
                  </div>
                  <div className="flex justify-center">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={disabledDays}
                      locale={tr}
                      className="rounded-lg border border-gray-200 p-4"
                    />
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="w-5 h-5 text-green-600" />
                      <h3 className="text-xl font-semibold text-gray-900">Saat Seçin</h3>
                      {loadingSlots && (
                        <span className="text-sm text-gray-500">Yükleniyor...</span>
                      )}
                    </div>
                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Bu tarih için müsait saat bulunmuyor
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => {
                              if (!slot.isBooked) {
                                setSelectedTime(slot.time)
                              }
                            }}
                            disabled={slot.isBooked}
                            className={`px-4 py-3 rounded-lg border-2 transition-colors font-medium ${
                              slot.isBooked
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : selectedTime === slot.time
                                ? 'border-green-600 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-green-300 text-gray-700'
                            }`}
                          >
                            {slot.isBooked ? 'Dolu' : slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Form */}
                {selectedDate && selectedTime && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="w-5 h-5 text-green-600" />
                      <h3 className="text-xl font-semibold text-gray-900">Bilgileriniz</h3>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adınız Soyadınız <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon Numaranız <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="+90 555 123 4567"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg active:scale-95"
                    >
                      {submitting ? 'Gönderiliyor...' : 'Randevu Talebi Gönder'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
