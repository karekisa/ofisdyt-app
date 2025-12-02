'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Clock, Star, AlertTriangle, Sparkles } from 'lucide-react'
import { differenceInCalendarDays, format } from 'date-fns'
import { tr } from 'date-fns/locale'

type SubscriptionStatusWidgetProps = {
  subscription_status: string | null
  subscription_ends_at: string | null
  trial_ends_at: string | null
}

export default function SubscriptionStatusWidget({
  subscription_status,
  subscription_ends_at,
  trial_ends_at,
}: SubscriptionStatusWidgetProps) {
  const statusInfo = useMemo(() => {
    const isActive = subscription_status === 'active'
    const trialEnd = trial_ends_at ? new Date(trial_ends_at) : null
    const subscriptionEnd = subscription_ends_at ? new Date(subscription_ends_at) : null
    const now = new Date()

    // Active subscription
    if (isActive && subscriptionEnd) {
      const daysLeft = differenceInCalendarDays(subscriptionEnd, now)
      return {
        type: 'active' as const,
        icon: Star,
        iconColor: 'text-yellow-500',
        title: 'Pro Üyelik',
        text: 'Abonelik Aktif',
        subtext: subscriptionEnd
          ? `Bitiş: ${format(subscriptionEnd, 'd MMM yyyy', { locale: tr })}`
          : null,
        button: null,
      }
    }

    // Trial (not active but trial is valid)
    if (trialEnd && trialEnd > now) {
      const daysLeft = differenceInCalendarDays(trialEnd, now)
      return {
        type: 'trial' as const,
        icon: Sparkles,
        iconColor: 'text-blue-500',
        title: 'Deneme Sürümü',
        text: `${daysLeft} gün kaldı`,
        subtext: null,
        button: {
          text: 'Paket Seç',
          href: '/subscription',
          className: 'w-full bg-green-600 text-white text-xs py-2 rounded mt-2 hover:bg-green-700 transition-colors',
        },
      }
    }

    // Expired (not active and trial expired)
    return {
      type: 'expired' as const,
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      title: 'Süre Doldu',
      text: 'Aboneliğinizi yenileyin',
      subtext: null,
      button: {
        text: 'Yenile',
        href: '/subscription',
        className: 'w-full bg-red-600 text-white text-xs py-2 rounded mt-2 hover:bg-red-700 transition-colors',
      },
    }
  }, [subscription_status, subscription_ends_at, trial_ends_at])

  const Icon = statusInfo.icon

  return (
    <div className="p-4 m-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${statusInfo.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {statusInfo.title}
          </h3>
          <p className="text-xs text-gray-600 mb-1">{statusInfo.text}</p>
          {statusInfo.subtext && (
            <p className="text-xs text-gray-500">{statusInfo.subtext}</p>
          )}
          {statusInfo.button && (
            <Link href={statusInfo.button.href}>
              <button className={statusInfo.button.className}>
                {statusInfo.button.text}
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}







