'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  isSameDay,
  isSameMonth,
  getDay,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import MonthView from './MonthView'
import WeekView from './WeekView'
import DayView from './DayView'
import AppointmentDialog from './AppointmentDialog'
import EditAppointmentDialog from './EditAppointmentDialog'
import AppointmentsListDialog from './AppointmentsListDialog'
import { Appointment } from './types'

type ViewType = 'month' | 'week' | 'day'

type ProfileSettings = {
  work_start_hour: number | null
  work_end_hour: number | null
  session_duration: number | null
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    work_start_hour: 9,
    work_end_hour: 18,
    session_duration: 60,
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('month')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isListDialogOpen, setIsListDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadProfileSettings()
    loadAppointments()
  }, [currentDate, view])

  const loadProfileSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('work_start_hour, work_end_hour, session_duration')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfileSettings({
        work_start_hour: data.work_start_hour || 9,
        work_end_hour: data.work_end_hour || 18,
        session_duration: data.session_duration || 60,
      })
    }
  }

  const loadAppointments = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    let startDate: Date
    let endDate: Date

    if (view === 'month') {
      startDate = startOfMonth(currentDate)
      endDate = endOfMonth(currentDate)
    } else if (view === 'week') {
      startDate = startOfWeek(currentDate, { locale: tr })
      endDate = endOfWeek(currentDate, { locale: tr })
    } else {
      // day view
      startDate = startOfDay(currentDate)
      endDate = endOfDay(currentDate)
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
        *,
        clients:client_id (
          name,
          phone
        )
      `
      )
      .eq('dietitian_id', user.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true })

    if (!error && data) {
      setAppointments(data as Appointment[])
    }
    setLoading(false)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subDays(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const getDateLabel = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: tr })
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: tr })
      const weekEnd = endOfWeek(currentDate, { locale: tr })
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, 'd', { locale: tr })} - ${format(weekEnd, 'd MMMM yyyy', { locale: tr })}`
      } else {
        return `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMMM yyyy', { locale: tr })}`
      }
    } else {
      return format(currentDate, 'd MMMM yyyy', { locale: tr })
    }
  }

  const handleOpenDialog = (date?: Date, time?: string) => {
    if (date && time) {
      setSelectedSlot({ date, time })
    } else {
      setSelectedSlot(null)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedSlot(null)
  }

  const handleAppointmentCreated = () => {
    loadAppointments()
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    console.log('Appointment clicked:', appointment)
    setSelectedAppointment(appointment)
    setIsEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setSelectedAppointment(null)
  }

  const handleAppointmentUpdated = async () => {
    await loadAppointments()
    router.refresh()
  }

  const handleAppointmentDeleted = async () => {
    await loadAppointments()
    router.refresh()
  }

  const handleOpenListDialog = () => {
    setIsListDialogOpen(true)
  }

  const handleCloseListDialog = () => {
    setIsListDialogOpen(false)
  }

  const handleEditFromList = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsEditDialogOpen(true)
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

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Today + Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToday}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Bugün
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Önceki"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Sonraki"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px]">
              {getDateLabel()}
            </h2>
          </div>

          {/* Right: Add Button + View Switcher */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenListDialog}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              <Pencil className="w-4 h-4" />
              <span>Randevu Düzenle</span>
            </button>
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Randevu Ekle</span>
            </button>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'day'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Günlük
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Haftalık
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Aylık
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {view === 'month' && (
          <MonthView currentDate={currentDate} appointments={appointments} />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            onSlotClick={handleOpenDialog}
            onAppointmentClick={handleAppointmentClick}
            workStartHour={profileSettings.work_start_hour}
            workEndHour={profileSettings.work_end_hour}
            sessionDuration={profileSettings.session_duration}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            appointments={appointments}
            onSlotClick={handleOpenDialog}
            onAppointmentClick={handleAppointmentClick}
            workStartHour={profileSettings.work_start_hour}
            workEndHour={profileSettings.work_end_hour}
            sessionDuration={profileSettings.session_duration}
          />
        )}
      </div>

      {/* Appointment Dialog */}
      <AppointmentDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleAppointmentCreated}
        initialDate={selectedSlot?.date}
        initialTime={selectedSlot?.time}
      />

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSuccess={handleAppointmentUpdated}
        onDelete={handleAppointmentDeleted}
        appointment={selectedAppointment}
      />

      {/* Appointments List Dialog */}
      <AppointmentsListDialog
        isOpen={isListDialogOpen}
        onClose={handleCloseListDialog}
        onEdit={handleEditFromList}
      />
    </div>
  )
}
