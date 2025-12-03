'use client'

import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react'
import { subDays, differenceInDays } from 'date-fns'

type Measurement = {
  id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
  waist_circumference?: number | null
}

type MonthlyReportCardProps = {
  measurements: Measurement[]
}

export default function MonthlyReportCard({ measurements }: MonthlyReportCardProps) {
  // Sort measurements by date (newest first)
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (sortedMeasurements.length < 2) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Analiz için veri bekleniyor</p>
          <p className="text-gray-400 text-xs mt-1">
            En az 2 ölçüm gereklidir
          </p>
        </div>
      </div>
    )
  }

  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)

  // Find measurement closest to today
  const latestMeasurement = sortedMeasurements[0]

  // Find measurement closest to 30 days ago
  let measurement30DaysAgo = sortedMeasurements.find(
    (m) => new Date(m.date).getTime() <= thirtyDaysAgo.getTime()
  )

  // If no measurement exactly 30 days ago, use the oldest one
  if (!measurement30DaysAgo) {
    measurement30DaysAgo = sortedMeasurements[sortedMeasurements.length - 1]
  }

  // Calculate deltas
  const weightDelta =
    latestMeasurement.weight !== null && measurement30DaysAgo.weight !== null
      ? latestMeasurement.weight - measurement30DaysAgo.weight
      : null

  const bodyFatDelta =
    latestMeasurement.body_fat_ratio !== null &&
    measurement30DaysAgo.body_fat_ratio !== null
      ? latestMeasurement.body_fat_ratio - measurement30DaysAgo.body_fat_ratio
      : null

  // For waist, we'll use a placeholder calculation if available
  // Since waist_circumference might not exist, we'll estimate or use null
  const waistDelta =
    latestMeasurement.waist_circumference !== null &&
    latestMeasurement.waist_circumference !== undefined &&
    measurement30DaysAgo.waist_circumference !== null &&
    measurement30DaysAgo.waist_circumference !== undefined
      ? latestMeasurement.waist_circumference - measurement30DaysAgo.waist_circumference
      : null

  const formatDelta = (value: number | null, unit: string, isPositiveGood: boolean = false) => {
    if (value === null) return { text: '-', color: 'text-gray-500', icon: null }
    
    const isPositive = value > 0
    const isGood = isPositiveGood ? isPositive : !isPositive
    const color = isGood ? 'text-emerald-600' : 'text-red-600'
    const icon = isGood ? (
      <TrendingDown className="w-4 h-4" />
    ) : (
      <TrendingUp className="w-4 h-4" />
    )
    
    const sign = value > 0 ? '+' : ''
    return {
      text: `${sign}${value.toFixed(1)} ${unit}`,
      color,
      icon,
    }
  }

  const weightInfo = formatDelta(weightDelta, 'kg')
  const bodyFatInfo = formatDelta(bodyFatDelta, '%')
  const waistInfo = formatDelta(waistDelta, 'cm')

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Karne (1 Ay)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toplam Kayıp */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Toplam Kayıp</p>
            {weightInfo.icon && (
              <div className={weightInfo.color}>{weightInfo.icon}</div>
            )}
          </div>
          <p className={`text-2xl font-bold ${weightInfo.color}`}>
            {weightInfo.text}
          </p>
          <p className="text-xs text-gray-500 mt-1">Son 30 gün</p>
        </div>

        {/* Yağ Değişimi */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Yağ Değişimi</p>
            {bodyFatInfo.icon && (
              <div className={bodyFatInfo.color}>{bodyFatInfo.icon}</div>
            )}
          </div>
          <p className={`text-2xl font-bold ${bodyFatInfo.color}`}>
            {bodyFatInfo.text}
          </p>
          <p className="text-xs text-gray-500 mt-1">Son 30 gün</p>
        </div>

        {/* Bel İncelmesi */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Bel İncelmesi</p>
            {waistInfo.icon && (
              <div className={waistInfo.color}>{waistInfo.icon}</div>
            )}
          </div>
          <p className={`text-2xl font-bold ${waistInfo.color}`}>
            {waistInfo.text}
          </p>
          <p className="text-xs text-gray-500 mt-1">Son 30 gün</p>
        </div>
      </div>
    </div>
  )
}

