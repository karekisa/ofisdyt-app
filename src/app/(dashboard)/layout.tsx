'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  DollarSign,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'
import SubscriptionStatusWidget from '@/components/SubscriptionStatusWidget'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)

    // Subscription Guard: Check if user has active subscription or valid trial
    // Allow access to subscription page even if expired
    if (profileData && pathname !== '/subscription') {
      const isActive = profileData.subscription_status === 'active'
      const trialEndsAt = profileData.trial_ends_at
        ? new Date(profileData.trial_ends_at)
        : null
      const isTrialValid = trialEndsAt && trialEndsAt > new Date()

      // If not active and trial expired, redirect to subscription page
      if (!isActive && !isTrialValid) {
        router.push('/subscription')
      }
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Panel' },
    { href: '/clients', icon: Users, label: 'Danışanlar' },
    { href: '/calendar', icon: Calendar, label: 'Takvim' },
    { href: '/finance', icon: DollarSign, label: 'Finans' },
    { href: '/settings', icon: Settings, label: 'Ayarlar' },
    // Conditionally add admin link
    ...(profile?.is_admin
      ? [{ href: '/admin', icon: Shield, label: 'Yönetici Paneli' }]
      : []),
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/admin') return pathname === '/admin'
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trial Countdown Banner */}
      {profile && (
        <TrialBanner
          trial_ends_at={profile.trial_ends_at}
          subscription_status={profile.subscription_status}
        />
      )}

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-green-600">OfisDyt</h1>
          </div>
          {profile && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sidebar/Drawer */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl z-50 transform transition-transform">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-green-600">
                  OfisDyt
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? 'bg-green-100 text-green-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              
              {/* Subscription Status Widget */}
              {profile && (
                <div className="mt-auto">
                  <SubscriptionStatusWidget
                    subscription_status={profile.subscription_status}
                    subscription_ends_at={profile.subscription_ends_at}
                    trial_ends_at={profile.trial_ends_at}
                  />
                </div>
              )}
              
              <div className="p-4 border-t border-gray-200">
                {profile && (
                  <div className="mb-4 px-4 py-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {profile.full_name || 'Kullanıcı'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.clinic_name || 'Klinik'}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-green-600">OfisDyt</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Subscription Status Widget */}
        {profile && (
          <div className="mt-auto">
            <SubscriptionStatusWidget
              subscription_status={profile.subscription_status}
              subscription_ends_at={profile.subscription_ends_at}
              trial_ends_at={profile.trial_ends_at}
            />
          </div>
        )}
        
        <div className="p-4 border-t border-gray-200">
          {profile && (
            <div className="mb-4 px-4 py-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                {profile.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {profile.clinic_name || 'Clinic'}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-[60px] ${
                  active ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-20" />
    </div>
  )
}

