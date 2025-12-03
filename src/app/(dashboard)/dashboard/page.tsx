'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Link as LinkIcon, Copy, Check, ExternalLink, Share2, AlertCircle, User, FileText, ArrowRight, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Appointment } from '@/lib/types'
import { toast } from 'sonner'
import { formatPhoneForWhatsapp } from '@/lib/utils'

export default function DashboardPage() {
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>(
    []
  )
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
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

    // Get today's confirmed appointments (with full details for the workflow widget)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { count: todayCount, data: todayData } = await supabase
      .from('appointments')
      .select(
        `
        *,
        clients:client_id (
          id,
          name,
          phone
        )
      `,
        { count: 'exact' }
      )
      .eq('dietitian_id', user.id)
      .eq('status', 'approved')
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())
      .order('start_time', { ascending: true })

    // Get pending appointments (include phone for WhatsApp)
    const { data: pending } = await supabase
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
      .eq('status', 'pending')
      .order('start_time', { ascending: true })

    setPendingAppointments((pending as Appointment[]) || [])
    setTodayAppointments((todayData as Appointment[]) || [])
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

  const handleSendWhatsAppMessage = (appointment: Appointment) => {
    // Get phone number from either client or guest
    const phone = appointment.clients?.phone || appointment.guest_phone
    
    if (!phone) {
      toast.error('Telefon numarası bulunamadı.')
      return
    }

    // Format phone for WhatsApp
    const formattedPhone = formatPhoneForWhatsapp(phone)
    if (!formattedPhone) {
      toast.error('Geçersiz telefon numarası.')
      return
    }

    // Get client name
    const clientName = appointment.clients?.name || appointment.guest_name || 'Sayın Danışan'
    
    // Format date and time
    const appointmentDate = format(parseISO(appointment.start_time), 'd MMMM yyyy', { locale: tr })
    const appointmentTime = format(parseISO(appointment.start_time), 'HH:mm', { locale: tr })

    // Generate message template
    const message = `Merhaba ${clientName}, ${appointmentDate} ${appointmentTime} tarihli randevu talebiniz hakkında yazıyorum...`
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
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

      {/* Pending Appointments - Priority: First actionable item */}
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
                    <div className="flex items-center space-x-2">
                      {/* WhatsApp Message Button */}
                      <button
                        onClick={() => handleSendWhatsAppMessage(appointment)}
                        disabled={!appointment.clients?.phone && !appointment.guest_phone}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="WhatsApp ile Mesaj At"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleAppointmentAction(appointment.id, 'rejected')
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors active:scale-95 font-medium"
                      >
                        Reddet
                      </button>
                      <button
                        onClick={() =>
                          handleAppointmentAction(appointment.id, 'approved')
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors active:scale-95 font-medium"
                      >
                        Onayla
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

      {/* Daily Workflow & To-Do List Widget */}
      <DailyWorkflowWidget
        pendingAppointments={pendingAppointments}
        todayAppointments={todayAppointments}
        loading={loading}
      />

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
                diyetlik.com.tr/randevu/{publicSlug}
              </code>
              <div className="flex items-center gap-2">
                <CopyButton text={`https://diyetlik.com.tr/randevu/${publicSlug}`} />
                <a
                  href={`https://diyetlik.com.tr/randevu/${publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
                  title="Sayfaya Git"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Sayfaya Git</span>
                </a>
                <ShareButton url={`https://diyetlik.com.tr/randevu/${publicSlug}`} />
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

// Daily Workflow & To-Do List Widget Component
function DailyWorkflowWidget({
  pendingAppointments,
  todayAppointments,
  loading,
}: {
  pendingAppointments: Appointment[]
  todayAppointments: Appointment[]
  loading: boolean
}) {
  const tasks: Array<{
    id: string
    type: 'pending' | 'today' | 'diet_list'
    title: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
    action?: {
      label: string
      href: string
    }
    items?: Array<{
      id: string
      name: string
      time?: string
      href?: string
    }>
  }> = []

  // Task A: Bekleyen Randevu Onayları 🚨
  if (pendingAppointments.length > 0) {
    tasks.push({
      id: 'pending',
      type: 'pending',
      title: 'Bekleyen Randevu Onayları',
      description: `${pendingAppointments.length} adet yeni randevu talebi onay bekliyor.`,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: {
        label: 'Takvime Git',
        href: '/calendar',
      },
    })
  }

  // Task B: Bugünkü Randevular 👥
  if (todayAppointments.length > 0) {
    tasks.push({
      id: 'today',
      type: 'today',
      title: "Bugünkü Randevular",
      description: `${todayAppointments.length} adet randevunuz var.`,
      icon: <User className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: {
        label: 'Tümünü Gör',
        href: '/calendar',
      },
      items: todayAppointments.map((apt) => ({
        id: apt.id,
        name: apt.clients?.name || apt.guest_name || 'Misafir',
        time: format(parseISO(apt.start_time), 'HH:mm', { locale: tr }),
        href: apt.client_id ? `/clients/${apt.client_id}` : undefined,
      })),
    })
  }

  // Task C: Diyet Listesi Gönderimi 📝
  tasks.push({
    id: 'diet_list',
    type: 'diet_list',
    title: 'Diyet Listesi Gönderimi',
    description: 'Diyet listesi hazırlamayı unuttuğunuz danışanları kontrol edin.',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    action: {
      label: 'Danışanlara Git',
      href: '/clients',
    },
  })

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-green-50">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-teal-600" />
          <span>Bugün Yapılacaklar Listesi</span>
        </h2>
      </div>

      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Bugün yapılacak acil bir işiniz yok. Rahatlayın! 🏖️
            </p>
            <p className="text-sm text-gray-500">
              Tüm randevularınız planlandı ve işleriniz güncel.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`border-2 rounded-lg p-4 ${task.bgColor} border-opacity-50 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`${task.color} mt-0.5`}>{task.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-gray-900 mb-1 ${task.color}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-700 mb-2">{task.description}</p>

                      {/* Show today's appointments list if available */}
                      {task.items && task.items.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {task.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200"
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {item.name}
                                </span>
                                {item.time && (
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {item.time}
                                  </span>
                                )}
                              </div>
                              {item.href && (
                                <Link
                                  href={item.href}
                                  className="ml-2 p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                  title="Danışan Profiline Git"
                                >
                                  <ArrowRight className="w-4 h-4 text-gray-600" />
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {task.action && (
                    <Link
                      href={task.action.href}
                      className={`inline-flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm whitespace-nowrap flex-shrink-0`}
                      style={{
                        backgroundColor: task.type === 'pending' ? '#dc2626' : task.type === 'today' ? '#16a34a' : '#2563eb',
                      }}
                    >
                      <span>{task.action.label}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

