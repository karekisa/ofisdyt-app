'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import WeekView from './WeekView'
import DayView from './DayView'
import MonthView from './MonthView'
import AppointmentDialog from './AppointmentDialog'
import AppointmentsListDialog from './AppointmentsListDialog'
import EditAppointmentDialog from './EditAppointmentDialog'
import { Appointment } from '@/lib/types'

type ViewMode = 'week' | 'day' | 'month'

export default function CalendarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState<{
    work_start_hour: number
    work_end_hour: number
    session_duration: number
  } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  const [isListDialogOpen, setIsListDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    loadData()
  }, [currentDate, viewMode])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Load profile for work hours
    const { data: profileData } = await supabase
      .from('profiles')
      .select('work_start_hour, work_end_hour, session_duration')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile({
        work_start_hour: profileData.work_start_hour || 9,
        work_end_hour: profileData.work_end_hour || 17,
        session_duration: profileData.session_duration || 60,
      })
    }

    // Calculate date range based on view mode
    let startDate: Date
    let endDate: Date

    if (viewMode === 'day') {
      startDate = new Date(currentDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(currentDate)
      endDate.setHours(23, 59, 59, 999)
    } else if (viewMode === 'week') {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
      endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
    } else {
      startDate = startOfMonth(currentDate)
      endDate = endOfMonth(currentDate)
    }

    // Load appointments
    const { data: appointmentsData, error } = await supabase
      .from('appointments')
      .select(
        `
        *,
        clients:client_id (
          name
        )
      `
      )
      .eq('dietitian_id', user.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error loading appointments:', error)
    } else {
      setAppointments((appointmentsData as Appointment[]) || [])
    }

    setLoading(false)
  }

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsEditDialogOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsAppointmentDialogOpen(true)
  }

  const handleRefresh = () => {
    loadData()
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

  const getDateRangeLabel = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'd MMMM yyyy', { locale: tr })
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: tr })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Takvim</h1>
          <p className="text-gray-600 mt-1">Randevularınızı yönetin</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Gün
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hafta
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ay
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Bugün
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">
              {getDateRangeLabel()}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsListDialogOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Randevu Listesi</span>
            </button>
            <button
              onClick={() => {
                setSelectedDate(new Date())
                setIsAppointmentDialogOpen(true)
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Yeni Randevu
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {viewMode === 'day' && (
          <DayView
            date={currentDate}
            appointments={appointments}
            profile={profile}
            onAppointmentClick={handleAppointmentClick}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            weekStart={startOfWeek(currentDate, { weekStartsOn: 1 })}
            appointments={appointments}
            profile={profile}
            onAppointmentClick={handleAppointmentClick}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'month' && (
          <MonthView
            month={currentDate}
            appointments={appointments}
            onAppointmentClick={handleAppointmentClick}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* Dialogs */}
      {isAppointmentDialogOpen && (
        <AppointmentDialog
          isOpen={isAppointmentDialogOpen}
          onClose={() => {
            setIsAppointmentDialogOpen(false)
            setSelectedDate(null)
          }}
          onSuccess={handleRefresh}
          selectedDate={selectedDate || new Date()}
        />
      )}

      {isListDialogOpen && (
        <AppointmentsListDialog
          isOpen={isListDialogOpen}
          onClose={() => setIsListDialogOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {isEditDialogOpen && selectedAppointment && (
        <EditAppointmentDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setSelectedAppointment(null)
          }}
          onSuccess={handleRefresh}
          appointment={selectedAppointment}
        />
      )}
    </div>
  )
}
