'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Calendar, DollarSign, Clock, Link as LinkIcon, Copy, Check, ExternalLink, Share2 } from 'lucide-react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Appointment } from '@/lib/types'
import { toast } from 'sonner'

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
  const [publicSlug, setPublicSlug] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setUser(user)

    // Get user profile for name and slug
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, public_slug')
      .eq('id', user.id)
      .single()

    if (profile?.full_name) {
      setUserName(profile.full_name)
    }
    if (profile?.public_slug) {
      setPublicSlug(profile.public_slug)
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

      {/* Personal Booking Link Hero Card */}
      <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl shadow-lg border-2 border-teal-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Kişisel Randevu Sayfanız
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Danışanlarınız bu linkten randevu alabilir
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium hidden md:block"
          >
            Ayarlardan Düzenle
          </Link>
        </div>
        {publicSlug ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-4 bg-white rounded-lg border-2 border-teal-200 shadow-sm">
              <code className="flex-1 text-sm md:text-base text-gray-900 font-mono break-all">
                diyetlik.com/book/{publicSlug}
              </code>
              <div className="flex items-center gap-2">
                <CopyButton text={`https://diyetlik.com/book/${publicSlug}`} />
                <a
                  href={`https://diyetlik.com/book/${publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
                  title="Sayfaya Git"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Sayfaya Git</span>
                </a>
                <ShareButton url={`https://diyetlik.com/book/${publicSlug}`} />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Bu linki danışanlarınızla paylaşarak randevu almalarını sağlayabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border-2 border-dashed border-teal-300 p-6 text-center">
              <LinkIcon className="w-12 h-12 text-teal-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-2">
                Randevu linkiniz henüz oluşturulmamış
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Ayarlar sayfasından bir slug belirleyerek linkinizi oluşturun.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                <LinkIcon className="w-5 h-5" />
                <span>Link Oluştur</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Link kopyalandı!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Kopyalama başarısız')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      title="Kopyala"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-gray-600" />
      )}
    </button>
  )
}

function ShareButton({ url }: { url: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Randevu Sayfam',
          text: 'Randevu almak için bu linki kullanabilirsiniz',
          url: url,
        })
        toast.success('Paylaşıldı!')
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          toast.error('Paylaşım başarısız')
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link kopyalandı!')
      } catch (err) {
        toast.error('Kopyalama başarısız')
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm min-h-[44px]"
      title="Paylaş"
    >
      <Share2 className="w-4 h-4" />
      <span className="hidden sm:inline">Paylaş</span>
    </button>
  )
}

