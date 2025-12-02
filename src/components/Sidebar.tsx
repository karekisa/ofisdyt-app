'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SubscriptionStatusWidget from './SubscriptionStatusWidget'

type SidebarProps = {
  mobileOpen?: boolean
  setMobileOpen?: (open: boolean) => void
  profile?: {
    subscription_status: string | null
    subscription_ends_at: string | null
    trial_ends_at: string | null
  } | null
}

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen,
  profile,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    {
      href: '/',
      label: 'Panel',
      icon: LayoutDashboard,
    },
    {
      href: '/clients',
      label: 'Danışanlar',
      icon: Users,
    },
    {
      href: '/calendar',
      label: 'Takvim',
      icon: Calendar,
    },
    {
      href: '/finance',
      label: 'Finans',
      icon: Wallet,
    },
    {
      href: '/settings',
      label: 'Ayarlar',
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">OfisDyt</span>
            </Link>
            {setMobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen?.(false)}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                        ${
                          isActive
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Subscription Status */}
            {profile && (
              <SubscriptionStatusWidget
                subscription_status={profile.subscription_status}
                subscription_ends_at={profile.subscription_ends_at}
                trial_ends_at={profile.trial_ends_at}
              />
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

