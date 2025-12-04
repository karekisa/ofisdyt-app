'use client'

import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

type PrintableDietSheetProps = {
  clientName: string
  dietTitle: string
  dietContent: string
  createdAt: string
  dietitianName: string | null
  clinicName: string | null
}

type DayPlan = {
  breakfast: string
  lunch: string
  snack: string
  dinner: string
}

const DAYS = [
  { key: 'pazartesi', label: 'Pazartesi' },
  { key: 'sali', label: 'Salı' },
  { key: 'carsamba', label: 'Çarşamba' },
  { key: 'persembe', label: 'Perşembe' },
  { key: 'cuma', label: 'Cuma' },
  { key: 'cumartesi', label: 'Cumartesi' },
  { key: 'pazar', label: 'Pazar' },
]

export default function PrintableDietSheet({
  clientName,
  dietTitle,
  dietContent,
  createdAt,
  dietitianName,
  clinicName,
}: PrintableDietSheetProps) {
  // Parse content to detect if weekly and extract structured data
  const parseContent = () => {
    const upperContent = dietContent.toUpperCase()
    const isWeekly = ['PAZARTESİ', 'PAZARTESI', 'SALI', 'ÇARŞAMBA', 'CARSAMBA', 'PERŞEMBE', 'PERSEMBE', 'CUMA', 'CUMARTESİ', 'CUMARTESI', 'PAZAR'].some(
      keyword => upperContent.includes(keyword)
    )

    const dayMap: Record<string, string> = {
      'PAZARTESİ': 'pazartesi',
      'PAZARTESI': 'pazartesi',
      'SALI': 'sali',
      'ÇARŞAMBA': 'carsamba',
      'CARSAMBA': 'carsamba',
      'PERŞEMBE': 'persembe',
      'PERSEMBE': 'persembe',
      'CUMA': 'cuma',
      'CUMARTESİ': 'cumartesi',
      'CUMARTESI': 'cumartesi',
      'PAZAR': 'pazar',
    }

    const parsedDays: Record<string, DayPlan> = {
      pazartesi: { breakfast: '', lunch: '', snack: '', dinner: '' },
      sali: { breakfast: '', lunch: '', snack: '', dinner: '' },
      carsamba: { breakfast: '', lunch: '', snack: '', dinner: '' },
      persembe: { breakfast: '', lunch: '', snack: '', dinner: '' },
      cuma: { breakfast: '', lunch: '', snack: '', dinner: '' },
      cumartesi: { breakfast: '', lunch: '', snack: '', dinner: '' },
      pazar: { breakfast: '', lunch: '', snack: '', dinner: '' },
    }

    const lines = dietContent.split('\n')
    let currentDay: string | null = null
    let currentMeal: keyof DayPlan | null = null

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const upper = trimmed.toUpperCase()

      // Check for day keyword
      const dayMatch = Object.keys(dayMap).find(keyword => upper.startsWith(keyword))
      if (dayMatch) {
        currentDay = dayMap[dayMatch]
        currentMeal = null
        continue
      }

      // Check for meal keyword
      if (upper.startsWith('KAHVALTI') || upper.startsWith('SABAH')) {
        currentMeal = 'breakfast'
        if (currentDay) {
          parsedDays[currentDay].breakfast = trimmed.replace(/^(KAHVALTI|SABAH):?\s*/i, '').trim()
        } else if (!isWeekly) {
          parsedDays.pazartesi.breakfast = trimmed.replace(/^(KAHVALTI|SABAH):?\s*/i, '').trim()
        }
      } else if (upper.startsWith('ÖĞLE') || upper.startsWith('ÖĞLEN')) {
        currentMeal = 'lunch'
        if (currentDay) {
          parsedDays[currentDay].lunch = trimmed.replace(/^(ÖĞLE|ÖĞLEN):?\s*/i, '').trim()
        } else if (!isWeekly) {
          parsedDays.pazartesi.lunch = trimmed.replace(/^(ÖĞLE|ÖĞLEN):?\s*/i, '').trim()
        }
      } else if (upper.startsWith('ARA ÖĞÜN') || upper.startsWith('ARA ÖGÜN') || upper.startsWith('ATIŞTIRMALIK')) {
        currentMeal = 'snack'
        if (currentDay) {
          parsedDays[currentDay].snack = trimmed.replace(/^(ARA ÖĞÜN|ARA ÖGÜN|ATIŞTIRMALIK):?\s*/i, '').trim()
        } else if (!isWeekly) {
          parsedDays.pazartesi.snack = trimmed.replace(/^(ARA ÖĞÜN|ARA ÖGÜN|ATIŞTIRMALIK):?\s*/i, '').trim()
        }
      } else if (upper.startsWith('AKŞAM') || upper.startsWith('AKSAM')) {
        currentMeal = 'dinner'
        if (currentDay) {
          parsedDays[currentDay].dinner = trimmed.replace(/^(AKŞAM|AKSAM):?\s*/i, '').trim()
        } else if (!isWeekly) {
          parsedDays.pazartesi.dinner = trimmed.replace(/^(AKŞAM|AKSAM):?\s*/i, '').trim()
        }
      } else if (currentDay && currentMeal) {
        parsedDays[currentDay][currentMeal] += (parsedDays[currentDay][currentMeal] ? '\n' : '') + trimmed
      } else if (!isWeekly && currentMeal) {
        parsedDays.pazartesi[currentMeal] += (parsedDays.pazartesi[currentMeal] ? '\n' : '') + trimmed
      }
    }

    return { isWeekly, parsedDays }
  }

  const { isWeekly, parsedDays } = parseContent()
  const formattedDate = format(parseISO(createdAt), 'd MMMM yyyy', { locale: tr })

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 2cm;
          }

          body * {
            visibility: hidden;
          }

          .printable-sheet-container,
          .printable-sheet-container * {
            visibility: visible;
          }

          .printable-sheet-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background: white;
          }

          .printable-diet-sheet {
            width: 100%;
            min-height: 100vh;
            background: white;
            padding: 0;
          }

          /* Hide non-printable elements */
          nav,
          header,
          footer:not(.print-footer),
          button,
          .no-print,
          .printable-sheet-container ~ * {
            display: none !important;
            visibility: hidden !important;
          }

          /* Ensure proper page breaks */
          .printable-diet-sheet {
            page-break-after: auto;
            page-break-inside: avoid;
          }

          .day-box {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="printable-diet-sheet flex flex-col min-h-screen">
        {/* Header Section */}
        <div className="mb-8 pb-4 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            DİYET PROGRAMI
          </h1>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
            {dietitianName && (
              <div>
                <span className="font-semibold">Hazırlayan:</span> Dyt. {dietitianName}
                {clinicName && ` - ${clinicName}`}
              </div>
            )}
            <div>
              <span className="font-semibold">Tarih:</span> {formattedDate}
            </div>
            <div>
              <span className="font-semibold">Danışan:</span> {clientName}
            </div>
          </div>
          {dietTitle && (
            <div className="mt-3 text-center">
              <h2 className="text-xl font-semibold text-gray-800">{dietTitle}</h2>
            </div>
          )}
        </div>

        {/* Body Section */}
        <div className="mb-12">
          {isWeekly ? (
            // Weekly Layout: 4-column grid
            <div className="grid grid-cols-4 gap-4">
              {DAYS.map((day) => {
                const dayPlan = parsedDays[day.key]
                const hasContent = dayPlan.breakfast || dayPlan.lunch || dayPlan.snack || dayPlan.dinner

                if (!hasContent) return null

                return (
                  <div
                    key={day.key}
                    className="day-box border border-gray-300 rounded p-3 bg-gray-50"
                  >
                    <h3 className="font-bold text-sm text-gray-900 mb-2 uppercase border-b border-gray-400 pb-1">
                      {day.label}
                    </h3>
                    <div className="space-y-2 text-xs">
                      {dayPlan.breakfast && (
                        <div>
                          <span className="font-semibold text-gray-700">🍳 Kahvaltı:</span>
                          <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{dayPlan.breakfast}</p>
                        </div>
                      )}
                      {dayPlan.lunch && (
                        <div>
                          <span className="font-semibold text-gray-700">🥗 Öğle:</span>
                          <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{dayPlan.lunch}</p>
                        </div>
                      )}
                      {dayPlan.snack && (
                        <div>
                          <span className="font-semibold text-gray-700">🍎 Ara Öğün:</span>
                          <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{dayPlan.snack}</p>
                        </div>
                      )}
                      {dayPlan.dinner && (
                        <div>
                          <span className="font-semibold text-gray-700">🌙 Akşam:</span>
                          <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{dayPlan.dinner}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Daily Layout
            <div className="space-y-4">
              {(() => {
                const dayPlan = parsedDays.pazartesi
                return (
                  <>
                    {dayPlan.breakfast && (
                      <div className="border-l-4 border-yellow-400 pl-4 py-2">
                        <h3 className="font-bold text-gray-900 mb-1">🍳 Kahvaltı</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{dayPlan.breakfast}</p>
                      </div>
                    )}
                    {dayPlan.lunch && (
                      <div className="border-l-4 border-green-400 pl-4 py-2">
                        <h3 className="font-bold text-gray-900 mb-1">🥗 Öğle Yemeği</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{dayPlan.lunch}</p>
                      </div>
                    )}
                    {dayPlan.snack && (
                      <div className="border-l-4 border-orange-400 pl-4 py-2">
                        <h3 className="font-bold text-gray-900 mb-1">🍎 Ara Öğünler</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{dayPlan.snack}</p>
                      </div>
                    )}
                    {dayPlan.dinner && (
                      <div className="border-l-4 border-blue-400 pl-4 py-2">
                        <h3 className="font-bold text-gray-900 mb-1">🌙 Akşam Yemeği</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{dayPlan.dinner}</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="print-footer mt-auto pt-8 border-t border-gray-300">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">
              D
            </div>
            <span className="text-xs text-gray-500">Diyetlik ile hazırlanmıştır.</span>
          </div>
        </div>
      </div>
    </>
  )
}

