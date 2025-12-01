'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Calendar, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type Appointment = {
  id: string
  guest_name: string | null
  guest_phone: string | null
  start_time: string
  client_id: string | null
  clients?: { name: string } | null
}

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setUser(user)

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
    const currentMonthStart = new Date()
    currentMonthStart.setDate(1)
    currentMonthStart.setHours(0, 0, 0, 0)
    const currentMonthEnd = new Date()
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1)
    currentMonthEnd.setDate(0)
    currentMonthEnd.setHours(23, 59, 59, 999)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('dietitian_id', user.id)
      .eq('type', 'income')
      .gte('transaction_date', currentMonthStart.toISOString().split('T')[0])
      .lte('transaction_date', currentMonthEnd.toISOString().split('T')[0])

    const monthlyRevenue =
      transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

    setStats({
      totalClients: clientsCount || 0,
      todayAppointments: todayCount || 0,
      revenue: monthlyRevenue,
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
        <h1 className="text-3xl font-bold text-gray-900">Panel</h1>
        <p className="text-gray-600 mt-1">Tekrar hoş geldiniz!</p>
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
              <p className="text-sm text-gray-600">Gelir</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₺{stats.revenue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Bekleyen Randevu Talepleri
            </h2>
          </div>
        </div>
        <div className="p-6">
          {pendingAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Bekleyen randevu talebi yok
            </p>
          ) : (
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
                      <p className="text-sm text-gray-600 mt-1">
                        {appointment.guest_phone && (
                          <span>Telefon: {appointment.guest_phone}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(
                          new Date(appointment.start_time),
                          'PPpp',
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
          )}
        </div>
      </div>
    </div>
  )
}

