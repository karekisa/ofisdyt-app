'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import ClientTabs from './ClientTabs'
import EditClientDialog from './EditClientDialog'
import { Client } from '@/lib/types'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [profession, setProfession] = useState<'dietitian' | 'psychologist' | 'pt' | 'consultant' | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [stats, setStats] = useState<{
    bmi: number | null
    bmr: number | null
    idealWeight: number | null
  }>({
    bmi: null,
    bmr: null,
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

    // Fetch user's profession
    const { data: profile } = await supabase
      .from('profiles')
      .select('profession')
      .eq('id', user.id)
      .single()

    if (profile) {
      setProfession(profile.profession as typeof profession)
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

    // Calculate BMI/BMR/Ideal Weight if dietitian
    if (profile?.profession === 'dietitian' && clientData) {
      calculateStats(clientData as Client)
    } else {
      setLoading(false)
    }
  }

  const calculateStats = async (clientData: Client) => {
    if (!clientData.height || !clientData.age || !clientData.gender) {
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

      // BMR calculation (Mifflin-St Jeor Equation)
      let bmr: number | null = null
      if (clientData.gender === 'male') {
        bmr = 10 * weight + 6.25 * clientData.height - 5 * clientData.age + 5
      } else if (clientData.gender === 'female') {
        bmr = 10 * weight + 6.25 * clientData.height - 5 * clientData.age - 161
      }

      // Ideal Weight (BMI 22)
      const idealWeight = 22 * heightInMeters * heightInMeters

      setStats({ bmi, bmr, idealWeight })
    }

    setLoading(false)
  }

  const handleClientUpdated = () => {
    loadData()
    setIsEditDialogOpen(false)
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
        <button
          onClick={() => setIsEditDialogOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Edit className="w-4 h-4" />
          <span>Düzenle</span>
        </button>
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

        {/* BMI/BMR Stats (only for dietitians) */}
        {profession === 'dietitian' && (stats.bmi !== null || stats.bmr !== null || stats.idealWeight !== null) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            {stats.bmi !== null && (
              <div>
                <p className="text-sm text-gray-500">BMI</p>
                <p className="text-gray-900 font-medium text-lg">{stats.bmi.toFixed(1)}</p>
              </div>
            )}
            {stats.bmr !== null && (
              <div>
                <p className="text-sm text-gray-500">BMR (kcal/gün)</p>
                <p className="text-gray-900 font-medium text-lg">{Math.round(stats.bmr)}</p>
              </div>
            )}
            {stats.idealWeight !== null && (
              <div>
                <p className="text-sm text-gray-500">İdeal Kilo</p>
                <p className="text-gray-900 font-medium text-lg">{stats.idealWeight.toFixed(1)} kg</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <ClientTabs
        clientId={clientId}
        client={client}
        profession={profession}
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
