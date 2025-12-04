'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, parseISO, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Instagram, ArrowUp, ArrowDown, Printer, ThumbsUp, AlertTriangle, TrendingDown } from 'lucide-react'
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
  muscle_ratio: number | null
  water_ratio: number | null
  waist_circumference: number | null
  hip_circumference: number | null
  created_at: string
}

type ProgressTabProps = {
  clientId: string
  client: Client
}

export default function ProgressTab({ clientId, client }: ProgressTabProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null)

  useEffect(() => {
    loadMeasurements()
    loadProfile()
  }, [clientId])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
  }

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

  // Calculate BMI
  const bmi = useMemo(() => {
    if (!client.height || measurements.length === 0) return null
    const latestMeasurement = measurements[measurements.length - 1]
    if (!latestMeasurement.weight) return null
    const heightInMeters = client.height / 100
    return latestMeasurement.weight / (heightInMeters * heightInMeters)
  }, [client.height, measurements])

  // Calculate Body Composition Data for Donut Chart
  const bodyCompositionData = useMemo(() => {
    if (measurements.length === 0) return null
    const latestMeasurement = measurements[measurements.length - 1]
    
    const fatRatio = latestMeasurement.body_fat_ratio ?? 0
    const muscleRatio = latestMeasurement.muscle_ratio ?? 0
    const waterRatio = latestMeasurement.water_ratio ?? 0
    const total = fatRatio + muscleRatio + waterRatio
    const remaining = Math.max(0, 100 - total) // Ensure non-negative

    return [
      { name: 'Yağ Kütlesi', value: fatRatio, color: '#f87171' },
      { name: 'Kas Kütlesi', value: muscleRatio, color: '#10b981' },
      { name: 'Su Oranı', value: waterRatio, color: '#3b82f6' },
      { name: 'Diğer Doku', value: remaining, color: '#e5e7eb' },
    ].filter(item => item.value > 0) // Only show segments with values > 0
  }, [measurements])

  // Calculate Summary Metrics for Print Cards
  const summaryMetrics = useMemo(() => {
    if (measurements.length < 2) return null

    const firstMeasurement = measurements[0]
    const latestMeasurement = measurements[measurements.length - 1]

    // Calculate BMI for first and latest
    const calculateBMI = (weight: number | null) => {
      if (!client.height || !weight) return null
      const heightInMeters = client.height / 100
      return weight / (heightInMeters * heightInMeters)
    }

    const firstBMI = calculateBMI(firstMeasurement.weight)
    const latestBMI = calculateBMI(latestMeasurement.weight)
    const bmiChange = firstBMI !== null && latestBMI !== null ? latestBMI - firstBMI : null

    return {
      totalLoss: firstMeasurement.weight !== null && latestMeasurement.weight !== null
        ? latestMeasurement.weight - firstMeasurement.weight
        : null,
      fatChange: firstMeasurement.body_fat_ratio !== null && latestMeasurement.body_fat_ratio !== null
        ? latestMeasurement.body_fat_ratio - firstMeasurement.body_fat_ratio
        : null,
      bmiChange,
    }
  }, [measurements, client.height])

  // Calculate Before & After Comparison
  const comparisonData = useMemo(() => {
    if (measurements.length < 2) return null

    const firstMeasurement = measurements[0]
    const latestMeasurement = measurements[measurements.length - 1]

    // Helper to calculate delta and determine if change is good
    const calculateDelta = (
      first: number | null,
      latest: number | null,
      isLossGood: boolean
    ): { value: number | null; isGood: boolean | null; hasData: boolean } => {
      if (first === null || latest === null) {
        return { value: null, isGood: null, hasData: false }
      }
      const delta = latest - first
      const isGood = isLossGood ? delta < 0 : delta > 0
      return { value: delta, isGood, hasData: true }
    }

    return {
      weight: calculateDelta(firstMeasurement.weight, latestMeasurement.weight, true), // Loss is good
      bodyFat: calculateDelta(
        firstMeasurement.body_fat_ratio,
        latestMeasurement.body_fat_ratio,
        true
      ), // Loss is good
      muscle: calculateDelta(
        firstMeasurement.muscle_ratio,
        latestMeasurement.muscle_ratio,
        false
      ), // Gain is good
      waist: calculateDelta(
        firstMeasurement.waist_circumference,
        latestMeasurement.waist_circumference,
        true
      ), // Loss is good
      hip: calculateDelta(
        firstMeasurement.hip_circumference,
        latestMeasurement.hip_circumference,
        true
      ), // Loss is good
      firstMeasurement,
      latestMeasurement,
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

  // Early return if no measurements
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

  // Check if we have weight data for charts
  const hasWeightData = chartData.length > 0

  const handlePrint = () => {
    window.print()
  }

  // Helper function to determine KPI status and styling
  const getKpiStatus = (
    value: number | null,
    metricType: 'weight' | 'fat' | 'bmi'
  ): {
    status: 'good' | 'bad' | 'critical' | 'neutral'
    bgColor: string
    borderColor: string
    textColor: string
    icon: React.ReactElement | null
    label: string
  } => {
    if (value === null) {
      return {
        status: 'neutral',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-500',
        icon: null,
        label: '-',
      }
    }

    switch (metricType) {
      case 'weight':
        // Weight loss (< 0) is GOOD, weight gain (> 0) is BAD
        if (value < 0) {
          return {
            status: 'good',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-500',
            textColor: 'text-green-700',
            icon: <ThumbsUp className="w-6 h-6 text-green-600" />,
            label: 'Kilo Kaybı',
          }
        } else if (value > 0) {
          return {
            status: 'bad',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-500',
            textColor: 'text-red-700',
            icon: <ArrowUp className="w-6 h-6 text-red-600" />,
            label: 'Kilo Artışı',
          }
        }
        break

      case 'fat':
        // Fat loss (< 0) is GOOD, fat gain (> 0) is CRITICAL
        if (value < 0) {
          return {
            status: 'good',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-500',
            textColor: 'text-green-700',
            icon: <ThumbsUp className="w-6 h-6 text-green-600" />,
            label: 'Yağ Azalması',
          }
        } else if (value > 0) {
          return {
            status: 'critical',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-500',
            textColor: 'text-amber-700',
            icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
            label: 'Yağ Artışı',
          }
        }
        break

      case 'bmi':
        // BMI loss (< 0) is GOOD
        if (value < 0) {
          return {
            status: 'good',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-500',
            textColor: 'text-green-700',
            icon: <TrendingDown className="w-6 h-6 text-green-600" />,
            label: 'VKİ Azalması',
          }
        } else if (value > 0) {
          return {
            status: 'bad',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-500',
            textColor: 'text-red-700',
            icon: <ArrowUp className="w-6 h-6 text-red-600" />,
            label: 'VKİ Artışı',
          }
        }
        break
    }

    // Neutral (value === 0)
    return {
      status: 'neutral',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-500',
      icon: null,
      label: 'Değişim Yok',
    }
  }

  return (
    <div className="space-y-6">
      {/* Print Styles - Aggressive Overrides */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 2cm;
        }
        @media print {
          /* EN KRİTİK: Her şeyi göster ve konumlandırmayı sıfırla */
          body, html, #root, #__next, [data-nextjs-scroll-focus-boundary] {
            visibility: visible !important;
            display: block !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }

          /* Dashboard layout wrapper'ı zorla göster */
          [class*="min-h-screen"],
          [class*="flex"],
          [class*="flex-1"] {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Main wrapper ve container'ları zorla göster */
          main, 
          #printable-report-container,
          .printable-progress-report, 
          .printable-progress-report *,
          #printable-report-container * {
            visibility: visible !important;
            display: block !important;
            position: static !important;
            opacity: 1 !important;
            color: #000 !important;
            background-color: #fff !important;
          }

          /* Grid ve flex container'ları koru */
          .grid {
            display: grid !important;
            visibility: visible !important;
          }

          .flex {
            display: flex !important;
            visibility: visible !important;
          }

          .space-y-6 > * + * {
            margin-top: 1.5rem !important;
          }

          /* Metin Rengi ve Arka Planı Zorla - Sadece printable container içinde */
          #printable-report-container *,
          .printable-progress-report * {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          /* Printable report container ve içeriği */
          #printable-report-container,
          .printable-progress-report {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }

          #printable-report-container *,
          .printable-progress-report * {
            visibility: visible !important;
            color: #000 !important;
            background-color: #fff !important;
          }

          /* Gereksiz elementleri gizle (Sidebar, Header, Buttonlar) */
          .no-print,
          nav,
          header,
          aside,
          [class*="sidebar"],
          [class*="Sidebar"],
          [class*="header"],
          [class*="Header"],
          button:not(.print-button),
          .bg-gradient-to-r {
            display: none !important;
            visibility: hidden !important;
          }

          /* Print header göster */
          .print-header {
            display: block !important;
            visibility: visible !important;
            margin-bottom: 0.5cm !important;
            padding-bottom: 0.3cm !important;
            border-bottom: 1px solid #000 !important;
            color: #000 !important;
            background: #fff !important;
            page-break-after: avoid !important;
          }

          /* Print Layout: Single Column - Natural Flow */
          .print-main-content {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            visibility: visible !important;
            margin-bottom: 0.3cm !important;
          }

          /* KPI Cards - Compact 3-column grid for print */
          .grid.grid-cols-1.md\\:grid-cols-3 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.3cm !important;
            margin-bottom: 0.4cm !important;
            page-break-inside: avoid !important;
          }

          /* Ensure KPI cards are visible in print */
          .bg-green-50,
          .bg-red-50,
          .bg-amber-50,
          .bg-gray-50 {
            background-color: #fff !important;
            border: 1px solid #000 !important;
          }

          .border-green-500,
          .border-red-500,
          .border-amber-500,
          .border-gray-200 {
            border-color: #000 !important;
          }

          /* KPI card text in print */
          .text-green-700,
          .text-red-700,
          .text-amber-700,
          .text-gray-500 {
            color: #000 !important;
          }

          /* KPI card icons in print */
          svg {
            visibility: visible !important;
            display: inline-block !important;
          }

          /* Print sections - Compact */
          .print-section {
            page-break-inside: avoid !important;
            margin-bottom: 0.4cm !important;
            padding: 0.3cm !important;
            visibility: visible !important;
            display: block !important;
            color: #000 !important;
            background: #fff !important;
            border: 1px solid #ccc !important;
          }

          .print-section h3 {
            font-size: 12pt !important;
            margin-bottom: 0.3cm !important;
            font-weight: bold !important;
            color: #000 !important;
          }

          .print-table {
            page-break-inside: avoid !important;
            visibility: visible !important;
          }

          /* Compact chart sizing for print - Dual Y-Axis */
          .print-chart {
            page-break-inside: avoid !important;
            max-height: 200px !important;
            visibility: visible !important;
            padding: 0.2cm !important;
            width: 100% !important;
          }

          .print-chart .recharts-wrapper,
          .print-chart svg {
            max-height: 200px !important;
            height: 200px !important;
            width: 100% !important;
          }

          /* Print Footer */
          .print-footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0.3cm !important;
            padding: 0.3cm !important;
            border-top: 1px solid #000 !important;
            background: #fff !important;
            font-size: 8pt !important;
            color: #000 !important;
          }

          .print-footer img {
            height: 20px !important;
            width: auto !important;
          }

          /* Donut chart - smaller for print */
          .print-donut-container {
            width: 180px !important;
            height: 180px !important;
          }

          /* Stats cards - compact for print */
          .print-stats-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 0.3cm !important;
            margin-bottom: 0.4cm !important;
          }

          .print-stats-grid > div {
            padding: 0.2cm !important;
            font-size: 9pt !important;
          }

          .print-stats-grid p {
            font-size: 9pt !important;
            margin: 0.1cm 0 !important;
          }

          .print-stats-grid .text-2xl {
            font-size: 14pt !important;
          }

          /* Tabloları zorla göster - Ultra Compact for print */
          table, thead, tbody, tr, td, th {
            visibility: visible !important;
            display: table !important;
            color: #000 !important;
            background: #fff !important;
            border-color: #000 !important;
            font-size: 0.75rem !important;
          }

          table th {
            padding: 0.15cm 0.1cm !important;
            font-size: 0.7rem !important;
            font-weight: bold !important;
          }

          table td {
            padding: 0.1cm !important;
            font-size: 0.7rem !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          /* Grafikleri zorla göster */
          svg, canvas {
            visibility: visible !important;
            display: block !important;
          }

          /* Printable container içindeki tüm elementleri göster */
          #printable-report-container div,
          .printable-progress-report div {
            visibility: visible !important;
          }

          /* Hidden success card container'ı gizle */
          #success-card-container {
            display: none !important;
            visibility: hidden !important;
          }
        }
        @media screen {
          .print-header,
          .print-footer {
            display: none;
          }
          .print-main-content {
            display: block !important;
          }
        }
      `}</style>

      {/* Print Header (only visible when printing) */}
      <div className="print-header">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Diyetlik Kapsamlı Gelişim Raporu - {client.name}
        </h1>
        <div className="text-xs text-gray-700 space-y-0.5">
          {profile?.full_name && (
            <p><strong>Hazırlayan:</strong> Dyt. {profile.full_name}</p>
          )}
          <p><strong>Tarih:</strong> {format(new Date(), 'd MMMM yyyy', { locale: tr })}</p>
        </div>
      </div>

      {/* Print Footer (only visible when printing) */}
      <div className="print-footer">
        <img src="/logo.png" alt="Diyetlik Logo" />
        <span>Diyetlik ile hazırlanmıştır.</span>
      </div>

      {/* Print Button */}
      <div className="no-print flex justify-end mb-4">
        <Button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
        >
          <Printer className="w-4 h-4" />
          Gelişim Raporu Yazdır
        </Button>
      </div>

      <div id="printable-report-container" className="printable-progress-report space-y-6">
      {/* Success Card Generator Button */}
      <div className="no-print">
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
              {Math.abs(stats?.weightChange || 0).toFixed(1)}
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
            {stats && stats.weightChangePercent !== undefined && stats.weightChangePercent < 0 && (
              <div
                style={{
                  marginTop: '40px',
                  fontSize: '36px',
                  fontWeight: 600,
                  opacity: 0.9,
                }}
              >
                %{Math.abs(stats.weightChangePercent || 0).toFixed(1)} Değişim
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
      </div>

      {/* Main Content - Single Column for Print */}
      <div className="print-main-content">
        {/* Progress KPI Cards - Top Section */}
        {summaryMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Kilo KPI Card */}
            {(() => {
              const kpi = getKpiStatus(summaryMetrics.totalLoss, 'weight')
              return (
                <div
                  className={`${kpi.bgColor} ${kpi.borderColor} border-2 rounded-lg p-6 shadow-sm transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Kilo Değişimi
                    </h4>
                    {kpi.icon}
                  </div>
                  <div className={`${kpi.textColor} text-3xl font-extrabold mb-1`}>
                    {summaryMetrics.totalLoss !== null
                      ? `${summaryMetrics.totalLoss > 0 ? '+' : ''}${summaryMetrics.totalLoss.toFixed(1)} kg`
                      : '-'}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{kpi.label}</p>
                </div>
              )
            })()}

            {/* Yağ % KPI Card */}
            {(() => {
              const kpi = getKpiStatus(summaryMetrics.fatChange, 'fat')
              return (
                <div
                  className={`${kpi.bgColor} ${kpi.borderColor} border-2 rounded-lg p-6 shadow-sm transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Yağ % Değişimi
                    </h4>
                    {kpi.icon}
                  </div>
                  <div className={`${kpi.textColor} text-3xl font-extrabold mb-1`}>
                    {summaryMetrics.fatChange !== null
                      ? `${summaryMetrics.fatChange > 0 ? '+' : ''}${summaryMetrics.fatChange.toFixed(1)}%`
                      : '-'}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{kpi.label}</p>
                </div>
              )
            })()}

            {/* VKİ KPI Card */}
            {(() => {
              const kpi = getKpiStatus(summaryMetrics.bmiChange, 'bmi')
              return (
                <div
                  className={`${kpi.bgColor} ${kpi.borderColor} border-2 rounded-lg p-6 shadow-sm transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      VKİ Değişimi
                    </h4>
                    {kpi.icon}
                  </div>
                  <div className={`${kpi.textColor} text-3xl font-extrabold mb-1`}>
                    {summaryMetrics.bmiChange !== null
                      ? `${summaryMetrics.bmiChange > 0 ? '+' : ''}${summaryMetrics.bmiChange.toFixed(1)}`
                      : '-'}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{kpi.label}</p>
                </div>
              )
            })()}
          </div>
        )}

        {/* Combined Dual Y-Axis Chart */}
        {hasWeightData && (
          <div className="print-section print-chart bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kilo ve Yağ Oranı İlerlemesi</h3>
            <ResponsiveContainer width="100%" height={300} className="print-chart-container">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Kilo (kg)', angle: -90, position: 'insideLeft' }} />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  label={{ value: 'Yağ Oranı (%)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Kilo (kg)"
                  dot={{ fill: '#10b981', r: 3 }}
                />
                {chartData.some((d) => d.bodyFat !== null) && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="bodyFat"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Yağ Oranı (%)"
                    dot={{ fill: '#3b82f6', r: 3 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
          {/* Before & After Comparison Report Card */}
          {comparisonData && (
            <div className="print-section bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Başlangıçtan Bugüne Gelişim Raporu
            </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Ölçülen Değer
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Başlangıç Değeri
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Güncel Değer
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Fark (±)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Kilo (Weight) */}
                {comparisonData.firstMeasurement.weight !== null &&
                  comparisonData.latestMeasurement.weight !== null && (
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        Kilo (Vücut Ağırlığı)
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.firstMeasurement.weight ?? 0).toFixed(1)} kg
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.latestMeasurement.weight ?? 0).toFixed(1)} kg
                      </td>
                      <td className="py-4 px-4 text-right">
                        {comparisonData.weight.hasData && comparisonData.weight.value !== null && (
                          <div className="flex items-center justify-end gap-2">
                            {comparisonData.weight.isGood ? (
                              <ArrowDown className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowUp className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                comparisonData.weight.isGood
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {comparisonData.weight.value > 0 ? '+' : ''}
                              {comparisonData.weight.value.toFixed(1)} kg
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                {/* Yağ Oranı (Body Fat Ratio) */}
                {comparisonData.firstMeasurement.body_fat_ratio !== null &&
                  comparisonData.latestMeasurement.body_fat_ratio !== null && (
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        Yağ Oranı (%)
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.firstMeasurement.body_fat_ratio ?? 0).toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.latestMeasurement.body_fat_ratio ?? 0).toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 text-right">
                        {comparisonData.bodyFat.hasData && comparisonData.bodyFat.value !== null && (
                          <div className="flex items-center justify-end gap-2">
                            {comparisonData.bodyFat.isGood ? (
                              <ArrowDown className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowUp className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                comparisonData.bodyFat.isGood
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {comparisonData.bodyFat.value > 0 ? '+' : ''}
                              {comparisonData.bodyFat.value.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                {/* Kas Kütlesi (Muscle Ratio) */}
                {comparisonData.firstMeasurement.muscle_ratio !== null &&
                  comparisonData.latestMeasurement.muscle_ratio !== null && (
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        Kas Kütlesi (%)
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.firstMeasurement.muscle_ratio ?? 0).toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.latestMeasurement.muscle_ratio ?? 0).toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 text-right">
                        {comparisonData.muscle.hasData && comparisonData.muscle.value !== null && (
                          <div className="flex items-center justify-end gap-2">
                            {comparisonData.muscle.isGood ? (
                              <ArrowUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                comparisonData.muscle.isGood
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {comparisonData.muscle.value > 0 ? '+' : ''}
                              {comparisonData.muscle.value.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                {/* Bel Çevresi (Waist Circumference) */}
                {comparisonData.firstMeasurement.waist_circumference !== null &&
                  comparisonData.latestMeasurement.waist_circumference !== null && (
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        Bel Çevresi (cm)
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.firstMeasurement.waist_circumference ?? 0).toFixed(1)} cm
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.latestMeasurement.waist_circumference ?? 0).toFixed(1)} cm
                      </td>
                      <td className="py-4 px-4 text-right">
                        {comparisonData.waist.hasData && comparisonData.waist.value !== null && (
                          <div className="flex items-center justify-end gap-2">
                            {comparisonData.waist.isGood ? (
                              <ArrowDown className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowUp className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                comparisonData.waist.isGood
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {comparisonData.waist.value > 0 ? '+' : ''}
                              {comparisonData.waist.value.toFixed(1)} cm
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                {/* Kalça Çevresi (Hip Circumference) */}
                {comparisonData.firstMeasurement.hip_circumference !== null &&
                  comparisonData.latestMeasurement.hip_circumference !== null && (
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        Kalça Çevresi (cm)
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.firstMeasurement.hip_circumference ?? 0).toFixed(1)} cm
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">
                        {(comparisonData.latestMeasurement.hip_circumference ?? 0).toFixed(1)} cm
                      </td>
                      <td className="py-4 px-4 text-right">
                        {comparisonData.hip.hasData && comparisonData.hip.value !== null && (
                          <div className="flex items-center justify-end gap-2">
                            {comparisonData.hip.isGood ? (
                              <ArrowDown className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowUp className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                comparisonData.hip.isGood
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {comparisonData.hip.value > 0 ? '+' : ''}
                              {comparisonData.hip.value.toFixed(1)} cm
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
          {comparisonData.firstMeasurement.date && comparisonData.latestMeasurement.date && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>
                Başlangıç Tarihi:{' '}
                {format(parseISO(comparisonData.firstMeasurement.date), 'd MMMM yyyy', {
                  locale: tr,
                })}
              </p>
              <p className="mt-1">
                Güncel Tarih:{' '}
                {format(parseISO(comparisonData.latestMeasurement.date), 'd MMMM yyyy', {
                  locale: tr,
                })}
              </p>
            </div>
          )}
            </div>
          )}

      </div>
      </div>
    </div>
  )
}
