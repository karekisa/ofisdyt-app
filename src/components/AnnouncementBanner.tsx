'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, AlertCircle, CheckCircle } from 'lucide-react'

type Announcement = {
  id: string
  message: string
  type: 'info' | 'warning'
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    loadActiveAnnouncement()
  }, [])

  const loadActiveAnnouncement = async () => {
    try {
      // Check if user has dismissed this announcement
      const dismissedId = localStorage.getItem('dismissed_announcement_id')
      
      const { data, error } = await supabase
        .from('system_announcements')
        .select('id, message, type')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error loading announcement:', error)
        return
      }

      if (data) {
        // If this announcement was already dismissed, don't show it
        if (dismissedId === data.id) {
          return
        }
        setAnnouncement(data)
      }
    } catch (error) {
      console.error('Error loading announcement:', error)
    }
  }

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('dismissed_announcement_id', announcement.id)
      setDismissed(true)
    }
  }

  if (!announcement || dismissed) {
    return null
  }

  const isWarning = announcement.type === 'warning'

  return (
    <div
      className={`${
        isWarning
          ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
          : 'bg-blue-50 border-blue-200 text-blue-900'
      } border-b px-4 py-3 flex items-center justify-between`}
    >
      <div className="flex items-center gap-3 flex-1">
        {isWarning ? (
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <p className="text-sm font-medium flex-1">{announcement.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className={`ml-4 flex-shrink-0 p-1 rounded hover:bg-opacity-20 ${
          isWarning ? 'hover:bg-yellow-600' : 'hover:bg-blue-600'
        } transition-colors`}
        aria-label="Kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}




