'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { differenceInCalendarDays } from 'date-fns'

type TrialBannerProps = {
  trial_ends_at: string | null
  subscription_status: string | null
}

export default function TrialBanner({
  trial_ends_at,
  subscription_status,
}: TrialBannerProps) {
  const daysLeft = useMemo(() => {
    // If subscription is active, don't show banner
    if (subscription_status === 'active') {
      return null
    }

    // If no trial end date, don't show
    if (!trial_ends_at) {
      return null
    }

    const trialEnd = new Date(trial_ends_at)
    const now = new Date()
    const days = differenceInCalendarDays(trialEnd, now)

    // If trial expired (days < 0), don't show (Subscription Guard handles this)
    if (days < 0) {
      return null
    }

    return days
  }, [trial_ends_at, subscription_status])

  // Don't render if no days left or subscription is active
  if (daysLeft === null) {
    return null
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      <Link href="/subscription" className="block">
        <div className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-medium py-2.5 px-4 text-center cursor-pointer relative overflow-hidden hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-md active:scale-[0.98]">
          {/* Content */}
          <div className="relative z-10 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-base animate-pulse">⏳</span>
            <span className="whitespace-nowrap text-xs sm:text-sm">
              Deneme sürenizin bitmesine{' '}
              <span className="font-bold text-base sm:text-lg inline-block">
                {daysLeft}
              </span>{' '}
              {daysLeft === 1 ? 'gün' : 'gün'} kaldı.
            </span>
            <span className="hidden sm:inline whitespace-nowrap text-xs sm:text-sm">
              Paketleri incelemek için tıklayın →
            </span>
            <span className="sm:hidden whitespace-nowrap text-xs">
              Paketleri inceleyin →
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

