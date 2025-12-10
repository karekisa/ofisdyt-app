'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  UserCog,
  ArrowLeft,
  Search,
  CalendarPlus,
  CalendarMinus,
  MoreVertical,
  X,
  HelpCircle,
  Edit,
  MessageSquare,
  MessageCircle,
  Crown,
  Star,
} from 'lucide-react'
import UserInspectorModal from './UserInspectorModal'
import AnnouncementManager from './AnnouncementManager'
import { format, addMonths, subMonths, formatDistanceToNow, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

type UserWithEmail = {
  id: string
  full_name: string | null
  email: string | null
  clinic_name: string | null
  phone: string | null
  public_slug: string | null
  is_admin: boolean | null
  is_founding_member: boolean | null
  subscription_status: 'active' | 'expired' | 'suspended' | null
  subscription_ends_at: string | null
  trial_ends_at: string | null
  last_sign_in_at: string | null
  client_count: number
  appointment_count: number
  created_at: string
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalAppointments: 0,
    totalSmsSent: 0,
  })
  const [users, setUsers] = useState<UserWithEmail[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserWithEmail | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized])

  // Filter and sort users - prioritize expiring trials
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = users.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.clinic_name?.toLowerCase().includes(term)
      )
    }

    // Sort: Expiring trials first (within 3 days), then by trial end date
    return filtered.sort((a, b) => {
      const aTrialEnd = a.trial_ends_at ? new Date(a.trial_ends_at) : null
      const bTrialEnd = b.trial_ends_at ? new Date(b.trial_ends_at) : null
      const now = new Date()

      // Check if trial is expiring soon (<= 3 days)
      const aExpiringSoon = aTrialEnd && differenceInDays(aTrialEnd, now) <= 3 && differenceInDays(aTrialEnd, now) >= 0
      const bExpiringSoon = bTrialEnd && differenceInDays(bTrialEnd, now) <= 3 && differenceInDays(bTrialEnd, now) >= 0

      // Expiring soon users first
      if (aExpiringSoon && !bExpiringSoon) return -1
      if (!aExpiringSoon && bExpiringSoon) return 1

      // Then sort by trial end date (soonest first)
      if (aTrialEnd && bTrialEnd) {
        return aTrialEnd.getTime() - bTrialEnd.getTime()
      }
      if (aTrialEnd) return -1
      if (bTrialEnd) return 1

      return 0
    })
  }, [users, searchTerm])

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_admin) {
      router.push('/dashboard')
      return
    }

    setIsAuthorized(true)
  }

  const loadData = async () => {
    setLoading(true)

    // Load from admin_users_view (includes email)
    const { data: profiles, error } = await supabase
      .from('admin_users_view')
      .select('id, full_name, email, clinic_name, phone, public_slug, is_admin, is_founding_member, subscription_status, subscription_ends_at, trial_ends_at, last_sign_in_at, client_count, appointment_count, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', error)
      // Fallback to profiles table if view doesn't exist
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fallbackData) {
        setUsers(fallbackData.map((p) => ({ 
          ...p, 
          email: null,
          last_sign_in_at: null,
          client_count: 0,
          appointment_count: 0,
          is_founding_member: p.is_founding_member || false,
        })) as UserWithEmail[])
      }
    } else if (profiles) {
      // Filter out admins for user count
      const nonAdminProfiles = profiles.filter((p) => !p.is_admin)

      // Count active subscriptions
      const activeSubs = profiles.filter(
        (p) => p.subscription_status === 'active'
      ).length

      setStats({
        totalUsers: nonAdminProfiles.length,
        activeSubscriptions: activeSubs,
        totalAppointments: 0,
        totalSmsSent: 0,
      })

      setUsers(profiles as UserWithEmail[])
    }

    // Load total appointments count
    const { count: appointmentsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })

    if (appointmentsCount !== null) {
      setStats((prev) => ({
        ...prev,
        totalAppointments: appointmentsCount,
      }))
    }

    // Calculate SMS usage (confirmed appointments + verifications)
    // This is a rough estimate: count confirmed/completed appointments
    const { count: confirmedAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'completed'])

    // Rough estimate: each confirmed appointment = 1 SMS (confirmation)
    // We can add more sophisticated tracking later
    const smsEstimate = confirmedAppointments || 0

    setStats((prev) => ({
      ...prev,
      totalSmsSent: smsEstimate,
    }))

    setLoading(false)
  }

  const updateSubscription = async (userId: string, monthsToAdd: number) => {
    // Get current subscription data
    const user = users.find((u) => u.id === userId)
    if (!user) return

    let newEndDate: Date

    if (user.subscription_ends_at) {
      const currentEnd = new Date(user.subscription_ends_at)
      // If current end date is in the past, use today as base
      if (currentEnd < new Date()) {
        newEndDate = addMonths(new Date(), monthsToAdd)
      } else {
        newEndDate = addMonths(currentEnd, monthsToAdd)
      }
    } else {
      // No existing date, start from now
      newEndDate = addMonths(new Date(), monthsToAdd)
    }

    // Don't allow dates in the past
    if (newEndDate < new Date()) {
      newEndDate = new Date()
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: newEndDate > new Date() ? 'active' : 'expired',
        subscription_ends_at: newEndDate.toISOString(),
      })
      .eq('id', userId)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      setActiveDropdown(null)
      loadData()
      router.refresh()
    }
  }

  const handleExpireSubscription = async (userId: string) => {
    if (!window.confirm('Bu kullanıcının aboneliğini süresiz olarak kapatmak istediğinize emin misiniz?')) {
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'expired',
      })
      .eq('id', userId)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      setActiveDropdown(null)
      loadData()
      router.refresh()
    }
  }

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'admin yetkisini kaldırmak' : 'admin yetkisi vermek'
    if (!window.confirm(`Bu kullanıcıdan ${action} istediğinize emin misiniz?`)) {
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_admin: !currentStatus,
      })
      .eq('id', userId)

    if (!error) {
      loadData()
      router.refresh()
    } else {
      alert('Hata: ' + error.message)
    }
  }

  const toggleFoundingMember = async (userId: string, currentValue: boolean) => {
    const action = currentValue ? 'Kurucu Üye statüsünü kaldırmak' : 'Kurucu Üye statüsü vermek'
    if (!window.confirm(`Bu kullanıcıya ${action} istediğinize emin misiniz?`)) {
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_founding_member: !currentValue,
      })
      .eq('id', userId)

    if (!error) {
      toast.success(currentValue ? 'Kurucu Üye statüsü kaldırıldı' : 'Kurucu Üye statüsü verildi')
      loadData()
      router.refresh()
    } else {
      toast.error('Hata: ' + error.message)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  const getStatusBadge = (status: string | null, trialEndsAt: string | null) => {
    // Check if trial is expiring soon
    const trialExpiringSoon = trialEndsAt && (() => {
      const trialEnd = new Date(trialEndsAt)
      const daysLeft = differenceInDays(trialEnd, new Date())
      return daysLeft <= 3 && daysLeft >= 0
    })()

    if (trialExpiringSoon) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 animate-pulse">
          ⚠️ Bitiyor!
        </span>
      )
    }

    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Aktif
          </span>
        )
      case 'expired':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Süresi Dolmuş
          </span>
        )
      case 'suspended':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Askıya Alınmış
          </span>
        )
      default:
        // Trial status
        if (trialEndsAt) {
          const trialEnd = new Date(trialEndsAt)
          const daysLeft = differenceInDays(trialEnd, new Date())
          if (daysLeft < 0) {
            return (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                Deneme Bitti
              </span>
            )
          }
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              Deneme ({daysLeft} gün)
            </span>
          )
        }
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Belirtilmemiş
          </span>
        )
    }
  }

  const handleWhatsAppClick = (phone: string | null, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!phone) {
      toast.error('Telefon numarası bulunamadı')
      return
    }

    // Format phone for WhatsApp (remove spaces, +, etc.)
    const cleanPhone = phone.replace(/[\s\+\-\(\)]/g, '')
    const message = encodeURIComponent('Merhaba, Diyetlik deneyiminiz nasıl gidiyor?')
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Yönetici Paneli</h1>
              <p className="text-gray-600 mt-1">SaaS yönetim ve kullanıcı kontrolü</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/support-tickets"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Destek Talepleri</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Panele Dön</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktif Abonelikler</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeSubscriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Randevu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalAppointments}
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
                <p className="text-sm text-gray-600">Tahmini SMS Gönderimi</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalSmsSent}
                </p>
                <p className="text-xs text-gray-500 mt-1">Onaylı randevular</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
              
              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ara (Ad, Email, Klinik)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deneme Bitiş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktivite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurucu Üye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Kullanıcı bulunamadı'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const trialEndDate = user.trial_ends_at ? new Date(user.trial_ends_at) : null
                    const isTrialExpired = trialEndDate && trialEndDate < new Date()
                    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsInspectorOpen(true)
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.full_name || 'İsimsiz'}
                                </div>
                                {user.is_founding_member && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Crown className="w-3 h-3 mr-1" />
                                    👑 Kurucu Üye
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {user.clinic_name || '-'}
                              </div>
                              {user.is_admin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-600 font-mono">
                            {user.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.subscription_status, user.trial_ends_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {trialEndDate ? (
                            <div className={`text-sm ${isTrialExpired ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {format(trialEndDate, 'd MMM', { locale: tr })}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm space-y-1">
                            {lastSignIn ? (
                              <div className="text-gray-600">
                                Son Giriş: {formatDistanceToNow(lastSignIn, { addSuffix: true, locale: tr })}
                              </div>
                            ) : (
                              <div className="text-gray-400">Hiç giriş yapmamış</div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>👥 {user.client_count || 0}</span>
                              <span>📅 {user.appointment_count || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {user.is_founding_member ? (
                            <button
                              onClick={() => toggleFoundingMember(user.id, true)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors bg-yellow-500 text-white hover:bg-yellow-600"
                              title="Kurucu Üye Statüsünü Kaldır"
                            >
                              <Crown className="w-3 h-3 mr-1" />
                              Kurucu Üye
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleFoundingMember(user.id, false)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
                              title="Kurucu Üye Yap"
                            >
                              <Star className="w-3 h-3 mr-1" />
                              Yap
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            {user.phone && (
                              <button
                                onClick={(e) => handleWhatsAppClick(user.phone, e)}
                                className="inline-flex items-center justify-center w-9 h-9 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors"
                                title="WhatsApp ile İletişim"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setIsInspectorOpen(true)
                              }}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors bg-blue-600 text-white hover:bg-blue-700"
                              title="Detayları Görüntüle/Düzenle"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                user.is_admin
                                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                              title={user.is_admin ? 'Admin Yetkisini Kaldır' : 'Admin Yap'}
                            >
                              <UserCog className="w-3 h-3 mr-1" />
                              {user.is_admin ? 'Admin Kaldır' : 'Admin Yap'}
                            </button>

                            {/* Subscription Actions Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveDropdown(
                                    activeDropdown === user.id ? null : user.id
                                  )
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
                                title="Abonelik İşlemleri"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>

                              {activeDropdown === user.id && (
                                <div
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => updateSubscription(user.id, 1)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                      <CalendarPlus className="w-4 h-4" />
                                      <span>+1 Ay Ekle</span>
                                    </button>
                                    <button
                                      onClick={() => updateSubscription(user.id, 12)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                      <CalendarPlus className="w-4 h-4" />
                                      <span>+1 Yıl Ekle</span>
                                    </button>
                                    <button
                                      onClick={() => updateSubscription(user.id, -1)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                      <CalendarMinus className="w-4 h-4" />
                                      <span>-1 Ay Düşür</span>
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                      onClick={() => handleExpireSubscription(user.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      <span>Süresiz Kapat</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcement Manager */}
        <div className="mt-6">
          <AnnouncementManager />
        </div>
      </div>

      {/* User Inspector Modal */}
      <UserInspectorModal
        user={selectedUser}
        isOpen={isInspectorOpen}
        onClose={() => {
          setIsInspectorOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={() => {
          loadData()
          router.refresh()
        }}
      />
    </div>
  )
}
