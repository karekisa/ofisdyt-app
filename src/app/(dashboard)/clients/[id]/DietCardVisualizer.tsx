'use client'

import React from 'react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

type DietCardVisualizerProps = {
  clientName: string
  dietTitle: string
  dietContent: string
  createdAt: string
  dietitianName: string | null
  clinicName: string | null
  category?: 'daily' | 'weekly' // Optional category, will auto-detect if not provided
}

export default function DietCardVisualizer({
  clientName,
  dietTitle,
  dietContent,
  createdAt,
  dietitianName,
  clinicName,
  category,
}: DietCardVisualizerProps) {
  // Turkish locale-aware normalization
  const normalize = (text: string): string => {
    return text.toLocaleUpperCase('tr-TR')
  }

  // Parse weekly content into structured meal data
  const parseWeeklyMeals = (content: string): Record<string, { breakfast: string; lunch: string; snack: string; dinner: string }> => {
    // Day keywords in Turkish (all variations)
    const dayKeywords = [
      { keys: ['PAZARTESİ', 'PAZARTESI'], name: 'pazartesi' },
      { keys: ['SALI'], name: 'sali' },
      { keys: ['ÇARŞAMBA', 'CARSAMBA'], name: 'carsamba' },
      { keys: ['PERŞEMBE', 'PERSEMBE'], name: 'persembe' },
      { keys: ['CUMA'], name: 'cuma' },
      { keys: ['CUMARTESİ', 'CUMARTESI'], name: 'cumartesi' },
      { keys: ['PAZAR'], name: 'pazar' },
    ]

    const meals: Record<string, { breakfast: string; lunch: string; snack: string; dinner: string }> = {
      pazartesi: { breakfast: '', lunch: '', snack: '', dinner: '' },
      sali: { breakfast: '', lunch: '', snack: '', dinner: '' },
      carsamba: { breakfast: '', lunch: '', snack: '', dinner: '' },
      persembe: { breakfast: '', lunch: '', snack: '', dinner: '' },
      cuma: { breakfast: '', lunch: '', snack: '', dinner: '' },
      cumartesi: { breakfast: '', lunch: '', snack: '', dinner: '' },
      pazar: { breakfast: '', lunch: '', snack: '', dinner: '' },
    }

    // Normalize content for Turkish locale
    const normalizedContent = normalize(content)
    const lines = content.split('\n')
    
    // Find day boundaries by line
    const dayBoundaries: Array<{ day: string; startLine: number; endLine: number }> = []
    
    for (let i = 0; i < dayKeywords.length; i++) {
      const dayInfo = dayKeywords[i]
      const nextDayInfo = dayKeywords[i + 1]
      
      // Find start line (try all keyword variations)
      let startLine = -1
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const normalizedLine = normalize(lines[lineIdx].trim())
        for (const key of dayInfo.keys) {
          if (normalizedLine.startsWith(normalize(key)) || normalizedLine.includes(normalize(key))) {
            startLine = lineIdx
            break
          }
        }
        if (startLine !== -1) break
      }
      
      if (startLine === -1) continue
      
      // Find end line (next day or end of content)
      let endLine = lines.length
      if (nextDayInfo) {
        for (let lineIdx = startLine + 1; lineIdx < lines.length; lineIdx++) {
          const normalizedLine = normalize(lines[lineIdx].trim())
          for (const key of nextDayInfo.keys) {
            if (normalizedLine.startsWith(normalize(key)) || normalizedLine.includes(normalize(key))) {
              endLine = lineIdx
              break
            }
          }
          if (endLine < lines.length) break
        }
      }
      
      dayBoundaries.push({
        day: dayInfo.name,
        startLine,
        endLine,
      })
    }

    // Parse each day's content
    for (const boundary of dayBoundaries) {
      let currentMeal: 'breakfast' | 'lunch' | 'snack' | 'dinner' | null = null
      
      // Process lines for this day
      for (let lineIdx = boundary.startLine; lineIdx < boundary.endLine; lineIdx++) {
        const trimmed = lines[lineIdx].trim()
        if (!trimmed) continue
        
        const normalizedLine = normalize(trimmed)
        
        // Skip the day header line
        const isDayHeader = dayKeywords.some(dayInfo => 
          dayInfo.keys.some(key => {
            const normalizedKey = normalize(key)
            return normalizedLine.startsWith(normalizedKey) || normalizedLine.includes(normalizedKey)
          })
        )
        if (isDayHeader) continue
        
        // Check for meal keywords
        if (normalizedLine.startsWith('KAHVALTI') || normalizedLine.startsWith('SABAH')) {
          currentMeal = 'breakfast'
          meals[boundary.day].breakfast = trimmed.replace(/^(KAHVALTI|SABAH):?\s*/i, '').trim()
        } else if (normalizedLine.startsWith('ÖĞLE') || normalizedLine.startsWith('ÖĞLEN')) {
          currentMeal = 'lunch'
          meals[boundary.day].lunch = trimmed.replace(/^(ÖĞLE|ÖĞLEN):?\s*/i, '').trim()
        } else if (normalizedLine.startsWith('ARA ÖĞÜN') || normalizedLine.startsWith('ARA ÖGÜN') || normalizedLine.startsWith('ATIŞTIRMALIK')) {
          currentMeal = 'snack'
          meals[boundary.day].snack = trimmed.replace(/^(ARA ÖĞÜN|ARA ÖGÜN|ATIŞTIRMALIK):?\s*/i, '').trim()
        } else if (normalizedLine.startsWith('AKŞAM') || normalizedLine.startsWith('AKSAM')) {
          currentMeal = 'dinner'
          meals[boundary.day].dinner = trimmed.replace(/^(AKŞAM|AKSAM):?\s*/i, '').trim()
        } else if (currentMeal) {
          // Append to current meal
          meals[boundary.day][currentMeal] += (meals[boundary.day][currentMeal] ? '\n' : '') + trimmed
        }
      }
    }

    return meals
  }

  // Parse weekly content by day keywords (legacy function for daily layout)
  const parseWeeklyContent = (content: string): Array<{ day: string; content: string }> => {
    const dayKeywords = [
      { keywords: ['PAZARTESİ', 'PAZARTESI'], name: 'Pazartesi' },
      { keywords: ['SALI'], name: 'Salı' },
      { keywords: ['ÇARŞAMBA', 'CARSAMBA'], name: 'Çarşamba' },
      { keywords: ['PERŞEMBE', 'PERSEMBE'], name: 'Perşembe' },
      { keywords: ['CUMA'], name: 'Cuma' },
      { keywords: ['CUMARTESİ', 'CUMARTESI'], name: 'Cumartesi' },
      { keywords: ['PAZAR'], name: 'Pazar' },
    ]

    const lines = content.split('\n')
    const daysMap = new Map<string, { day: string; content: string }>()
    let currentDay: { day: string; content: string } | null = null

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      
      const upperLine = trimmedLine.toUpperCase()

      // Check if this line is a day header
      const dayMatch = dayKeywords.find((day) =>
        day.keywords.some((keyword) => upperLine.startsWith(keyword) || upperLine.includes(keyword))
      )

      if (dayMatch) {
        // Save previous day if exists
        if (currentDay) {
          daysMap.set(currentDay.day, currentDay)
        }
        // Start new day (remove the day name from content)
        const contentWithoutDay = trimmedLine.replace(new RegExp(dayMatch.keywords.join('|'), 'gi'), '').trim()
        currentDay = {
          day: dayMatch.name,
          content: contentWithoutDay ? contentWithoutDay + '\n' : '',
        }
      } else if (currentDay) {
        // Add line to current day's content
        currentDay.content += trimmedLine + '\n'
      }
    }

    // Add last day if exists
    if (currentDay) {
      daysMap.set(currentDay.day, currentDay)
    }

    // Return days in order, with empty placeholders for missing days
    const orderedDays: Array<{ day: string; content: string }> = []
    for (const dayInfo of dayKeywords) {
      if (daysMap.has(dayInfo.name)) {
        orderedDays.push(daysMap.get(dayInfo.name)!)
      } else {
        // Optionally include empty days - comment out if you want to skip missing days
        // orderedDays.push({ day: dayInfo.name, content: '' })
      }
    }

    return orderedDays.length > 0 ? orderedDays : Array.from(daysMap.values())
  }

  // Detect if content is weekly by checking for day keywords
  const isWeekly = category === 'weekly' || (() => {
    const normalizedContent = normalize(dietContent)
    const weeklyKeywords = ['PAZARTESİ', 'PAZARTESI', 'SALI', 'ÇARŞAMBA', 'CARSAMBA', 'PERŞEMBE', 'PERSEMBE', 'CUMA', 'CUMARTESİ', 'CUMARTESI', 'PAZAR']
    return weeklyKeywords.some(keyword => normalizedContent.includes(normalize(keyword)))
  })()

  // Format content with smart formatting (for daily)
  const formatContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      const trimmedLine = line.trim()
      const upperLine = trimmedLine.toUpperCase()
      
      // Check for meal keywords
      if (upperLine.startsWith('SABAH') || upperLine.startsWith('KAHVALTI')) {
        return (
          <div key={index} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🍳</span>
              <h3 className="text-4xl font-bold text-gray-900">{trimmedLine}</h3>
            </div>
          </div>
        )
      }
      if (upperLine.startsWith('ÖĞLE') || upperLine.startsWith('ÖĞLEN')) {
        return (
          <div key={index} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🥗</span>
              <h3 className="text-4xl font-bold text-gray-900">{trimmedLine}</h3>
            </div>
          </div>
        )
      }
      if (upperLine.startsWith('AKŞAM') || upperLine.startsWith('AKSAM')) {
        return (
          <div key={index} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🌙</span>
              <h3 className="text-4xl font-bold text-gray-900">{trimmedLine}</h3>
            </div>
          </div>
        )
      }
      if (upperLine.startsWith('ARA ÖĞÜN') || upperLine.startsWith('ARA ÖGÜN') || upperLine.startsWith('ATIŞTIRMALIK')) {
        return (
          <div key={index} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🍎</span>
              <h3 className="text-4xl font-bold text-gray-900">{trimmedLine}</h3>
            </div>
          </div>
        )
      }
      
      // Regular line
      if (trimmedLine === '') {
        return <div key={index} className="h-3" />
      }
      
      return (
        <p key={index} className="text-2xl text-gray-700 leading-loose mb-3">
          {trimmedLine}
        </p>
      )
    })
  }

  const formattedDate = format(parseISO(createdAt), 'd MMMM yyyy', { locale: tr })
  const weeklyMeals = isWeekly ? parseWeeklyMeals(dietContent) : null

  const DAYS_ORDER = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar']
  const DAYS_LABELS: Record<string, string> = {
    pazartesi: 'PAZARTESİ',
    sali: 'SALI',
    carsamba: 'ÇARŞAMBA',
    persembe: 'PERŞEMBE',
    cuma: 'CUMA',
    cumartesi: 'CUMARTESİ',
    pazar: 'PAZAR',
  }

  const MEALS = [
    { key: 'breakfast', label: 'KAHVALTI', icon: '🍳' },
    { key: 'lunch', label: 'ÖĞLE', icon: '🥗' },
    { key: 'snack', label: 'ARA ÖĞÜN', icon: '🍎' },
    { key: 'dinner', label: 'AKŞAM', icon: '🌙' },
  ] as const

  // Calculate dimensions
  const containerWidth = isWeekly ? 1920 : 1080
  const containerHeight = isWeekly ? 1080 : 1920

  return (
    <div
      id="diet-card-container"
      className="bg-white"
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        minWidth: `${containerWidth}px`,
        minHeight: `${containerHeight}px`,
        maxWidth: `${containerWidth}px`,
        maxHeight: `${containerHeight}px`,
        padding: isWeekly ? '60px' : '96px',
        boxSizing: 'border-box',
        position: 'relative',
        background: isWeekly 
          ? 'linear-gradient(to bottom right, #ffffff 0%, #f0fdfa 30%)'
          : 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: isWeekly ? 'inset 0 0 0 1px rgba(20, 184, 166, 0.1)' : 'none',
        overflow: 'hidden',
      }}
    >
      {!isWeekly && (
        /* Decorative border for portrait layout */
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '8px solid #10b981',
            borderRadius: '0',
            pointerEvents: 'none',
          }}
        />
      )}

      {isWeekly ? (
        /* Weekly Layout: Modern Horizontal Matrix */
        <>
          {/* Header Section */}
          <div className="mb-8 pb-4" style={{ borderBottom: '2px solid rgba(20, 184, 166, 0.2)' }}>
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="text-4xl font-bold mb-2"
                  style={{
                    color: '#0d9488',
                    letterSpacing: '-0.02em',
                    fontWeight: 700,
                  }}
                >
                  HAFTALIK BESLENME PROGRAMI
                </h1>
                {dietTitle && (
                  <p className="text-xl text-gray-600 font-medium">{dietTitle}</p>
                )}
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-semibold text-gray-900">{clientName}</p>
                <p>{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="flex-1" style={{ minHeight: '700px', width: '100%' }}>
            <div 
              className="grid gap-4" 
              style={{ 
                gridTemplateColumns: '150px repeat(7, 1fr)',
                width: '100%',
                minWidth: '1800px',
              }}
            >
              {/* Empty corner cell */}
              <div></div>
              
              {/* Day Headers - Floating Pills */}
              {DAYS_ORDER.map((dayKey) => (
                <div key={dayKey} className="flex justify-center">
                  <div
                    className="bg-teal-600 text-white rounded-full py-2 px-4 text-center font-bold shadow-sm uppercase tracking-wider text-sm"
                    style={{ minWidth: '120px' }}
                  >
                    {DAYS_LABELS[dayKey]}
                  </div>
                </div>
              ))}

              {/* Meal Rows */}
              {MEALS.map((meal, mealIndex) => (
                <React.Fragment key={meal.key}>
                  {/* Meal Label */}
                  <div
                    className="flex items-center gap-2 font-bold text-teal-800 text-lg"
                    style={{
                      backgroundColor: mealIndex % 2 === 0 ? 'transparent' : 'rgba(20, 184, 166, 0.05)',
                      padding: '12px',
                      borderRadius: '8px',
                    }}
                  >
                    <span className="text-2xl">{meal.icon}</span>
                    <span>{meal.label}</span>
                  </div>

                  {/* Day Cells for this Meal */}
                  {DAYS_ORDER.map((dayKey) => {
                    const mealContent = weeklyMeals?.[dayKey]?.[meal.key] || ''
                    return (
                      <div
                        key={`${dayKey}-${meal.key}`}
                        className="rounded-lg shadow-sm p-3 bg-white"
                        style={{
                          backgroundColor: mealIndex % 2 === 0 ? '#ffffff' : 'rgba(240, 253, 250, 0.5)',
                          minHeight: '120px',
                          border: '1px solid rgba(20, 184, 166, 0.1)',
                        }}
                      >
                        <p className="text-sm text-gray-700 whitespace-normal leading-relaxed">
                          {mealContent || <span className="text-gray-300 italic">-</span>}
                        </p>
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-8 pt-4 flex items-center justify-center gap-2"
            style={{
              borderTop: '1px solid rgba(20, 184, 166, 0.2)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              }}
            >
              D
            </div>
            <span className="text-sm text-gray-500">Diyetlik ile hazırlanmıştır.</span>
          </div>
        </>
      ) : (
        /* Daily Layout: Portrait Format */
        <>
          {/* Header */}
          <div className="mb-10" style={{ borderBottom: '3px solid #10b981', paddingBottom: '32px' }}>
            <h1
              className="text-6xl font-bold mb-6"
              style={{
                color: '#059669',
                letterSpacing: '-0.02em',
                fontWeight: 700,
              }}
            >
              Diyet Programı
            </h1>
            <div className="space-y-3">
              <p className="text-3xl font-semibold text-gray-900">{clientName}</p>
              <p className="text-3xl text-gray-600">{formattedDate}</p>
            </div>
          </div>

          {/* Diet Title */}
          <div className="mb-10">
            <h2
              className="text-4xl font-bold"
              style={{
                color: '#1f2937',
                borderLeft: '8px solid #10b981',
                paddingLeft: '24px',
              }}
            >
              {dietTitle}
            </h2>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              minHeight: '1000px',
              maxHeight: '1000px',
            }}
          >
            <div className="space-y-4">{formatContent(dietContent)}</div>
          </div>

          {/* Footer */}
          <div
            className="mt-10 pt-10"
            style={{
              borderTop: '2px solid #e5e7eb',
              marginTop: 'auto',
            }}
          >
            <div className="flex flex-col items-center space-y-5">
              {dietitianName && (
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{dietitianName}</p>
                  {clinicName && (
                    <p className="text-xl text-gray-600">{clinicName}</p>
                  )}
                  <p className="text-lg text-gray-500 mt-2">Diyetisyen</p>
                </div>
              )}
              
              {/* Badge */}
              <div
                className="px-8 py-4 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                }}
              >
                <p className="text-xl font-medium">Diyetlik altyapısı ile hazırlanmıştır</p>
              </div>

              {/* Logo placeholder */}
              <div className="flex items-center gap-3 mt-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  }}
                >
                  D
                </div>
                <span className="text-2xl font-bold text-gray-700">Diyetlik</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

