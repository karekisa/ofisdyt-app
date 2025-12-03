'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Client } from '@/lib/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

type Measurement = {
  id: string
  client_id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
  created_at: string
}

type ProgressTabProps = {
  clientId: string
  client: Client
}

export default function ProgressTab({ clientId, client }: ProgressTabProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMeasurements()
  }, [clientId])

  const loadMeasurements = async () => {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error loading measurements:', error)
    } else {
      setMeasurements(data as Measurement[])
    }
    setLoading(false)
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    return measurements
      .filter((m) => m.weight !== null)
      .map((measurement) => {
        const date = parseISO(measurement.date)
        return {
          date: format(date, 'dd MMM', { locale: tr }),
          fullDate: measurement.date,
          weight: measurement.weight,
          bodyFat: measurement.body_fat_ratio,
        }
      })
  }, [measurements])

  // Calculate progress stats
  const stats = useMemo(() => {
    if (measurements.length === 0) return null

    const weights = measurements
      .map((m) => m.weight)
      .filter((w): w is number => w !== null)

    if (weights.length === 0) return null

    const firstWeight = weights[0]
    const lastWeight = weights[weights.length - 1]
    const weightChange = lastWeight - firstWeight
    const weightChangePercent = firstWeight > 0 ? (weightChange / firstWeight) * 100 : 0

    return {
      firstWeight,
      lastWeight,
      weightChange,
      weightChangePercent,
      totalMeasurements: measurements.length,
    }
  }, [measurements])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  if (measurements.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">
          İlerleme grafiği için ölçüm verisi gereklidir.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Ölçümler sekmesinden yeni ölçüm ekleyin.
        </p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">
          Grafik için kilo verisi gereklidir.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">İlk Kilo</p>
            <p className="text-2xl font-bold text-gray-900">{stats.firstWeight} kg</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Son Kilo</p>
            <p className="text-2xl font-bold text-gray-900">{stats.lastWeight} kg</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Değişim</p>
            <p
              className={`text-2xl font-bold ${
                stats.weightChange > 0
                  ? 'text-red-600'
                  : stats.weightChange < 0
                  ? 'text-green-600'
                  : 'text-gray-900'
              }`}
            >
              {stats.weightChange > 0 ? '+' : ''}
              {stats.weightChange.toFixed(1)} kg
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ({stats.weightChangePercent > 0 ? '+' : ''}
              {stats.weightChangePercent.toFixed(1)}%)
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Toplam Ölçüm</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMeasurements}</p>
          </div>
        </div>
      )}

      {/* Weight Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kilo İlerlemesi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#10b981"
              strokeWidth={2}
              name="Kilo (kg)"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Body Fat Chart (if available) */}
      {chartData.some((d) => d.bodyFat !== null) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vücut Yağ Oranı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Vücut Yağ Oranı (%)"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
