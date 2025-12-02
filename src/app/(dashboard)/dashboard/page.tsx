'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Calendar, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Appointment } from '@/lib/types'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    revenue: 0,
  })
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setUser(user)

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    if (profile?.full_name) {
      setUserName(profile.full_name)
    }

    // Get total clients
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('dietitian_id', user.id)

    // Get today's appointments
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { count: todayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('dietitian_id', user.id)
      .eq('status', 'approved')
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())

    // Get pending appointments
    const { data: pending } = await supabase
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
      .eq('status', 'pending')
      .order('start_time', { ascending: true })

    // Get monthly revenue from transactions
    const currentMonthStart = startOfMonth(new Date())
    const currentMonthEnd = endOfMonth(new Date())

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('dietitian_id', user.id)
      .gte('transaction_date', format(currentMonthStart, 'yyyy-MM-dd'))
      .lte('transaction_date', format(currentMonthEnd, 'yyyy-MM-dd'))

    const revenue =
      transactions?.reduce((sum, t) => {
        return (
          sum + ((t.type as string) === 'income' ? Number(t.amount) : -Number(t.amount))
        )
      }, 0) || 0

    setStats({
      totalClients: clientsCount || 0,
      todayAppointments: todayCount || 0,
      revenue: revenue,
    })

    setPendingAppointments((pending as Appointment[]) || [])
    setLoading(false)
  }

  const handleAppointmentAction = async (
    appointmentId: string,
    status: 'approved' | 'rejected'
  ) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)

    if (!error) {
      loadData()
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {userName ? `Hoşgeldin, ${userName}` : 'Panelim'}
        </h1>
        <p className="text-gray-600 mt-1">İşte bugünkü özetiniz</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Danışan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalClients}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bugünkü Randevular</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.todayAppointments}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bu Ay Gelir</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₺{stats.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Appointments */}
      {pendingAppointments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Bekleyen Randevu Talepleri
                </h2>
              </div>
              <Link
                href="/calendar"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Tümünü Gör
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {appointment.clients?.name ||
                          appointment.guest_name ||
                          'Misafir'}
                      </p>
                      {appointment.guest_phone && (
                        <p className="text-sm text-gray-600 mt-1">
                          Telefon: {appointment.guest_phone}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {format(
                          new Date(appointment.start_time),
                          'd MMMM yyyy, HH:mm',
                          { locale: tr }
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleAppointmentAction(appointment.id, 'approved')
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors active:scale-95 font-medium"
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() =>
                          handleAppointmentAction(appointment.id, 'rejected')
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors active:scale-95 font-medium"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingAppointments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Bekleyen randevu talebi yok</p>
        </div>
      )}
    </div>
  )
}

