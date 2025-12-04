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
import { format, parseISO, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import downloadjs from 'downloadjs'

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

    // Calculate date range
    const firstDate = measurements[0]?.date ? parseISO(measurements[0].date) : null
    const lastDate = measurements[measurements.length - 1]?.date ? parseISO(measurements[measurements.length - 1].date) : null
    const daysDiff = firstDate && lastDate ? differenceInDays(lastDate, firstDate) : 0

    return {
      firstWeight,
      lastWeight,
      weightChange,
      weightChangePercent,
      totalMeasurements: measurements.length,
      firstDate,
      lastDate,
      daysDiff,
    }
  }, [measurements])

  // Mask client name for privacy (show only first name + first letter of last name)
  const getMaskedName = (fullName: string) => {
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) return parts[0]
    const firstName = parts[0]
    const lastNameInitial = parts[parts.length - 1][0]?.toUpperCase() || ''
    return `${firstName} ${lastNameInitial}.`
  }

  const handleGenerateSuccessCard = async () => {
    if (!stats || stats.weightChange >= 0) {
      toast.error('Başarı kartı için kilo kaybı gereklidir.')
      return
    }

    const cardElement = document.getElementById('success-card-container')
    if (!cardElement) {
      toast.error('Kart oluşturulamadı. Sayfayı yenileyin.')
      return
    }

    toast.loading('Başarı kartı hazırlanıyor...', { id: 'generating-card' })

    try {
      const dataUrl = await toPng(cardElement, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1080,
        height: 1920,
      })

      downloadjs(dataUrl, `diyetlik-basari-karti-${client.name.replace(/\s+/g, '-')}.png`, 'image/png')
      
      toast.success('Başarı kartı indirildi!', { id: 'generating-card' })
    } catch (error) {
      console.error('Error generating card:', error)
      toast.error('Kart oluşturulurken bir hata oluştu.', { id: 'generating-card' })
    }
  }

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
      {/* Success Card Generator Button */}
      {stats && stats.weightChange < 0 && (
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Başarı Hikayenizi Paylaşın! 📸</h3>
              <p className="text-white/90">
                Instagram'da paylaşmak için profesyonel bir başarı kartı oluşturun
              </p>
            </div>
            <Button
              onClick={handleGenerateSuccessCard}
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 py-3 flex items-center gap-2"
            >
              <Instagram className="w-5 h-5" />
              Başarı Kartı Oluştur
            </Button>
          </div>
        </div>
      )}

      {/* Hidden Success Card Container */}
      {stats && stats.weightChange < 0 && (
        <div
          id="success-card-container"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: -9999,
            pointerEvents: 'none',
            width: '1080px',
            height: '1920px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '80px 60px',
            boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            backgroundColor: '#667eea',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 600,
                letterSpacing: '2px',
                opacity: 0.9,
                marginBottom: '40px',
              }}
            >
              DİYETLİK BAŞARI HİKAYESİ
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {/* Client Name */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 700,
                marginBottom: '60px',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {getMaskedName(client.name)}
            </div>

            {/* Hero Stat - Weight Loss */}
            <div
              style={{
                fontSize: '180px',
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: '40px',
                textShadow: '0 6px 30px rgba(0,0,0,0.4)',
                background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {Math.abs(stats.weightChange).toFixed(1)}
            </div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: 600,
                marginBottom: '60px',
                opacity: 0.95,
              }}
            >
              KİLO VERDİ
            </div>

            {/* Sub Stats */}
            <div
              style={{
                display: 'flex',
                gap: '30px',
                marginTop: '40px',
              }}
            >
              {stats.daysDiff > 0 && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '20px 40px',
                    fontSize: '28px',
                    fontWeight: 600,
                  }}
                >
                  {stats.daysDiff} GÜNDE
                </div>
              )}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '20px 40px',
                  fontSize: '28px',
                  fontWeight: 600,
                }}
              >
                {stats.totalMeasurements} ÖLÇÜM
              </div>
            </div>

            {/* Progress Percentage */}
            {stats.weightChangePercent < 0 && (
              <div
                style={{
                  marginTop: '40px',
                  fontSize: '36px',
                  fontWeight: 600,
                  opacity: 0.9,
                }}
              >
                %{Math.abs(stats.weightChangePercent).toFixed(1)} Değişim
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              paddingTop: '40px',
              borderTop: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '10px',
                letterSpacing: '1px',
              }}
            >
              DİYETLİK
            </div>
            <div
              style={{
                fontSize: '16px',
                opacity: 0.8,
                letterSpacing: '0.5px',
              }}
            >
              Diyetlik altyapısı ile oluşturulmuştur
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 500,
                marginTop: '8px',
                opacity: 0.9,
              }}
            >
              www.diyetlik.com.tr
            </div>
          </div>
        </div>
      )}

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
