'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Phone, MessageCircle, Pencil, Target, Flame } from 'lucide-react'
import Link from 'next/link'
import ClientTabs from './ClientTabs'
import EditClientDialog from './EditClientDialog'
import { formatPhoneForWhatsapp } from '@/lib/utils'

// BMI calculation utility
const calculateBMI = (weight: number | null, height: number | null): number | null => {
  if (!weight || !height || height === 0) return null
  // Height is in cm, convert to meters
  const heightInMeters = height / 100
  return weight / (heightInMeters * heightInMeters)
}

const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) {
    return { label: 'Zayıf', color: 'bg-blue-100 text-blue-800 border-blue-200' }
  } else if (bmi < 25) {
    return { label: 'Normal', color: 'bg-green-100 text-green-800 border-green-200' }
  } else if (bmi < 30) {
    return { label: 'Fazla Kilolu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  } else {
    return { label: 'Obez', color: 'bg-red-100 text-red-800 border-red-200' }
  }
}

// Normalize gender value (handles both Turkish and English)
const normalizeGender = (gender: string | null): 'male' | 'female' | null => {
  if (!gender) return null
  const normalized = gender.toLowerCase().trim()
  if (normalized === 'male' || normalized === 'erkek' || normalized === 'm') {
    return 'male'
  }
  if (normalized === 'female' || normalized === 'kadın' || normalized === 'kadin' || normalized === 'f' || normalized === 'k') {
    return 'female'
  }
  return null
}

// Calculate BMR using Mifflin-St Jeor Formula
const calculateBMR = (
  weight: number | null,
  height: number | null,
  age: number | null,
  gender: string | null
): number | null => {
  if (!weight || !height || !age) return null
  
  const normalizedGender = normalizeGender(gender)
  if (!normalizedGender) return null

  // Height is in cm, weight is in kg
  // Male: (10 * weight) + (6.25 * height) - (5 * age) + 5
  // Female: (10 * weight) + (6.25 * height) - (5 * age) - 161
  if (normalizedGender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161
  }
}

// Calculate Ideal Weight Range using BMI Reverse Method
const calculateIdealWeightRange = (height: number | null): { min: number; max: number } | null => {
  if (!height || height === 0) return null
  
  // BMI 18.5 - 24.9 based on height
  // Min Ideal: 18.5 * (height/100)^2
  // Max Ideal: 24.9 * (height/100)^2
  const heightInMeters = height / 100
  const minIdeal = 18.5 * (heightInMeters * heightInMeters)
  const maxIdeal = 24.9 * (heightInMeters * heightInMeters)
  
  return { min: minIdeal, max: maxIdeal }
}

// Format number with Turkish locale
const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

type Client = {
  id: string
  name: string
  phone: string | null
  age: number | null
  height: number | null
  gender: string | null
  notes: string | null
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'measurements' | 'progress' | 'dietlists'>('info')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [latestWeight, setLatestWeight] = useState<number | null>(null)

  useEffect(() => {
    loadClient()
    loadLatestWeight()
  }, [params.id])

  const loadClient = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .eq('dietitian_id', user.id)
      .single()

    if (error || !data) {
      router.push('/clients')
      return
    }

    setClient(data)
    setLoading(false)
  }

  const loadLatestWeight = async () => {
    const { data, error } = await supabase
      .from('measurements')
      .select('weight')
      .eq('client_id', params.id)
      .not('weight', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data?.weight) {
      setLatestWeight(data.weight)
    } else {
      setLatestWeight(null)
    }
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
    return null
  }

  const formattedPhone = formatPhoneForWhatsapp(client.phone)
  const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}` : null

  const handleEditSuccess = () => {
    loadClient()
    setIsEditDialogOpen(false)
    router.refresh()
  }

  const handleDeleteClient = async () => {
    if (!client) return

    // Cascade delete: Delete related data first
    const clientId = client.id

    // Step A: Delete measurements
    const { error: measurementsError } = await supabase
      .from('measurements')
      .delete()
      .eq('client_id', clientId)

    if (measurementsError) {
      alert('Ölçümler silinirken hata: ' + measurementsError.message)
      return
    }

    // Step B: Delete appointments
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .delete()
      .eq('client_id', clientId)

    if (appointmentsError) {
      alert('Randevular silinirken hata: ' + appointmentsError.message)
      return
    }

    // Step C: Delete diet lists
    const { error: dietListsError } = await supabase
      .from('diet_lists')
      .delete()
      .eq('client_id', clientId)

    if (dietListsError) {
      alert('Diyet listeleri silinirken hata: ' + dietListsError.message)
      return
    }

    // Step D: Finally, delete the client
    const { error: clientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (clientError) {
      alert('Danışan silinirken hata: ' + clientError.message)
      return
    }

    // Success: Redirect to clients list
    alert('Danışan ve tüm verileri silindi.')
    router.push('/clients')
  }

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Danışanlara Dön</span>
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Düzenle"
                title="Danışan bilgilerini düzenle"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              {client.age && <span>Yaş: {client.age}</span>}
              {client.height && <span>Boy: {client.height} cm</span>}
              {client.gender && <span>Cinsiyet: {client.gender === 'male' ? 'Erkek' : client.gender === 'female' ? 'Kadın' : 'Diğer'}</span>}
              {latestWeight && (
                <span>Kilo: {formatNumber(latestWeight, 1)} kg</span>
              )}
              {(() => {
                const bmi = calculateBMI(latestWeight, client.height)
                if (bmi !== null) {
                  const category = getBMICategory(bmi)
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${category.color}`}>
                      VKİ: {formatNumber(bmi, 1)} ({category.label})
                    </span>
                  )
                }
                return null
              })()}
            </div>
            
            {/* Smart Calculators: BMR & Ideal Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Ideal Weight Range Card */}
              {(() => {
                const idealWeightRange = calculateIdealWeightRange(client.height)
                if (idealWeightRange) {
                  return (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-blue-700 mb-1">İdeal Kilo Aralığı</p>
                          <p className="text-lg font-bold text-blue-900">
                            {formatNumber(idealWeightRange.min, 1)} - {formatNumber(idealWeightRange.max, 1)} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* BMR Card */}
              {(() => {
                const normalizedGender = normalizeGender(client.gender)
                if (!normalizedGender) {
                  return (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-600 mb-1">Bazal Metabolizma (BMH)</p>
                          <p className="text-sm text-gray-500">Cinsiyet belirtilmedi</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                const bmr = calculateBMR(latestWeight, client.height, client.age, client.gender)
                if (bmr !== null) {
                  return (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-orange-700 mb-1">Bazal Metabolizma (BMH)</p>
                          <p className="text-lg font-bold text-orange-900">
                            {formatNumber(bmr, 0)} kcal
                          </p>
                          <p className="text-xs text-orange-600 mt-1">Günlük Yakım (Hareketsiz)</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
          <div className="flex space-x-3">
            {client.phone && (
              <>
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Ara</span>
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ClientTabs 
        clientId={client.id} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        client={client}
        onMeasurementAdded={loadLatestWeight}
      />

      {/* Edit Client Dialog */}
      {client && (
        <EditClientDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
          onDelete={handleDeleteClient}
          client={client}
        />
      )}
    </div>
  )
}

