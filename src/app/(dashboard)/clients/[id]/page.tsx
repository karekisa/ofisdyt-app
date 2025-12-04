'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import ClientTabs from './ClientTabs'
import EditClientDialog from './EditClientDialog'
import { Client } from '@/lib/types'
import { formatPhoneForWhatsapp } from '@/lib/utils'
import { toast } from 'sonner'

// BMI Goal Meter Component
function BMIGoalMeter({ bmi }: { bmi: number }) {
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
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
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
          className="absolute top-0 h-full w-1 bg-gray-900 z-10"
          style={{ left: `${Math.min(100, Math.max(0, currentPosition))}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded font-semibold">
              {bmi.toFixed(1)}
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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
        <span className="text-sm text-gray-600">Durum:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${category.color}`}>
          {category.label}
        </span>
      </div>
    </div>
  )
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [stats, setStats] = useState<{
    bmi: number | null
    idealWeight: number | null
  }>({
    bmi: null,
    idealWeight: null,
  })

  useEffect(() => {
    loadData()
  }, [clientId])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Fetch client data
    const { data: clientData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      alert('Danışan yüklenirken hata: ' + error.message)
      router.push('/clients')
      return
    }

    if (clientData) {
      setClient(clientData as Client)
    }

    // Calculate BMI/Ideal Weight
    if (clientData) {
      calculateStats(clientData as Client)
    } else {
      setLoading(false)
    }
  }

  const calculateStats = async (clientData: Client) => {
    if (!clientData.height) {
      setLoading(false)
      return
    }

    // Get latest weight
    const { data: latestMeasurement } = await supabase
      .from('measurements')
      .select('weight')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    const weight = latestMeasurement?.weight

    if (weight && clientData.height) {
      // BMI calculation
      const heightInMeters = clientData.height / 100
      const bmi = weight / (heightInMeters * heightInMeters)

      // Ideal Weight (BMI 22)
      const idealWeight = 22 * heightInMeters * heightInMeters

      setStats({ bmi, idealWeight })
    }

    setLoading(false)
  }

  const handleClientUpdated = () => {
    loadData()
    setIsEditDialogOpen(false)
  }

  const handleSendWhatsApp = () => {
    if (!client?.phone) {
      toast.error('Geçersiz telefon numarası.')
      return
    }

    const normalizedPhone = formatPhoneForWhatsapp(client.phone)
    if (!normalizedPhone) {
      toast.error('Geçersiz telefon numarası.')
      return
    }

    const whatsappUrl = `https://wa.me/${normalizedPhone}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Danışan bulunamadı</p>
        <Link
          href="/clients"
          className="mt-4 inline-block text-green-600 hover:text-green-700"
        >
          Danışanlara Dön
        </Link>
      </div>
    )
  }


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Danışanlara Dön</span>
        </Link>
        <div className="flex items-center gap-2">
          {client.phone && (
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Mesaj At</span>
            </button>
          )}
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Edit className="w-4 h-4" />
            <span>Düzenle</span>
          </button>
        </div>
      </div>

      {/* Client Info Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{client.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {client.phone && (
            <div>
              <p className="text-sm text-gray-500">Telefon</p>
              <p className="text-gray-900 font-medium">{client.phone}</p>
            </div>
          )}
          {client.age && (
            <div>
              <p className="text-sm text-gray-500">Yaş</p>
              <p className="text-gray-900 font-medium">{client.age}</p>
            </div>
          )}
          {client.height && (
            <div>
              <p className="text-sm text-gray-500">Boy</p>
              <p className="text-gray-900 font-medium">{client.height} cm</p>
            </div>
          )}
        </div>

        {/* BMI Stats with Goal Meter */}
        {stats.bmi !== null && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">VKİ (BMI)</p>
                <p className="text-gray-900 font-medium text-lg">{stats.bmi.toFixed(1)}</p>
              </div>
              {(client.target_weight !== null || stats.idealWeight !== null) && (
                <div>
                  <p className="text-sm text-gray-500">Hedef Kilo</p>
                  <p className="text-gray-900 font-medium text-lg">
                    {(client.target_weight ?? stats.idealWeight)?.toFixed(1)} kg
                  </p>
                </div>
              )}
            </div>
            
            {/* BMI Goal Meter */}
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">VKİ Durumu</p>
              <BMIGoalMeter bmi={stats.bmi} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <ClientTabs
        clientId={clientId}
        client={client}
      />

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <EditClientDialog
          client={client}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleClientUpdated}
        />
      )}
    </div>
  )
}
