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
import { ArrowUp, ArrowDown, Download, ThumbsUp, AlertTriangle, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

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
  arm_circumference: number | null
  leg_circumference: number | null
  created_at: string
}

type ProgressTabProps = {
  clientId: string
  client: Client
}

export default function ProgressTab({ clientId, client }: ProgressTabProps) {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS OR LOGIC
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)

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

  // Calculate ideal weight (BMI 22)
  const idealWeight = useMemo(() => {
    if (!client.height) return null
    const heightInMeters = client.height / 100
    return 22 * heightInMeters * heightInMeters
  }, [client.height])

  // BMI Goal Meter Component
  const BMIGoalMeter = ({ bmi }: { bmi: number }) => {
    const minBMI = 16
    const maxBMI = 35
    const normalMin = 18.5
    const normalMax = 24.9
    const overweightMin = 25
    const obeseMin = 30

    // Calculate positions as percentages
    const currentPosition = ((bmi - minBMI) / (maxBMI - minBMI)) * 100
    const normalStart = ((normalMin - minBMI) / (maxBMI - minBMI)) * 100
    const normalEnd = ((normalMax - minBMI) / (maxBMI - minBMI)) * 100
    const overweightStart = ((overweightMin - minBMI) / (maxBMI - minBMI)) * 100
    const obeseStart = ((obeseMin - minBMI) / (maxBMI - minBMI)) * 100

    // Determine BMI category
    const getBMICategory = () => {
      if (bmi < 18.5) return { label: 'Zayıf', color: 'bg-blue-500' }
      if (bmi < 25) return { label: 'Normal', color: 'bg-green-500' }
      if (bmi < 30) return { label: 'Fazla Kilolu', color: 'bg-yellow-500' }
      return { label: 'Obez', color: 'bg-red-500' }
    }

    const category = getBMICategory()

    return (
      <div className="space-y-2">
        {/* BMI Bar */}
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
          {/* Underweight zone (16-18.5) */}
          <div
            className="absolute h-full bg-blue-300"
            style={{ left: '0%', width: `${normalStart}%` }}
          />
          {/* Normal zone (18.5-24.9) */}
          <div
            className="absolute h-full bg-green-500"
            style={{ left: `${normalStart}%`, width: `${normalEnd - normalStart}%` }}
          />
          {/* Overweight zone (25-29.9) */}
          <div
            className="absolute h-full bg-yellow-500"
            style={{ left: `${overweightStart}%`, width: `${obeseStart - overweightStart}%` }}
          />
          {/* Obese zone (30-35) */}
          <div
            className="absolute h-full bg-red-500"
            style={{ left: `${obeseStart}%`, width: `${100 - obeseStart}%` }}
          />
          
          {/* Current BMI Indicator */}
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-900 z-10"
            style={{ left: `${Math.min(100, Math.max(0, currentPosition))}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                {bmi.toFixed(1)}
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-0.5 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-gray-600">
          <span>16</span>
          <span className="text-green-600 font-semibold">18.5</span>
          <span className="text-yellow-600 font-semibold">25</span>
          <span className="text-red-600 font-semibold">30</span>
          <span>35</span>
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Durum:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${category.color}`}>
            {category.label}
          </span>
        </div>
      </div>
    )
  }

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

  // Calculate Goal Progress (using client.target_weight or BMI 22 as fallback)
  const goalProgress = useMemo(() => {
    if (!client.height || measurements.length === 0) return null
    
    const firstMeasurement = measurements[0]
    const latestMeasurement = measurements[measurements.length - 1]
    
    if (!firstMeasurement.weight || !latestMeasurement.weight) return null
    
    // Use client's target_weight if set, otherwise calculate ideal weight (BMI 22)
    const heightInMeters = client.height / 100
    const targetWeight = client.target_weight ?? (22 * heightInMeters * heightInMeters)
    
    // Calculate total weight loss needed (or gain if target is higher)
    const totalWeightToLose = firstMeasurement.weight - targetWeight
    
    // Calculate current weight loss
    const currentWeightLoss = firstMeasurement.weight - latestMeasurement.weight
    
    // Calculate progress percentage (0-100%)
    // If target is to lose weight, progress is positive
    // If target is to gain weight, we need to reverse the calculation
    let progressPercent = 0
    if (totalWeightToLose > 0) {
      // Need to lose weight
      progressPercent = Math.min(100, Math.max(0, (currentWeightLoss / totalWeightToLose) * 100))
    } else if (totalWeightToLose < 0) {
      // Need to gain weight
      const totalWeightToGain = Math.abs(totalWeightToLose)
      const currentWeightGain = Math.max(0, latestMeasurement.weight - firstMeasurement.weight)
      progressPercent = Math.min(100, Math.max(0, (currentWeightGain / totalWeightToGain) * 100))
    } else {
      // Already at target
      progressPercent = 100
    }
    
    // Remaining weight to lose/gain
    const remainingWeight = Math.abs(totalWeightToLose - currentWeightLoss)
    
    return {
      targetWeight,
      totalWeightToLose,
      currentWeightLoss,
      progressPercent,
      remainingWeight,
      firstWeight: firstMeasurement.weight,
      currentWeight: latestMeasurement.weight,
    }
  }, [measurements, client.height, client.target_weight])

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
      muscleChange: firstMeasurement.muscle_ratio !== null && latestMeasurement.muscle_ratio !== null
        ? latestMeasurement.muscle_ratio - firstMeasurement.muscle_ratio
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
      water: calculateDelta(
        firstMeasurement.water_ratio,
        latestMeasurement.water_ratio,
        false
      ), // Gain is good (hydration)
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
      arm: calculateDelta(
        firstMeasurement.arm_circumference,
        latestMeasurement.arm_circumference,
        false
      ), // Gain is good (muscle)
      leg: calculateDelta(
        firstMeasurement.leg_circumference,
        latestMeasurement.leg_circumference,
        false
      ), // Gain is good (muscle)
      firstMeasurement,
      latestMeasurement,
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

  const handleDownloadReport = async () => {
    try {
      setGeneratingImage(true)
      toast.info('Rapor görseli oluşturuluyor...')

      // Wait a bit for the component to render
      await new Promise((resolve) => setTimeout(resolve, 500))

      const container = document.getElementById('full-report-capture')
      if (!container) {
        toast.error('Rapor görseli oluşturulamadı. Lütfen tekrar deneyin.')
        setGeneratingImage(false)
        return
      }

      // A4 aspect ratio: 1080x1530px (portrait)
      const width = 1080
      const height = 1530

      // Generate image with high resolution
      const dataUrl = await toPng(container, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: width,
        height: height,
        canvasWidth: width * 2, // High DPI
        canvasHeight: height * 2, // High DPI
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      })

      // Create download link
      const link = document.createElement('a')
      const dateStr = format(new Date(), 'yyyy-MM-dd', { locale: tr })
      link.download = `gelisim-raporu-diyetlik-${dateStr}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Rapor görseli indirildi!')
    } catch (error) {
      console.error('Error generating report image:', error)
      toast.error('Rapor görseli oluşturulurken hata oluştu')
    } finally {
      setGeneratingImage(false)
    }
  }

  // Helper function to determine KPI status and styling
  const getKpiStatus = (
    value: number | null,
    metricType: 'weight' | 'fat' | 'bmi' | 'muscle'
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

      case 'muscle':
        // Muscle gain (> 0) is GOOD, muscle loss (< 0) is BAD
        if (value > 0) {
          return {
            status: 'good',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-500',
            textColor: 'text-green-700',
            icon: <ArrowUp className="w-6 h-6 text-green-600" />,
            label: 'Kas Artışı',
          }
        } else if (value < 0) {
          return {
            status: 'bad',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-500',
            textColor: 'text-red-700',
            icon: <ArrowDown className="w-6 h-6 text-red-600" />,
            label: 'Kas Azalması',
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
      {/* Report Container Styles for Image Generation */}
      <style jsx global>{`
        #full-report-capture {
          width: 1080px;
          min-height: 1530px;
          background: white;
          padding: 40px;
          box-sizing: border-box;
        }
      `}</style>

      {/* Download Button */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={handleDownloadReport}
          disabled={generatingImage}
          className="inline-flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-6 py-3 text-base font-semibold shadow-md disabled:opacity-50"
        >
          {generatingImage ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Oluşturuluyor...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Gelişim Raporunu İndir (PNG)
            </>
          )}
        </Button>
      </div>

      {/* Report Content Container for Image Capture */}
      <div id="full-report-capture" className="mx-auto">
        {/* Report Header */}
        <div className="mb-8 pb-4 border-b border-gray-300">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-center">
            KAPSAMLI GELİŞİM RAPORU
          </h1>
          {/* Client Name and Age - Prominently Displayed */}
          <div className="text-xl text-gray-900 space-y-1 text-center font-bold mb-3">
            <p className="text-2xl">{client.name}</p>
            {client.age && <p>Yaş: {client.age}</p>}
          </div>
          <div className="text-base text-gray-700 space-y-0.5 text-center">
            {profile?.full_name && (
              <p><strong>Hazırlayan:</strong> Dyt. {profile.full_name}</p>
            )}
            <p><strong>Tarih:</strong> {format(new Date(), 'd MMMM yyyy', { locale: tr })}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Top Info Row: VKİ, Hedef Kilo, and BMI Status Badge */}
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-3">
              {bmi !== null && (
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-lg text-gray-600 mb-1">VKİ (BMI)</p>
                  <p className="text-4xl font-bold text-gray-900">{bmi.toFixed(1)}</p>
                </div>
              )}
              {(client.target_weight !== null || idealWeight !== null) && (
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-lg text-gray-600 mb-1">Hedef Kilo</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {(client.target_weight ?? idealWeight)?.toFixed(1)} kg
                  </p>
                </div>
              )}
              {/* BMI Status Badge */}
              {bmi !== null && (() => {
                const getBMICategory = () => {
                  if (bmi < 18.5) return { label: 'Zayıf', color: 'bg-blue-500' }
                  if (bmi < 25) return { label: 'Normal', color: 'bg-green-500' }
                  if (bmi < 30) return { label: 'Fazla Kilolu', color: 'bg-yellow-500' }
                  return { label: 'Obez', color: 'bg-red-500' }
                }
                const category = getBMICategory()
                return (
                  <div className="bg-white border border-gray-300 rounded p-3 text-center flex flex-col justify-center">
                    <p className="text-lg text-gray-600 mb-1">Durum</p>
                    <span className={`px-3 py-1 rounded-full text-base font-semibold text-white ${category.color}`}>
                      {category.label}
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Change Metrics (KPI Summary): Kilo, Yağ, Kas Kütlesi */}
          {summaryMetrics && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Kilo Değişimi KPI Card */}
              {(() => {
                const kpi = getKpiStatus(summaryMetrics.totalLoss, 'weight')
                return (
                  <div
                    className={`${kpi.bgColor} ${kpi.borderColor} border-2 rounded-lg p-4 shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-700 uppercase tracking-wide">
                        Kilo Değişimi
                      </h4>
                      {kpi.icon}
                    </div>
                    <div className={`${kpi.textColor} text-5xl font-extrabold mb-1`}>
                      {summaryMetrics.totalLoss !== null
                        ? `${summaryMetrics.totalLoss > 0 ? '+' : ''}${summaryMetrics.totalLoss.toFixed(1)} kg`
                        : '-'}
                    </div>
                    <p className="text-base text-gray-500 mt-1">{kpi.label}</p>
                  </div>
                )
              })()}

              {/* Yağ % Değişimi KPI Card */}
              {(() => {
                const kpi = getKpiStatus(summaryMetrics.fatChange, 'fat')
                return (
                  <div
                    className={`${kpi.bgColor} ${kpi.borderColor} border-2 rounded-lg p-4 shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-700 uppercase tracking-wide">
                        Yağ % Değişimi
                      </h4>
                      {kpi.icon}
                    </div>
                    <div className={`${kpi.textColor} text-5xl font-extrabold mb-1`}>
                      {summaryMetrics.fatChange !== null
                        ? `${summaryMetrics.fatChange > 0 ? '+' : ''}${summaryMetrics.fatChange.toFixed(1)}%`
                        : '-'}
                    </div>
                    <p className="text-base text-gray-500 mt-1">{kpi.label}</p>
                  </div>
                )
              })()}

              {/* Kas Kütlesi Değişimi KPI Card */}
              {(() => {
                const kpi = getKpiStatus(summaryMetrics.muscleChange, 'muscle')
                return (
                  <div
                    className={`${kpi.bgColor} ${kpi.borderColor} border-2 rounded-lg p-4 shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-700 uppercase tracking-wide">
                        Kas Kütlesi Değişimi
                      </h4>
                      {kpi.icon}
                    </div>
                    <div className={`${kpi.textColor} text-5xl font-extrabold mb-1`}>
                      {summaryMetrics.muscleChange !== null
                        ? `${summaryMetrics.muscleChange > 0 ? '+' : ''}${summaryMetrics.muscleChange.toFixed(1)}%`
                        : '-'}
                    </div>
                    <p className="text-base text-gray-500 mt-1">{kpi.label}</p>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Before & After Comparison Report Card */}
          {comparisonData && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-3xl font-semibold text-gray-900 mb-4">
                Başlangıçtan Bugüne Gelişim Raporu
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-lg font-semibold text-gray-700">
                        Ölçülen Değer
                      </th>
                      <th className="text-right py-3 px-3 text-lg font-semibold text-gray-700">
                        Başlangıç Değeri
                      </th>
                      <th className="text-right py-3 px-3 text-lg font-semibold text-gray-700">
                        Güncel Değer
                      </th>
                      <th className="text-right py-3 px-3 text-lg font-semibold text-gray-700">
                        Fark (±)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Helper function to render table row */}
                    {(() => {
                      const renderMetricRow = (
                        label: string,
                        firstValue: number | null | undefined,
                        latestValue: number | null | undefined,
                        delta: { value: number | null; isGood: boolean | null; hasData: boolean } | null,
                        unit: string,
                        isGainGood: boolean = false,
                        isCircumference: boolean = false
                      ) => {
                        // For circumference, 0 is invalid (missing data)
                        // For other metrics, check only null/undefined
                        const hasFirst = firstValue !== null && firstValue !== undefined && (!isCircumference || firstValue !== 0)
                        const hasLatest = latestValue !== null && latestValue !== undefined && (!isCircumference || latestValue !== 0)

                        return (
                          <tr className="hover:bg-gray-50">
                            <td className="py-3 px-3 text-base font-medium text-gray-900">
                              {label}
                            </td>
                            <td className="py-3 px-3 text-base text-gray-600 text-right">
                              {hasFirst ? `${firstValue.toFixed(1)} ${unit}` : '-'}
                            </td>
                            <td className="py-3 px-3 text-base text-gray-600 text-right">
                              {hasLatest ? `${latestValue.toFixed(1)} ${unit}` : '-'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {delta?.hasData && delta.value !== null ? (
                                <div className="flex items-center justify-end gap-2">
                                  {delta.isGood ? (
                                    isGainGood ? (
                                      <ArrowUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <ArrowDown className="w-5 h-5 text-green-600" />
                                    )
                                  ) : (
                                    isGainGood ? (
                                      <ArrowDown className="w-5 h-5 text-red-600" />
                                    ) : (
                                      <ArrowUp className="w-5 h-5 text-red-600" />
                                    )
                                  )}
                                  <span
                                    className={`text-base font-semibold ${
                                      delta.isGood
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {delta.value > 0 ? '+' : ''}
                                    {delta.value.toFixed(1)} {unit}
                                  </span>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <>
                          {/* 1. Kilo (Weight) */}
                          {renderMetricRow(
                            'Kilo (Vücut Ağırlığı)',
                            comparisonData.firstMeasurement.weight,
                            comparisonData.latestMeasurement.weight,
                            comparisonData.weight,
                            'kg',
                            false
                          )}

                          {/* 2. Yağ Oranı (%) */}
                          {renderMetricRow(
                            'Yağ Oranı (%)',
                            comparisonData.firstMeasurement.body_fat_ratio,
                            comparisonData.latestMeasurement.body_fat_ratio,
                            comparisonData.bodyFat,
                            '%',
                            false
                          )}

                          {/* 3. Kas Kütlesi (%) */}
                          {renderMetricRow(
                            'Kas Kütlesi (%)',
                            comparisonData.firstMeasurement.muscle_ratio,
                            comparisonData.latestMeasurement.muscle_ratio,
                            comparisonData.muscle,
                            '%',
                            true
                          )}

                          {/* 4. Vücut Su Oranı (%) */}
                          {renderMetricRow(
                            'Vücut Su Oranı (%)',
                            comparisonData.firstMeasurement.water_ratio,
                            comparisonData.latestMeasurement.water_ratio,
                            comparisonData.water,
                            '%',
                            true
                          )}

                          {/* 5. Bel Çevresi (cm) */}
                          {renderMetricRow(
                            'Bel Çevresi (cm)',
                            comparisonData.firstMeasurement.waist_circumference,
                            comparisonData.latestMeasurement.waist_circumference,
                            comparisonData.waist,
                            'cm',
                            false,
                            true
                          )}

                          {/* 6. Kalça Çevresi (cm) */}
                          {renderMetricRow(
                            'Kalça Çevresi (cm)',
                            comparisonData.firstMeasurement.hip_circumference,
                            comparisonData.latestMeasurement.hip_circumference,
                            comparisonData.hip,
                            'cm',
                            false,
                            true
                          )}

                          {/* 7. Kol Çevresi (cm) */}
                          {renderMetricRow(
                            'Kol Çevresi (cm)',
                            comparisonData.firstMeasurement.arm_circumference,
                            comparisonData.latestMeasurement.arm_circumference,
                            comparisonData.arm,
                            'cm',
                            true,
                            true
                          )}

                          {/* 8. Bacak Çevresi (cm) */}
                          {renderMetricRow(
                            'Bacak Çevresi (cm)',
                            comparisonData.firstMeasurement.leg_circumference,
                            comparisonData.latestMeasurement.leg_circumference,
                            comparisonData.leg,
                            'cm',
                            true,
                            true
                          )}
                        </>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
              {comparisonData.firstMeasurement.date && comparisonData.latestMeasurement.date && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  <p className="mb-1">
                    Başlangıç Tarihi:{' '}
                    {format(parseISO(comparisonData.firstMeasurement.date), 'd MMMM yyyy', {
                      locale: tr,
                    })}
                  </p>
                  <p>
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

        {/* Report Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 flex items-center justify-center gap-3">
          <img src="/logo.png" alt="Diyetlik Logo" className="h-8" />
          <span className="text-base text-gray-600">Diyetlik ile yapılmıştır.</span>
        </div>
      </div>
    </div>
  )
}
