'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  Settings,
  LogOut,
  X,
  HelpCircle,
  Crown,
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
    is_founding_member: boolean | null
    full_name: string | null
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
      href: '/dashboard',
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
          lg:translate-x-0 lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
            {/* Founding Member Badge */}
            {profile?.is_founding_member && (
              <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-300">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-yellow-900">
                      👑 Kurucu Üye
                    </div>
                    <div className="text-xs text-yellow-700 mt-0.5">
                      Ömür boyu ücretsiz erişim
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Status - Show for all, but widget handles founding members */}
            {profile && (
              <SubscriptionStatusWidget
                subscription_status={profile.subscription_status}
                subscription_ends_at={profile.subscription_ends_at}
                trial_ends_at={profile.trial_ends_at}
                is_founding_member={profile.is_founding_member}
              />
            )}

            {/* Support Link */}
            <Link
              href="/support"
              onClick={() => setMobileOpen?.(false)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                pathname === '/support'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span>Destek & Geri Bildirim</span>
            </Link>

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

