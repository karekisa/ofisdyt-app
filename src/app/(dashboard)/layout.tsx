'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Menu, LayoutDashboard, Users, Calendar, Wallet, Settings, HelpCircle } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import TrialBanner from '@/components/TrialBanner'
import QuickSearch from '@/components/QuickSearch'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState<{
    subscription_status: string | null
    subscription_ends_at: string | null
    trial_ends_at: string | null
  } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Load profile for subscription status
    const { data } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }

    setLoading(false)
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
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        profile={profile}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 pb-16 lg:pb-0 overflow-y-auto">
        {/* Desktop Header with Search */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between sticky top-0 z-30">
          <div className="flex-1 max-w-md">
            <QuickSearch />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Diyetlik Logo" 
              width={140} 
              height={40} 
              className="object-contain h-8 w-auto" 
              priority 
            />
          </Link>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Mobile Search Bar */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <QuickSearch />
        </div>

        {/* Trial Banner */}
        {profile && (
          <TrialBanner
            trial_ends_at={profile.trial_ends_at}
            subscription_status={profile.subscription_status}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-30 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                pathname === '/dashboard'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs">Panel</span>
            </Link>
            <Link
              href="/clients"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                pathname?.startsWith('/clients')
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Danışanlar</span>
            </Link>
            <Link
              href="/calendar"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                pathname === '/calendar'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs">Takvim</span>
            </Link>
            <Link
              href="/finance"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                pathname === '/finance'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Finans</span>
            </Link>
            <Link
              href="/settings"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                pathname === '/settings'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Ayarlar</span>
            </Link>
            <Link
              href="/support"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                pathname === '/support'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-xs">Destek</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
