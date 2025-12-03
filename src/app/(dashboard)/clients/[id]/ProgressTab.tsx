'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import MonthlyReportCard from './MonthlyReportCard'
import { Client } from '@/lib/types'

type Measurement = {
  id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
  muscle_ratio?: number | null
  water_ratio?: number | null
  waist_circumference?: number | null
  created_at: string
}

type ProgressTabProps = {
  clientId: string
  client?: Client | null
}

export default function ProgressTab({ clientId, client }: ProgressTabProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [idealWeight, setIdealWeight] = useState<number | null>(null)

  useEffect(() => {
    loadMeasurements()
    calculateIdealWeight()
  }, [clientId, client])

  const calculateIdealWeight = () => {
    if (client?.height) {
      const heightInMeters = client.height / 100
      // Ideal Weight (BMI 22)
      const ideal = 22 * heightInMeters * heightInMeters
      setIdealWeight(ideal)
    }
  }

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
      fullDate: m.date,
      weight: m.weight,
      bodyFat: m.body_fat_ratio,
      target: idealWeight,
    }))

  // Get latest measurement for body composition
  const latestMeasurement = measurements
    .filter((m) => m.weight !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  // Calculate body composition for pie chart
  const getBodyComposition = () => {
    if (!latestMeasurement || !latestMeasurement.weight) return null

    const bodyFat = latestMeasurement.body_fat_ratio || 0
    // Estimate muscle ratio if not available (typical range: 30-50% for adults)
    const muscle = latestMeasurement.muscle_ratio || (100 - bodyFat - 20) // Rough estimate
    // Estimate water ratio if not available (typical: 50-65%)
    const water = latestMeasurement.water_ratio || 55 // Average estimate

    // Normalize to ensure they sum to ~100% (with some room for other components)
    const total = bodyFat + muscle + water
    const scale = 95 / total // Leave 5% for other components

    return [
      {
        name: 'Yağ',
        value: Math.round(bodyFat * scale),
        color: '#ef4444', // Red
      },
      {
        name: 'Kas',
        value: Math.round(muscle * scale),
        color: '#3b82f6', // Blue
      },
      {
        name: 'Su',
        value: Math.round(water * scale),
        color: '#06b6d4', // Cyan
      },
    ]
  }

  const bodyComposition = getBodyComposition()

  // Calculate BMI for center text
  const calculateBMI = () => {
    if (!latestMeasurement?.weight || !client?.height) return null
    const heightInMeters = client.height / 100
    return (latestMeasurement.weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  const bmi = calculateBMI()

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(1)} {entry.name.includes('Kilo') ? 'kg' : entry.name.includes('Yağ') ? '%' : ''}
            </p>
          ))}
          {idealWeight && (
            <p className="text-sm text-red-600 mt-1">
              Hedef: {idealWeight.toFixed(1)} kg
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Monthly Report Card */}
      <MonthlyReportCard measurements={measurements} />

      {/* Weight Chart with Target Line */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kilo Gelişimi</h3>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#14b8a6"
                strokeWidth={3}
                fill="url(#colorWeight)"
                name="Kilo (kg)"
                dot={{ fill: '#14b8a6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
              {idealWeight && (
                <ReferenceLine
                  y={idealWeight}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: 'Hedef Kilo', position: 'right', fill: '#ef4444', fontSize: 12 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Body Composition Pie Chart */}
      {bodyComposition && latestMeasurement && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vücut Kompozisyonu</h3>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <ResponsiveContainer width="100%" height={300} maxWidth={300}>
                <PieChart>
                  <Pie
                    data={bodyComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {bodyComposition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                <div className="text-center md:text-left">
                  {bmi && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">BMI</p>
                      <p className="text-3xl font-bold text-gray-900">{bmi}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {bodyComposition.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

