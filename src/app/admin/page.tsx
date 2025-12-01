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
} from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'

type UserWithEmail = {
  id: string
  full_name: string | null
  email: string | null
  clinic_name: string | null
  is_admin: boolean | null
  subscription_status: 'active' | 'expired' | 'suspended' | null
  subscription_ends_at: string | null
  created_at: string
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalAppointments: 0,
  })
  const [users, setUsers] = useState<UserWithEmail[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized])

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const term = searchTerm.toLowerCase()
    return users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.clinic_name?.toLowerCase().includes(term)
    )
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
      router.push('/')
      return
    }

    setIsAuthorized(true)
  }

  const loadData = async () => {
    setLoading(true)

    // Load from admin_users_view (includes email)
    const { data: profiles, error } = await supabase
      .from('admin_users_view')
      .select('id, full_name, email, clinic_name, is_admin, subscription_status, subscription_ends_at, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', error)
      // Fallback to profiles table if view doesn't exist
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fallbackData) {
        setUsers(fallbackData.map((p) => ({ ...p, email: null })) as UserWithEmail[])
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

  const getStatusBadge = (status: string | null) => {
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
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Belirtilmemiş
          </span>
        )
    }
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
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Panele Dön</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    Klinik Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonelik Durumu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonelik Bitiş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Kullanıcı bulunamadı'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'İsimsiz'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.clinic_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.subscription_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.subscription_ends_at
                          ? format(new Date(user.subscription_ends_at), 'd MMMM yyyy', {
                              locale: tr,
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
