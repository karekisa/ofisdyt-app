'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type Measurement = {
  id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
}

export default function ProgressTab({ clientId }: { clientId: string }) {
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

    if (!error && data) {
      setMeasurements(data)
    }
    setLoading(false)
  }

  const chartData = measurements
    .filter((m) => m.weight !== null)
    .map((m) => ({
      date: format(new Date(m.date), 'dd MMM', { locale: tr }),
      weight: m.weight,
      bodyFat: m.body_fat_ratio,
    }))

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Gelişim takibi için ölçüm verisi bulunmuyor
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Kilo Gelişimi</h3>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
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
              stroke="#22c55e"
              strokeWidth={2}
              name="Kilo (kg)"
              dot={{ fill: '#22c55e', r: 4 }}
            />
            {chartData.some((d) => d.bodyFat !== null && d.bodyFat !== undefined) && (
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Yağ Oranı (%)"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

