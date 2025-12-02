'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
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
      .select('work_start_hour, work_end_hour')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile({
        work_start_hour: profileData.work_start_hour || 9,
        work_end_hour: profileData.work_end_hour || 17,
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
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() - 1)
        return newDate
      })
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1))
    } else {
      setCurrentDate((prev) => subMonths(prev, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() + 1)
        return newDate
      })
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1))
    } else {
      setCurrentDate((prev) => addMonths(prev, 1))
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Takvim</h1>
            <p className="text-gray-600 mt-1">Randevularınızı yönetin</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsListDialogOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Randevu Listesi</span>
            </button>
            <button
              onClick={() => {
                setSelectedDate(new Date())
                setIsAppointmentDialogOpen(true)
              }}
              className="hidden md:inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Randevu</span>
            </button>
          </div>
        </div>

        {/* Navigation Bar with View Switcher */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: Navigation */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Önceki"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Bugün
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Sonraki"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 ml-2 md:ml-4">
                {getDateRangeLabel()}
              </h2>
            </div>

            {/* Right: View Mode Switcher */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'day'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Günlük
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Haftalık
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Aylık
                </button>
              </div>
            </div>
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
          onEdit={(appointment) => {
            setSelectedAppointment(appointment)
            setIsEditDialogOpen(true)
            setIsListDialogOpen(false)
          }}
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

      {/* Mobile FAB */}
      <button
        onClick={() => {
          setSelectedDate(new Date())
          setIsAppointmentDialogOpen(true)
        }}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center z-40 active:scale-95"
        aria-label="Yeni Randevu"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
